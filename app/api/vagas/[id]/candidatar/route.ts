import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ applied: false })

  const { data: profile } = await supabase
    .from('creator_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ applied: false })

  const { data } = await supabase
    .from('candidaturas')
    .select('id, status')
    .eq('vaga_id', id)
    .eq('creator_id', profile.id)
    .maybeSingle()

  return NextResponse.json({ applied: !!data, status: data?.status ?? null })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('creator_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Complete seu perfil antes de se candidatar.' }, { status: 404 })

  const { mensagem } = await req.json()

  const { error } = await supabase.from('candidaturas').insert({
    vaga_id: id,
    creator_id: profile.id,
    mensagem: mensagem?.trim() || null,
    status: 'pendente',
  })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Você já se candidatou a esta vaga.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
