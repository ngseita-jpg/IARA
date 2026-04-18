import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailConversaIniciada } from '@/lib/email'

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

  // Notify creator that brand started a conversation (best-effort)
  const { data: cand2 } = await supabase
    .from('candidaturas')
    .select('vaga_id, creator_profiles!creator_id(nome_artistico, user_id), vagas!vaga_id(titulo)')
    .eq('id', candidatura_id)
    .single()

  const { data: brandProfile } = await supabase
    .from('brand_profiles')
    .select('nome_empresa')
    .eq('user_id', user.id)
    .single()

  if (cand2 && brandProfile) {
    const cp = cand2.creator_profiles as unknown as { nome_artistico: string; user_id: string } | null
    const vg = cand2.vagas as unknown as { titulo: string } | null
    if (cp?.user_id && vg) {
      const { data: creatorUser } = await supabase.auth.admin.getUserById(cp.user_id)
      if (creatorUser?.user?.email) {
        emailConversaIniciada({
          creatorEmail: creatorUser.user.email,
          creatorNome: cp.nome_artistico,
          brandNome: brandProfile.nome_empresa,
          vagaTitulo: vg.titulo,
        })
      }
    }
  }

  return NextResponse.json({ conversa }, { status: 201 })
}
