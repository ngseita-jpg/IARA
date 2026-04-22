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
        }
      }
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
      break
    }
  }

  return NextResponse.json({ received: true })
}
