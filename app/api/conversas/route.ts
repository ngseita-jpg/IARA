import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('conversas')
    .select('*')
    .or(`brand_user_id.eq.${user.id},creator_user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  return NextResponse.json({ conversas: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { candidatura_id } = await req.json()
  if (!candidatura_id) return NextResponse.json({ error: 'candidatura_id required' }, { status: 400 })

  // Return existing conversa if already created
  const { data: existing } = await supabase
    .from('conversas')
    .select('*')
    .eq('candidatura_id', candidatura_id)
    .maybeSingle()

  if (existing) return NextResponse.json({ conversa: existing })

  // Resolve creator user_id from candidatura
  const { data: cand } = await supabase
    .from('candidaturas')
    .select('creator_profiles!creator_id(user_id)')
    .eq('id', candidatura_id)
    .single()

  const creator_user_id = (cand?.creator_profiles as unknown as { user_id: string } | null)?.user_id
  if (!creator_user_id) return NextResponse.json({ error: 'Criador não encontrado' }, { status: 404 })

  const { data: conversa, error } = await supabase
    .from('conversas')
    .insert({ candidatura_id, brand_user_id: user.id, creator_user_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ conversa }, { status: 201 })
}
