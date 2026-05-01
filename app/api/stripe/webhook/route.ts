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

// Atualiza plano no brand_profiles (fluxo de MARCA)
async function setPlanoMarca(userId: string, plano: string, periodo: string, subscriptionId: string | null) {
  await supabaseAdmin
    .from('brand_profiles')
    .update({
      plano,
      plano_periodo: periodo,
      stripe_subscription_id: subscriptionId,
    })
    .eq('user_id', userId)
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

/**
 * Extrai subscription_id de Invoice na API atual.
 * Stripe 2024-11-20+: invoice.subscription removido,
 * agora vive em invoice.parent.subscription_details.subscription.
 */
function getSubIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent
  if (!parent || parent.type !== 'subscription_details') return null
  const sub = parent.subscription_details?.subscription
  if (!sub) return null
  return typeof sub === 'string' ? sub : sub.id
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const secret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (e) {
    console.error('[stripe-webhook] signature inválida:', e instanceof Error ? e.message : 'erro')
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  // Wrap externo: se um handler joga erro, Stripe receberia 500 e ficaria
  // reentregando — gera os emails de erro. Preferimos logar e retornar 200,
  // mantendo trail no audit_log pra investigação.
  try {
    return await processarEvento(event)
  } catch (e) {
    const erroMsg = e instanceof Error ? e.message : 'erro desconhecido'
    console.error(`[stripe-webhook] erro processando ${event.type}:`, erroMsg)
    void supabaseAdmin.from('api_audit_log').insert({
      user_id: null,
      evento: 'stripe_webhook_erro',
      rota: '/api/stripe/webhook',
      status_http: 500,
      meta: {
        event_type: event.type,
        event_id: event.id,
        erro: erroMsg.slice(0, 500),
      },
    }).then(() => null, () => null)
    return NextResponse.json({ received: true, error_logged: true })
  }
}

async function processarEvento(event: Stripe.Event): Promise<NextResponse> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const tipo = session.metadata?.tipo ?? 'criador'
      const planoEscolhido = session.metadata?.plano
      const periodo = session.metadata?.periodo ?? 'mensal'
      const subId = session.subscription as string
      if (!userId || !planoEscolhido || !subId) break

      const sub = await stripe.subscriptions.retrieve(subId)
      const emTrial = sub.status === 'trialing'

      if (tipo === 'marca') {
        await setPlanoMarca(userId, planoEscolhido, periodo, subId)
      } else {
        await setPlano(userId, planoEscolhido, subId)
        await enviarBoasVindas(userId, planoEscolhido)
      }
      // Audit (best-effort, não bloqueia webhook)
      void supabaseAdmin.from('api_audit_log').insert({
        user_id: userId,
        evento: 'checkout_completo',
        rota: '/api/stripe/webhook',
        status_http: 200,
        meta: { plano: planoEscolhido, periodo, tipo, sub_id: subId, em_trial: emTrial },
      }).then(() => null, () => null)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      const tipo = sub.metadata?.tipo ?? 'criador'
      const planoMeta = sub.metadata?.plano
      const periodo = sub.metadata?.periodo ?? 'mensal'
      const priceId = sub.items.data[0]?.price.id
      const planoByPrice = priceId ? priceIdToPlano(priceId) : null
      const planoEscolhido = planoMeta ?? planoByPrice
      if (!userId || !planoEscolhido) break

      const emTrial = sub.status === 'trialing'
      const ativo = sub.status === 'active'
      const cancelado = ['canceled', 'unpaid', 'incomplete_expired'].includes(sub.status)

      // Captura plano atual ANTES de alterar pra detectar mudança real
      const tabelaPerfil = tipo === 'marca' ? 'brand_profiles' : 'creator_profiles'
      const { data: atual } = await supabaseAdmin
        .from(tabelaPerfil)
        .select('plano')
        .eq('user_id', userId)
        .maybeSingle()
      const planoAntes = atual?.plano ?? 'free'

      if (tipo === 'marca') {
        if (cancelado) {
          await supabaseAdmin
            .from('brand_profiles')
            .update({ plano: 'free', stripe_subscription_id: null })
            .eq('user_id', userId)
        } else if (emTrial || ativo) {
          await setPlanoMarca(userId, planoEscolhido, periodo, sub.id)
        }
      } else {
        if (cancelado) {
          await supabaseAdmin
            .from('creator_profiles')
            .update({ plano: 'free', stripe_subscription_id: null })
            .eq('user_id', userId)
          await estornarIndicacao(sub.id, `status=${sub.status}`)
        } else if (emTrial || ativo) {
          const eraFreeOuTrial = !atual?.plano || atual.plano === 'free' || atual.plano === 'trial'
          await setPlano(userId, planoEscolhido, sub.id)
          if (ativo && eraFreeOuTrial) {
            const valorPlano = sub.items.data[0]?.price.unit_amount
            if (valorPlano) {
              await ativarIndicacao(userId, valorPlano / 100, sub.id, planoEscolhido)
            }
          }
        }
      }

      // Audit só se o plano efetivamente mudou (evita ruído de eventos repetidos)
      const planoDepois = cancelado ? 'free' : planoEscolhido
      if (planoAntes !== planoDepois) {
        void supabaseAdmin.from('api_audit_log').insert({
          user_id: userId,
          evento: 'plano_alterado',
          rota: '/api/stripe/webhook',
          status_http: 200,
          meta: {
            tipo,
            plano_antes: planoAntes,
            plano_depois: planoDepois,
            status: sub.status,
            sub_id: sub.id,
            motivo: cancelado ? 'cancelamento/falha_pagamento' : (emTrial ? 'trial' : 'upgrade/renovacao'),
          },
        }).then(() => null, () => null)
      }
      break
    }

    case 'invoice.paid': {
      // Fatura recorrente paga → pode gerar comissão de afiliado
      const invoice = event.data.object as Stripe.Invoice
      const subId = getSubIdFromInvoice(invoice)
      if (!subId) break
      // Só conta recorrências (pula a primeira, que já foi tratada em subscription.updated)
      if (invoice.billing_reason === 'subscription_cycle') {
        const valorPago = (invoice.amount_paid ?? 0) / 100
        await registrarRecorrencia(subId, valorPago, invoice.id ?? '')
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = getSubIdFromInvoice(invoice)
      if (subId) await estornarIndicacao(subId, event.type)
      break
    }

    case 'charge.refunded': {
      // Stripe API moderno: Charge não tem .invoice direto.
      // Cancelamento de assinatura com refund chega via invoice.payment_failed
      // + customer.subscription.deleted, que já tratam estorno de comissão.
      // Refund avulso (sem cancelar sub) é raro — ignoramos por ora.
      const charge = event.data.object as Stripe.Charge
      console.log('[webhook] charge.refunded recebido:', charge.id, 'amount:', charge.amount_refunded)
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
