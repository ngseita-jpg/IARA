import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sortearInsight } from '@/lib/iara-insights'

export const runtime = 'nodejs'

/**
 * Retorna 1 insight pro user. Considera nicho do creator_profile.
 * Frontend controla o "1 a cada 10min" via localStorage timestamp.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('creator_profiles')
    .select('nicho')
    .eq('user_id', user.id)
    .maybeSingle()

  const insight = sortearInsight(profile?.nicho)
  return NextResponse.json({ insight })
}
