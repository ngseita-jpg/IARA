import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const MODULOS_VALIDOS = new Set([
  'roteiro', 'carrossel', 'stories', 'thumbnail', 'temas',
  'midia_kit', 'oratorio', 'metricas', 'persona', 'cortes',
  'marca_briefing', 'marca_chat', 'marca_match', 'marca_roi', 'marca_campanha',
])

// POST — registra rating (-1 dislike, 1 like)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json() as {
    modulo?: string
    rating?: number
    motivo?: string
    conteudo_history_id?: string
    parametros?: Record<string, unknown>
  }

  if (!body.modulo || !MODULOS_VALIDOS.has(body.modulo)) {
    return NextResponse.json({ error: 'Módulo inválido' }, { status: 400 })
  }
  if (body.rating !== 1 && body.rating !== -1) {
    return NextResponse.json({ error: 'Rating deve ser 1 ou -1' }, { status: 400 })
  }

  const motivo = (body.motivo ?? '').slice(0, 500) || null
  const parametros = body.parametros && typeof body.parametros === 'object' ? body.parametros : {}

  // Upsert: 1 feedback por user por geração (UNIQUE em conteudo_history_id)
  const { error } = await supabase
    .from('ia_feedback')
    .upsert({
      user_id: user.id,
      modulo: body.modulo,
      conteudo_history_id: body.conteudo_history_id ?? null,
      rating: body.rating,
      motivo,
      parametros,
    }, {
      onConflict: 'user_id,conteudo_history_id',
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE — remove feedback (user mudou de ideia)
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('history_id')
  if (!id) return NextResponse.json({ error: 'history_id obrigatório' }, { status: 400 })

  const { error } = await supabase
    .from('ia_feedback')
    .delete()
    .eq('user_id', user.id)
    .eq('conteudo_history_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
