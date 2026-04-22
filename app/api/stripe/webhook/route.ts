import { NextRequest, NextResponse } from 'next/server'
import { stripe, priceIdToPlano } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
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

  // Tenta salvar o subscription_id (pode falhar se coluna não existe — não bloqueia o plano)
  await supabaseAdmin
    .from('creator_profiles')
    .update({ stripe_subscription_id: subscriptionId })
    .eq('user_id', userId)
    .then(() => null)
    .catch(() => null)
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
      const plano = session.metadata?.plano
      const subId = session.subscription as string
      if (userId && plano && subId) await setPlano(userId, plano, subId)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      const priceId = sub.items.data[0]?.price.id
      const plano = priceId ? priceIdToPlano(priceId) : null
      if (userId && plano) await setPlano(userId, plano, sub.id)
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
