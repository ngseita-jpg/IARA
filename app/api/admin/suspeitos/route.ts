import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Lista usuarios potencialmente suspeitos (multi-IP, rate-limit hits,
 * tentativas de cupom invalido, picos anormais de uso).
 * Apenas admin.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })
  }

  const admin = createAdminClient()
  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Quem bateu rate limit nas ultimas 7 dias (potencial bot ou compartilhamento)
  const { data: rateLimitHits } = await admin
    .from('api_audit_log')
    .select('user_id, evento, meta, created_at')
    .gte('created_at', seteDiasAtras)
    .in('evento', ['rate_limit_excedido', 'limite_atingido', 'cupom_invalido'])
    .order('created_at', { ascending: false })
    .limit(200)

  // Agrupa por user_id
  const porUser = new Map<string, { count: number; eventos: string[]; ultimo: string }>()
  for (const hit of (rateLimitHits ?? []) as Array<{ user_id: string | null; evento: string; meta: unknown; created_at: string }>) {
    if (!hit.user_id) continue
    const cur = porUser.get(hit.user_id) ?? { count: 0, eventos: [], ultimo: hit.created_at }
    cur.count++
    if (!cur.eventos.includes(hit.evento)) cur.eventos.push(hit.evento)
    porUser.set(hit.user_id, cur)
  }

  // Resolver emails dos suspeitos
  const userIds = Array.from(porUser.keys()).slice(0, 50)
  const suspeitos: Array<{
    user_id: string; email: string | null; eventos: string[]; count: number; ultimo: string; plano: string | null
  }> = []

  for (const uid of userIds) {
    const stats = porUser.get(uid)!
    const [{ data: u }, { data: p }] = await Promise.all([
      admin.auth.admin.getUserById(uid),
      admin.from('creator_profiles').select('plano').eq('user_id', uid).maybeSingle(),
    ])
    suspeitos.push({
      user_id: uid,
      email: u?.user?.email ?? null,
      eventos: stats.eventos,
      count: stats.count,
      ultimo: stats.ultimo,
      plano: p?.plano ?? null,
    })
  }

  // 2. Top usuarios por volume (gerou >50 carrosseis em 7d = anormal)
  const { data: heavyUsers } = await admin
    .from('content_history')
    .select('user_id')
    .gte('created_at', seteDiasAtras)

  const usoPorUser = new Map<string, number>()
  for (const c of heavyUsers ?? []) {
    if (!c.user_id) continue
    usoPorUser.set(c.user_id, (usoPorUser.get(c.user_id) ?? 0) + 1)
  }
  const topUso = Array.from(usoPorUser.entries())
    .filter(([, n]) => n >= 50)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([uid, n]) => ({ user_id: uid, geracoes_7d: n }))

  return NextResponse.json({
    rate_limit_suspeitos: suspeitos.sort((a, b) => b.count - a.count),
    heavy_users_7d: topUso,
    janela: '7 dias',
    gerado_em: new Date().toISOString(),
  })
}
