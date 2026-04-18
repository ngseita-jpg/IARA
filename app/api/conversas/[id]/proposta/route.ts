import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { acao, valor } = await req.json()
  const newStatus = acao === 'aceitar' ? 'fechado' : 'aberta'
  const updateData: Record<string, unknown> = { status: newStatus }
  if (acao === 'aceitar' && valor) updateData.valor_acordado = Number(valor)

  await supabase.from('conversas').update(updateData).eq('id', id)

  const valorFmt = valor ? ` por R$ ${Number(valor).toLocaleString('pt-BR')}` : ''
  const conteudo = acao === 'aceitar'
    ? `✅ Proposta aceita! Acordo fechado${valorFmt}.`
    : '❌ Proposta recusada. Podemos continuar negociando.'

  await supabase.from('mensagens').insert({
    conversa_id: id,
    sender_id: user.id,
    conteudo,
    tipo: acao === 'aceitar' ? 'aceite' : 'recusa',
  })

  return NextResponse.json({ ok: true })
}
