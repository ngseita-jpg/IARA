import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify user is a brand
  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const nicho = searchParams.get('nicho')
  const plataforma = searchParams.get('plataforma')
  const busca = searchParams.get('q')

  let query = supabase
    .from('creator_profiles')
    .select('id, nome_artistico, nicho, plataformas, pontos, nivel, sobre, voz_score_medio')
    .eq('onboarding_completo', true)
    .order('pontos', { ascending: false })
    .limit(50)

  if (nicho) query = query.eq('nicho', nicho)
  if (plataforma) query = query.contains('plataformas', [plataforma])
  if (busca) query = query.ilike('nome_artistico', `%${busca}%`)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ criadores: data ?? [] })
}
