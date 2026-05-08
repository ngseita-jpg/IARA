import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: plano } = await supabase
    .from('bussola_planos')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'ativo')
    .maybeSingle()

  return NextResponse.json({ plano })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    diferencial?: string
    audiencia_alvo?: string
    marco_3m?: string
    marco_1a?: string
    marco_3a?: string
    fase_atual?: 'construindo' | 'crescendo' | 'monetizando' | 'escalando'
    missoes?: Array<{
      semana: number
      missoes: Array<{ texto: string; concluida: boolean; criada_em: string }>
    }>
  }

  // Pega plano ativo OU cria um draft vazio se nao existe
  const { data: existente } = await supabase
    .from('bussola_planos')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'ativo')
    .maybeSingle()

  if (!existente) {
    const { data: novo, error } = await supabase
      .from('bussola_planos')
      .insert({ user_id: user.id, ...body })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ plano: novo })
  }

  const { data: atualizado, error } = await supabase
    .from('bussola_planos')
    .update(body)
    .eq('id', existente.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plano: atualizado })
}

// Toggle de uma missao concluida — endpoint dedicado pra eficiencia
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { semana, indice } = await req.json().catch(() => ({})) as { semana?: number; indice?: number }
  if (typeof semana !== 'number' || typeof indice !== 'number') {
    return NextResponse.json({ error: 'semana e indice sao obrigatorios' }, { status: 400 })
  }

  const { data: plano } = await supabase
    .from('bussola_planos')
    .select('id, missoes')
    .eq('user_id', user.id)
    .eq('status', 'ativo')
    .maybeSingle()

  if (!plano) return NextResponse.json({ error: 'Sem plano ativo' }, { status: 404 })

  const missoes = (plano.missoes ?? []) as Array<{
    semana: number
    missoes: Array<{ texto: string; concluida: boolean; criada_em: string }>
  }>
  const semanaObj = missoes.find(s => s.semana === semana)
  if (!semanaObj || !semanaObj.missoes[indice]) {
    return NextResponse.json({ error: 'Missao nao encontrada' }, { status: 404 })
  }

  semanaObj.missoes[indice].concluida = !semanaObj.missoes[indice].concluida

  await supabase
    .from('bussola_planos')
    .update({ missoes })
    .eq('id', plano.id)

  return NextResponse.json({ ok: true, concluida: semanaObj.missoes[indice].concluida })
}
