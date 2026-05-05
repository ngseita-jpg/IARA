import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Salva disponibilidade do criador (dias da semana, períodos, minutos/dia,
 * compromissos fixos). Pré-requisito do cronograma inteligente — sem isso a
 * IA inventaria horários que não cabem na rotina do user.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    disponibilidade_dias?: string[]
    disponibilidade_periodos?: string[]
    disponibilidade_minutos?: number
    disponibilidade_compromissos?: string | null
  }

  const updates = {
    disponibilidade_dias: body.disponibilidade_dias ?? null,
    disponibilidade_periodos: body.disponibilidade_periodos ?? null,
    disponibilidade_minutos: body.disponibilidade_minutos ?? null,
    disponibilidade_compromissos: body.disponibilidade_compromissos ?? null,
    disponibilidade_atualizada_em: new Date().toISOString(),
  }

  const admin = createAdminClient()
  const { error: cpErr } = await admin
    .from('creator_profiles')
    .update(updates)
    .eq('user_id', user.id)

  // Tabela de disponibilidade pode nao existir se admin nao rodou SQL
  if (cpErr && /column.*does not exist/i.test(cpErr.message ?? '')) {
    return NextResponse.json({
      error: 'setup_pendente',
      mensagem: 'Disponibilidade ainda não está ativada. Admin precisa rodar schema_cronograma_disponibilidade.sql.',
    }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}
