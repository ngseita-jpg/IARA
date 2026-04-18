import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLevel } from '@/lib/badges'

// Pontos concedidos ao salvar cada tipo de conteúdo gerado
const PONTOS_GERACAO: Record<string, number> = {
  roteiro:   5,
  carrossel: 5,
  stories:   5,
  thumbnail: 5,
}

// GET /api/historico?tipo=roteiro — lista histórico do tipo
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const tipo = req.nextUrl.searchParams.get('tipo')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '30')

  let query = supabase
    .from('content_history')
    .select('id, tipo, titulo, parametros, conteudo, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (tipo) query = query.eq('tipo', tipo)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ items: data ?? [] })
}

// POST /api/historico — salva item e concede pontos de gamificação
export async function POST(req: NextRequest) {
  const supabase = await createClient()
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

  // Concede pontos de gamificação
  const pontos = PONTOS_GERACAO[body.tipo] ?? 0
  if (pontos > 0) {
    const { data: profile } = await supabase
      .from('creator_profiles')
      .select('pontos')
      .eq('user_id', user.id)
      .single()

    const novoTotal = (profile?.pontos ?? 0) + pontos

    await supabase.from('creator_profiles').update({
      pontos: novoTotal,
      nivel: getLevel(novoTotal),
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id)
  }

  return NextResponse.json({ ok: true, pontos_ganhos: pontos })
}

// DELETE /api/historico?id=xxx — remove item
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
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
