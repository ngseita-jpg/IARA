import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const CRON_SECRET = process.env.CRON_SECRET

/**
 * Ping diário no Supabase pra manter o projeto ativo.
 *
 * Supabase free tier PAUSA projetos sem queries por 7 dias. Quando pausa,
 * o domínio do projeto fica inacessível (ERR_NAME_NOT_RESOLVED), nenhum
 * user consegue logar, todo o app cai. Aconteceu em 2026-06-08 e levou
 * horas pra restaurar.
 *
 * Esse cron faz UM SELECT count simples — suficiente pra Supabase contar
 * como atividade. Sem isso, projeto pausa após 7 dias inativos.
 *
 * Chamado como subjob do /api/cron/diario (Hobby plan = 2 crons max).
 */
export async function GET(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const inicio = Date.now()
  try {
    const supabase = createAdminClient()
    // 1 query simples — só pra fazer Supabase contar como atividade.
    // head:true evita transferir dados; só conta linhas.
    const { count, error } = await supabase
      .from('creator_profiles')
      .select('*', { count: 'exact', head: true })

    const elapsed = Date.now() - inicio

    if (error) {
      console.error('[cron/keep-supabase-alive] query falhou:', error)
      return NextResponse.json({
        ok: false,
        error: error.message,
        elapsed_ms: elapsed,
      }, { status: 500 })
    }

    console.log(`[cron/keep-supabase-alive] OK · ${count ?? 0} profiles · ${elapsed}ms`)
    return NextResponse.json({
      ok: true,
      profiles_count: count ?? 0,
      elapsed_ms: elapsed,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[cron/keep-supabase-alive] erro:', e instanceof Error ? e.message : 'erro')
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : 'erro desconhecido',
      elapsed_ms: Date.now() - inicio,
    }, { status: 500 })
  }
}
