import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const MODULOS_VALIDOS = new Set([
  'roteiro', 'carrossel', 'stories', 'thumbnail', 'temas', 'midia_kit',
])

// GET /api/templates?modulo=roteiro — lista templates do user
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const modulo = req.nextUrl.searchParams.get('modulo')
  let query = supabase
    .from('content_templates')
    .select('id, modulo, nome, descricao, parametros, uso_count, ultimo_uso, created_at')
    .eq('user_id', user.id)
    .order('ultimo_uso', { ascending: false, nullsFirst: false })
    .limit(50)

  if (modulo) query = query.eq('modulo', modulo)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ items: data ?? [] })
}

// POST /api/templates — cria template
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json() as {
    modulo?: string
    nome?: string
    descricao?: string
    parametros?: Record<string, unknown>
  }

  if (!body.modulo || !MODULOS_VALIDOS.has(body.modulo)) {
    return NextResponse.json({ error: 'Módulo inválido' }, { status: 400 })
  }
  const nome = (body.nome ?? '').trim()
  if (!nome || nome.length < 3) {
    return NextResponse.json({ error: 'Nome precisa ter pelo menos 3 caracteres' }, { status: 400 })
  }

  // Cap qtd templates por user (free=5, premium+=ilimitado — simples por enquanto)
  const { count } = await supabase
    .from('content_templates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
  if ((count ?? 0) >= 50) {
    return NextResponse.json({ error: 'Limite de 50 templates atingido' }, { status: 400 })
  }

  const { data: row, error } = await supabase
    .from('content_templates')
    .insert({
      user_id: user.id,
      modulo: body.modulo,
      nome: nome.slice(0, 100),
      descricao: (body.descricao ?? '').slice(0, 300) || null,
      parametros: body.parametros ?? {},
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: row?.id })
}

// PATCH /api/templates?id=xxx — incrementa uso_count + atualiza ultimo_uso
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  // Carrega atual + valida ownership
  const { data: atual } = await supabase
    .from('content_templates')
    .select('uso_count')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!atual) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })

  await supabase
    .from('content_templates')
    .update({
      uso_count: (atual.uso_count ?? 0) + 1,
      ultimo_uso: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}

// DELETE /api/templates?id=xxx — remove template
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { error } = await supabase
    .from('content_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
