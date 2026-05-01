import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * POST /api/historico/duplicar?id=xxx
 * Cria uma cópia do item de histórico do user pra reusar como ponto de partida.
 * Mantém parâmetros e conteúdo originais; reseta favoritado.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 })

  const { data: original, error } = await supabase
    .from('content_history')
    .select('tipo, titulo, parametros, conteudo')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error)    return NextResponse.json({ error: error.message }, { status: 500 })
  if (!original) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })

  const novoTitulo = `${(original.titulo ?? '').slice(0, 100)} (cópia)`

  const { data: row, error: insErr } = await supabase
    .from('content_history')
    .insert({
      user_id: user.id,
      tipo: original.tipo,
      titulo: novoTitulo,
      parametros: original.parametros ?? {},
      conteudo: original.conteudo,
      favoritado: false,
    })
    .select('id')
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: row?.id })
}
