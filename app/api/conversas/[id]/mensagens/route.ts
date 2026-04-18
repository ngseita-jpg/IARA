import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailPropostaEnviada } from '@/lib/email'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: msgs, error } = await supabase
    .from('mensagens')
    .select('*')
    .eq('conversa_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mark messages from the other party as read
  await supabase
    .from('mensagens')
    .update({ lida: true })
    .eq('conversa_id', id)
    .neq('sender_id', user.id)
    .eq('lida', false)

  return NextResponse.json({ mensagens: msgs ?? [] })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conteudo, tipo = 'texto', proposta_valor } = await req.json()
  if (!conteudo?.trim()) return NextResponse.json({ error: 'Conteúdo obrigatório' }, { status: 400 })

  if (tipo === 'proposta') {
    await supabase
      .from('conversas')
      .update({ status: 'proposta_enviada' })
      .eq('id', id)
  }

  const { data: msg, error } = await supabase
    .from('mensagens')
    .insert({
      conversa_id: id,
      sender_id: user.id,
      conteudo: conteudo.trim(),
      tipo,
      proposta_valor: proposta_valor ? Number(proposta_valor) : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify creator when brand sends a proposal (best-effort)
  if (tipo === 'proposta') {
    const { data: conv } = await supabase
      .from('conversas')
      .select('creator_user_id, brand_user_id, candidatura_id')
      .eq('id', id)
      .single()

    if (conv) {
      const { data: cand } = await supabase
        .from('candidaturas')
        .select('vagas!vaga_id(titulo), creator_profiles!creator_id(nome_artistico)')
        .eq('id', conv.candidatura_id)
        .single()

      const { data: brandProfile } = await supabase
        .from('brand_profiles')
        .select('nome_empresa')
        .eq('user_id', conv.brand_user_id)
        .single()

      if (cand && brandProfile) {
        const vg = cand.vagas as unknown as { titulo: string } | null
        const cp = cand.creator_profiles as unknown as { nome_artistico: string } | null
        const { data: creatorUser } = await supabase.auth.admin.getUserById(conv.creator_user_id)
        if (creatorUser?.user?.email && vg && cp) {
          emailPropostaEnviada({
            creatorEmail: creatorUser.user.email,
            creatorNome: cp.nome_artistico,
            brandNome: brandProfile.nome_empresa,
            vagaTitulo: vg.titulo,
            valor: proposta_valor ? Number(proposta_valor) : null,
          })
        }
      }
    }
  }

  return NextResponse.json({ mensagem: msg }, { status: 201 })
}
