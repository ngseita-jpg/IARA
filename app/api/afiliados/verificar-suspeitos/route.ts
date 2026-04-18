import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CRON_SECRET = process.env.CRON_SECRET

/**
 * GET /api/afiliados/verificar-suspeitos
 * Marca como suspeito qualquer afiliado com muitos cliques e zero vendas confirmadas.
 * Chamado por cron job (Vercel Cron ou externo) com Authorization: Bearer CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Threshold: 50+ cliques e 0 vendas há mais de 14 dias
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const { data: suspeitos, error } = await supabase
    .from('afiliados')
    .select('id, cliques, vendas_confirmadas, suspeito, created_at')
    .gte('cliques', 50)
    .eq('vendas_confirmadas', 0)
    .eq('status', 'ativo')
    .eq('suspeito', false)
    .lte('created_at', cutoff)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!suspeitos || suspeitos.length === 0) {
    return NextResponse.json({ ok: true, flagged: 0 })
  }

  const ids = suspeitos.map(s => s.id)
  await supabase
    .from('afiliados')
    .update({ suspeito: true, suspeito_em: new Date().toISOString() })
    .in('id', ids)

  return NextResponse.json({ ok: true, flagged: ids.length })
}
