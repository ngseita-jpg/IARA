import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  return NextResponse.json({ mensagem: msg }, { status: 201 })
}
