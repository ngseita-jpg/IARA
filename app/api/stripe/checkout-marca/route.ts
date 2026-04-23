import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe, PRICE_IDS_MARCA, PRICE_IDS_MARCA_ANUAL, type PlanoMarca } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado — faça login como marca antes.' }, { status: 401 })

  const { plano, periodo = 'mensal' } = await req.json() as { plano: PlanoMarca; periodo?: 'mensal' | 'anual' }
  const priceId = periodo === 'anual'
    ? PRICE_IDS_MARCA_ANUAL[plano]
    : PRICE_IDS_MARCA[plano]
  if (!priceId) return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })

  const admin = createAdminClient()
  const { data: brandProfile } = await admin
    .from('brand_profiles')
    .select('id, stripe_customer_id, nome_empresa')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!brandProfile) {
    return NextResponse.json({
      error: 'Complete o cadastro como marca antes de assinar um plano.',
      redirect: '/marca/onboarding',
    }, { status: 400 })
  }

  // Stripe customer — cria se ainda não tem
  let customerId = brandProfile.stripe_customer_id as string | undefined
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: brandProfile.nome_empresa ?? user.email,
      metadata: { user_id: user.id, tipo: 'marca', brand_id: brandProfile.id },
    })
    customerId = customer.id
    await admin
      .from('brand_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', brandProfile.id)
  }

  const origin = req.headers.get('origin') ?? 'https://iarahubapp.com.br'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/marca/dashboard?upgraded=1&plano=${plano}&periodo=${periodo}`,
    cancel_url: `${origin}/empresas`,
    metadata: { user_id: user.id, tipo: 'marca', plano, periodo },
    subscription_data: {
      metadata: { user_id: user.id, tipo: 'marca', plano, periodo },
      trial_period_days: 7,   // trial maior pra marca (7 dias vs 3 do criador)
      trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
    },
    locale: 'pt-BR',
    allow_promotion_codes: true,
    payment_method_collection: 'always',
    payment_method_types: ['card'],
  })

  return NextResponse.json({ url: session.url })
}
