import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLevel } from '@/lib/badges'

export const runtime = 'nodejs'

// Pontos concedidos ao salvar cada tipo de conteúdo gerado
const PONTOS_GERACAO: Record<string, number> = {
  roteiro:   5,
  carrossel: 5,
  stories:   5,
  thumbnail: 5,
}

// GET /api/historico?tipo=roteiro&q=hook&favoritos=1&limit=30
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const tipo = req.nextUrl.searchParams.get('tipo')
  const q = req.nextUrl.searchParams.get('q')?.trim()
  const favoritos = req.nextUrl.searchParams.get('favoritos') === '1'
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '30'), 100)

  let query = supabase
    .from('content_history')
    .select('id, tipo, titulo, parametros, conteudo, favoritado, favoritado_em, created_at')
    .eq('user_id', user.id)
    .order('favoritado', { ascending: false })   // favoritos primeiro
    .order('created_at', { ascending: false })
    .limit(limit)

  if (tipo)      query = query.eq('tipo', tipo)
  if (favoritos) query = query.eq('favoritado', true)
  if (q && q.length >= 2) query = query.ilike('titulo', `%${q.slice(0, 100)}%`)

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

  const { data: row, error } = await supabase.from('content_history').insert({
    user_id: user.id,
    tipo: body.tipo,
    titulo: (body.titulo ?? '').slice(0, 120),
    parametros: body.parametros ?? {},
    conteudo: body.conteudo,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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

  return NextResponse.json({ ok: true, id: row?.id, pontos_ganhos: pontos })
}

// PATCH /api/historico?id=xxx — favoritar/desfavoritar
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 })

  const body = await req.json().catch(() => ({})) as { favoritado?: boolean }
  const fav = !!body.favoritado

  const { error } = await supabase
    .from('content_history')
    .update({
      favoritado: fav,
      favoritado_em: fav ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, favoritado: fav })
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
