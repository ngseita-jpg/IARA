import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { audit } from '@/lib/audit'
import { checkRateLimitIp } from '@/lib/rateLimit'

export const runtime = 'nodejs'

// Endpoint pra clients reportarem eventos sensíveis ao audit log.
// Allow-list rígido: só aceita eventos conhecidos. Sem isso, atacante poderia
// poluir o audit log com eventos arbitrários.
//
// Eventos AUTENTICADOS: precisam de sessão válida; user_id vem do auth.getUser().
// Eventos ANÔNIMOS: rate limited por IP (impede flood de bot).

const EVENTOS_AUTENTICADOS = new Set([
  'login_ok',
  'senha_alterada',
])

const EVENTOS_ANONIMOS = new Set([
  'login_falha',
])

type Body = {
  evento?: string
  meta?: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  let body: Body = {}
  try { body = await req.json() } catch { /* body opcional */ }

  const evento = (body.evento ?? '').trim()
  const meta = (body.meta && typeof body.meta === 'object') ? body.meta : {}

  // Cap de tamanho do meta (evita inflar o log)
  const metaSeguro = JSON.parse(JSON.stringify(meta).slice(0, 2000)) as Record<string, unknown>

  if (EVENTOS_AUTENTICADOS.has(evento)) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    await audit(req, evento, {
      userId: user.id,
      statusHttp: 200,
      meta: metaSeguro,
    })
    return NextResponse.json({ ok: true })
  }

  if (EVENTOS_ANONIMOS.has(evento)) {
    // Rate limit duro pra evitar flood: 30 reports/min por IP
    const rl = await checkRateLimitIp(req, 'audit_anonimo', 30, 60)
    if (rl) return rl

    await audit(req, evento, {
      userId: null,
      statusHttp: 200,
      meta: metaSeguro,
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Evento desconhecido' }, { status: 400 })
}
