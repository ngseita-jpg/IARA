import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('creator_profiles')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const customerId = perfil?.stripe_customer_id as string | undefined
  if (!customerId) return NextResponse.json({ error: 'Sem assinatura ativa' }, { status: 400 })

  const origin = req.headers.get('origin') ?? 'https://iarahubapp.com.br'

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/dashboard`,
  })

  return NextResponse.json({ url: session.url })
}
