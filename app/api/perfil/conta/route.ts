import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('creator_profiles')
    .select('plano, nome_artistico, stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    email: user.email,
    full_name: user.user_metadata?.full_name ?? null,
    plano: profile?.plano ?? 'free',
    nome_artistico: profile?.nome_artistico ?? null,
    stripe_customer_id: profile?.stripe_customer_id ?? null,
  })
}
