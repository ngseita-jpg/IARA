import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/historico?tipo=roteiro — lista histórico do tipo
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const tipo = req.nextUrl.searchParams.get('tipo')
  if (!tipo) return NextResponse.json({ error: 'Tipo não informado' }, { status: 400 })

  const { data, error } = await supabase
    .from('content_history')
    .select('id, titulo, parametros, conteudo, created_at')
    .eq('user_id', user.id)
    .eq('tipo', tipo)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ items: data ?? [] })
}

// POST /api/historico — salva item
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json() as {
    tipo: string
    titulo: string
    parametros?: Record<string, unknown>
    conteudo: unknown
  }

  const { error } = await supabase.from('content_history').insert({
    user_id: user.id,
    tipo: body.tipo,
    titulo: body.titulo.slice(0, 120),
    parametros: body.parametros ?? {},
    conteudo: body.conteudo,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// DELETE /api/historico?id=xxx — remove item
export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 })

  const { error } = await supabase
    .from('content_history')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
