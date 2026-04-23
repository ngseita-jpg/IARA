import { NextRequest, NextResponse } from 'next/server'
import { stripe, priceIdToPlano } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { emailBoasVindasPago } from '@/lib/email'
import type Stripe from 'stripe'

// Webhook precisa de body raw — não usar createClient do server (cookies)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const runtime = 'nodejs'

async function setPlano(userId: string, plano: string, subscriptionId: string) {
  // Atualiza plano primeiro — query separada para não falhar se a coluna stripe ainda não existir
  await supabaseAdmin
    .from('creator_profiles')
    .update({ plano })
    .eq('user_id', userId)

  // Tenta salvar o subscription_id (ignora erro se coluna ainda não existe)
  try {
    await supabaseAdmin
      .from('creator_profiles')
      .update({ stripe_subscription_id: subscriptionId })
      .eq('user_id', userId)
  } catch { /* coluna pode não existir ainda */ }
}

// Ativa indicação de afiliado na primeira fatura paga após o trial
async function ativarIndicacao(indicadoUserId: string, valorPago: number, subscriptionId: string, plano: string) {
  const { data: indicacao } = await supabaseAdmin
    .from('iara_indicacoes')
    .select('id, status')
    .eq('indicado_user_id', indicadoUserId)
    .maybeSingle()

  if (!indicacao || indicacao.status !== 'pendente') return

  const comissaoPrimeira = Math.round(valorPago * 0.5 * 100) / 100
  const recorrenteMensal = Math.round(valorPago * 0.10 * 100) / 100

  await supabaseAdmin
    .from('iara_indicacoes')
    .update({
      status: 'ativada',
      plano,
      stripe_subscription_id: subscriptionId,
      valor_primeira_venda: valorPago,
      valor_recorrente_mensal: recorrenteMensal,
      valor_total_apurado: comissaoPrimeira,
      ativada_at: new Date().toISOString(),
    })
    .eq('id', indicacao.id)

  await supabaseAdmin
    .from('iara_indicacoes_eventos')
    .insert({
      indicacao_id: indicacao.id,
      tipo: 'primeira_venda',
      valor_pagamento: valorPago,
      pct_comissao: 50,
      valor_comissao: comissaoPrimeira,
    })
}

// Registra comissão recorrente a cada fatura paga (até 12 meses)
async function registrarRecorrencia(subscriptionId: string, valorPago: number, invoiceId: string) {
  const { data: indicacao } = await supabaseAdmin
    .from('iara_indicacoes')
    .select('id, meses_recorrencia_pagos, meses_recorrencia_total, status')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()

  if (!indicacao || indicacao.status !== 'ativada') return
  if (indicacao.meses_recorrencia_pagos >= indicacao.meses_recorrencia_total) return

  const comissao = Math.round(valorPago * 0.10 * 100) / 100

  await supabaseAdmin
    .from('iara_indicacoes_eventos')
    .insert({
      indicacao_id: indicacao.id,
      tipo: 'recorrencia',
      valor_pagamento: valorPago,
      pct_comissao: 10,
      valor_comissao: comissao,
      stripe_invoice_id: invoiceId,
    })

  await supabaseAdmin
    .from('iara_indicacoes')
    .update({
      meses_recorrencia_pagos: indicacao.meses_recorrencia_pagos + 1,
    })
    .eq('id', indicacao.id)

  // Recalcula total_apurado do zero (mais confiável que increment)
  const { data: totais } = await supabaseAdmin
    .from('iara_indicacoes_eventos')
    .select('valor_comissao, tipo')
    .eq('indicacao_id', indicacao.id)

  const total = (totais ?? [])
    .filter(e => e.tipo !== 'estorno')
    .reduce((sum, e) => sum + Number(e.valor_comissao), 0)

  await supabaseAdmin
    .from('iara_indicacoes')
    .update({ valor_total_apurado: total })
    .eq('id', indicacao.id)
}

// Estorna comissões quando assinatura é cancelada com reembolso
async function estornarIndicacao(subscriptionId: string, motivo: string) {
  const { data: indicacao } = await supabaseAdmin
    .from('iara_indicacoes')
    .select('id, valor_total_apurado, status')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()

  if (!indicacao) return

  await supabaseAdmin
    .from('iara_indicacoes_eventos')
    .insert({
      indicacao_id: indicacao.id,
      tipo: 'estorno',
      valor_pagamento: 0,
      pct_comissao: 0,
      valor_comissao: -Number(indicacao.valor_total_apurado ?? 0),
    })

  await supabaseAdmin
    .from('iara_indicacoes')
    .update({
      status: 'cancelada',
      cancelada_at: new Date().toISOString(),
    })
    .eq('id', indicacao.id)

  console.log(`[indicacao] estornada: ${indicacao.id} — ${motivo}`)
}

async function enviarBoasVindas(userId: string, plano: string) {
  if (plano === 'free' || !['plus', 'premium', 'profissional', 'agencia'].includes(plano)) return
  try {
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (!user?.email) return
    const { data: perfil } = await supabaseAdmin
      .from('creator_profiles')
      .select('nome_artistico, full_name')
      .eq('user_id', userId)
      .maybeSingle()
    await emailBoasVindasPago({
      userEmail: user.email,
      userNome: perfil?.nome_artistico ?? perfil?.full_name ?? null,
      plano: plano as 'plus' | 'premium' | 'profissional' | 'agencia',
    })
  } catch { /* não bloqueia o webhook */ }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const secret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch {
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const planoEscolhido = session.metadata?.plano
      const subId = session.subscription as string
      if (userId && planoEscolhido && subId) {
        // Busca a subscription pra saber se está em trial
        const sub = await stripe.subscriptions.retrieve(subId)
        const emTrial = sub.status === 'trialing'
        // Durante trial, plano = 'trial' (limites reduzidos). Ao ativar, plano real.
        await setPlano(userId, emTrial ? 'trial' : planoEscolhido, subId)
        // Email de boas-vindas só quando já paga (não no trial)
        if (!emTrial) await enviarBoasVindas(userId, planoEscolhido)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      const planoMeta = sub.metadata?.plano
      const priceId = sub.items.data[0]?.price.id
      const planoByPrice = priceId ? priceIdToPlano(priceId) : null
      const planoEscolhido = planoMeta ?? planoByPrice
      if (!userId || !planoEscolhido) break

      const emTrial = sub.status === 'trialing'
      const ativo = sub.status === 'active'
      const cancelado = ['canceled', 'unpaid', 'incomplete_expired'].includes(sub.status)

      if (cancelado) {
        await supabaseAdmin
          .from('creator_profiles')
          .update({ plano: 'free', stripe_subscription_id: null })
          .eq('user_id', userId)
        await estornarIndicacao(sub.id, `status=${sub.status}`)
      } else if (emTrial) {
        await setPlano(userId, 'trial', sub.id)
      } else if (ativo) {
        // Detecta transição trial → active (cobrança aprovada, primeira vez)
        const { data: atual } = await supabaseAdmin
          .from('creator_profiles')
          .select('plano')
          .eq('user_id', userId)
          .maybeSingle()
        await setPlano(userId, planoEscolhido, sub.id)
        if (atual?.plano === 'trial') {
          // Saiu de trial pra active → envia welcome agora
          await enviarBoasVindas(userId, planoEscolhido)
          // Ativa comissão de afiliado (se houver indicação pendente)
          const valorPlano = sub.items.data[0]?.price.unit_amount
          if (valorPlano) {
            await ativarIndicacao(userId, valorPlano / 100, sub.id, planoEscolhido)
          }
        }
      }
      break
    }

    case 'invoice.paid': {
      // Fatura recorrente paga → pode gerar comissão de afiliado
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string; billing_reason?: string }
      const subId = invoice.subscription
      if (!subId) break
      // Só conta recorrências (pula a primeira, que já foi tratada em subscription.updated)
      if (invoice.billing_reason === 'subscription_create' || invoice.billing_reason === 'subscription_cycle') {
        if (invoice.billing_reason === 'subscription_cycle') {
          const valorPago = (invoice.amount_paid ?? 0) / 100
          await registrarRecorrencia(subId as string, valorPago, invoice.id ?? '')
        }
      }
      break
    }

    case 'charge.refunded':
    case 'invoice.payment_failed': {
      const obj = event.data.object as Stripe.Charge | Stripe.Invoice
      const subId = 'subscription' in obj ? (obj.subscription as string | null) : null
      if (subId) await estornarIndicacao(subId, event.type)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (userId) {
        await supabaseAdmin
          .from('creator_profiles')
          .update({ plano: 'free', stripe_subscription_id: null })
          .eq('user_id', userId)
      }
      await estornarIndicacao(sub.id, 'subscription_deleted')
      break
    }
  }

  return NextResponse.json({ received: true })
}
