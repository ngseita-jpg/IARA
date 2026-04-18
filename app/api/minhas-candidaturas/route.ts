import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ candidaturas: [] })

  const { data: profile } = await supabase
    .from('creator_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ candidaturas: [] })

  const { data: cands } = await supabase
    .from('candidaturas')
    .select(`
      id, status, mensagem, created_at, vaga_id,
      vagas!vaga_id(
        id, titulo, descricao, nome_empresa, tipo, valor,
        nichos, plataformas, entregaveis, prazo_entrega,
        min_seguidores, segmento, status
      )
    `)
    .eq('creator_id', profile.id)
    .order('created_at', { ascending: false })

  if (!cands?.length) return NextResponse.json({ candidaturas: [] })

  // Get conversations linked to these candidaturas
  const candIds = cands.map(c => c.id)
  const { data: conversas } = await supabase
    .from('conversas')
    .select('id, candidatura_id, status, valor_acordado')
    .in('candidatura_id', candIds)
    .eq('creator_user_id', user.id)

  // Count unread messages per conversa
  const conversaIds = (conversas ?? []).map(c => c.id)
  const unreadMap: Record<string, number> = {}

  if (conversaIds.length > 0) {
    const { data: unreads } = await supabase
      .from('mensagens')
      .select('conversa_id')
      .in('conversa_id', conversaIds)
      .neq('sender_id', user.id)
      .eq('lida', false)

    for (const m of unreads ?? []) {
      unreadMap[m.conversa_id] = (unreadMap[m.conversa_id] ?? 0) + 1
    }
  }

  const conversaByCand: Record<string, {
    id: string; status: string; valor_acordado: number | null; unread: number
  }> = {}
  for (const c of conversas ?? []) {
    conversaByCand[c.candidatura_id] = {
      id: c.id,
      status: c.status,
      valor_acordado: c.valor_acordado,
      unread: unreadMap[c.id] ?? 0,
    }
  }

  return NextResponse.json({
    candidaturas: cands.map(c => ({
      id: c.id,
      status: c.status,
      mensagem: c.mensagem,
      created_at: c.created_at,
      vaga_id: c.vaga_id,
      vaga: c.vagas,
      conversa: conversaByCand[c.id] ?? null,
    })),
  })
}
