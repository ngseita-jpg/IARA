import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const evento = searchParams.get('evento')
  const ip = searchParams.get('ip')
  const userId = searchParams.get('user_id')
  const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500)

  const admin = createAdminClient()
  let query = admin
    .from('api_audit_log')
    .select('id, user_id, evento, ip, user_agent, rota, status_http, meta, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (evento)  query = query.eq('evento', evento)
  if (ip)      query = query.eq('ip', ip)
  if (userId)  query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message, eventos: [] }, { status: 500 })
  }

  // Conta por evento (top 10) — útil pra spotcheck rápido
  const { data: stats } = await admin
    .from('api_audit_log')
    .select('evento')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  const contagem: Record<string, number> = {}
  for (const r of stats ?? []) contagem[r.evento] = (contagem[r.evento] ?? 0) + 1
  const topEventos = Object.entries(contagem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([evento, count]) => ({ evento, count }))

  return NextResponse.json({
    eventos: data ?? [],
    stats_7dias: topEventos,
    total_retornado: data?.length ?? 0,
  })
}
