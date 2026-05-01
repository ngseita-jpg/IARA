import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe, PRICE_IDS, PRICE_IDS_ANUAL, type PlanoStripe } from '@/lib/stripe'
import { checkRateLimitIp } from '@/lib/rateLimit'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Rate limit por IP — 10 tentativas de checkout em 5min (anti-spam)
  const rl = await checkRateLimitIp(req, 'stripe_checkout', 10, 300)
  if (rl) return rl

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { plano, periodo = 'mensal' } = await req.json() as { plano: PlanoStripe; periodo?: 'mensal' | 'anual' }

  // Agência ainda não é self-service no Stripe — tem CTA "Falar com vendas"
  if (plano === 'agencia') {
    return NextResponse.json({
      error: 'Plano Agência é vendido manualmente. Fale com a gente: contato@iarahubapp.com.br',
      contato: 'mailto:contato@iarahubapp.com.br?subject=Plano%20Ag%C3%AAncia',
    }, { status: 400 })
  }

  const priceId = periodo === 'anual' ? PRICE_IDS_ANUAL[plano] : PRICE_IDS[plano]
  if (!priceId) {
    return NextResponse.json({
      error: 'Plano inválido ou price ID não configurado.',
      detalhe: `plano=${plano} periodo=${periodo}`,
    }, { status: 400 })
  }

  try {
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
      success_url: `${origin}/bem-vindo?plano=${plano}&periodo=${periodo}`,
      cancel_url: `${origin}/dashboard`,
      metadata: { user_id: user.id, plano, periodo },
      subscription_data: {
        metadata: { user_id: user.id, plano, periodo },
        trial_period_days: 3,
        trial_settings: {
          end_behavior: { missing_payment_method: 'cancel' },
        },
      },
      locale: 'pt-BR',
      allow_promotion_codes: true,
      payment_method_collection: 'always',
      payment_method_types: ['card'],
    })

    void audit(req, 'checkout_iniciado', {
      userId: user.id,
      statusHttp: 200,
      meta: { plano, periodo, tipo: 'criador', session_id: session.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('[stripe-checkout] erro:', e)
    return NextResponse.json({
      error: 'Erro ao iniciar checkout. Tente novamente em instantes.',
      detalhe: e instanceof Error ? e.message : 'erro desconhecido',
    }, { status: 500 })
  }
}
