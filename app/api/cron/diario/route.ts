import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET

/**
 * Cron diário consolidado — chama trial-emails + uso-alertas.
 * Existe pra ficar dentro do limite de 2 cron jobs do plano Hobby da Vercel.
 *
 * Cada subjob é independente: se um falhar, o outro continua.
 * Resposta agrupa resultados pra debug fácil.
 */
export async function GET(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const base = new URL(req.url).origin
  const headers = { Authorization: `Bearer ${CRON_SECRET}` }

  const subjobs = ['/api/cron/trial-emails', '/api/cron/uso-alertas']
  const resultados = await Promise.allSettled(
    subjobs.map(async path => {
      const r = await fetch(`${base}${path}`, { headers })
      const json = await r.json().catch(() => ({}))
      return { path, status: r.status, ...json }
    }),
  )

  return NextResponse.json({
    ok: true,
    rodou_em: new Date().toISOString(),
    resultados: resultados.map((r, i) => ({
      path: subjobs[i],
      ok: r.status === 'fulfilled',
      detalhe: r.status === 'fulfilled' ? r.value : (r.reason instanceof Error ? r.reason.message : 'erro'),
    })),
  })
}
