import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('candidaturas')
    .select('*, creator_profiles!creator_id(nome_artistico, nicho, nivel, pontos, sobre)')
    .eq('vaga_id', id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ candidaturas: data ?? [] })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id: vagaId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { candidatura_id, status } = await req.json()

  const { error } = await supabase
    .from('candidaturas')
    .update({ status })
    .eq('id', candidatura_id)
    .eq('vaga_id', vagaId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
