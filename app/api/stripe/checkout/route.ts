import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe, PRICE_IDS, PlanoStripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { plano } = await req.json() as { plano: PlanoStripe }
  const priceId = PRICE_IDS[plano]
  if (!priceId) return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })

  const admin = createAdminClient()
  const { data: perfil } = await admin
    .from('creator_profiles')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let customerId = perfil?.stripe_customer_id as string | undefined

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    })
    customerId = customer.id
    await admin
      .from('creator_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', user.id)
  }

  const origin = req.headers.get('origin') ?? 'https://iarahubapp.com.br'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/bem-vindo?plano=${plano}`,
    cancel_url: `${origin}/dashboard`,
    metadata: { user_id: user.id, plano },
    subscription_data: { metadata: { user_id: user.id, plano } },
    locale: 'pt-BR',
    allow_promotion_codes: true,
    payment_method_collection: 'if_required',
    payment_method_types: ['card', 'boleto'],
  })

  return NextResponse.json({ url: session.url })
}
