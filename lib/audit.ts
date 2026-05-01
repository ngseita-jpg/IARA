import { createAdminClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'
import { getIp } from './rateLimit'

/**
 * Registra evento sensível em api_audit_log. Best-effort — nunca bloqueia request.
 *
 * Eventos típicos:
 *  - signup, login_falha, login_ok
 *  - checkout_iniciado, checkout_completo, plano_alterado
 *  - conta_deletada
 *  - admin_action
 *  - rate_limit_atingido
 */
export async function audit(
  req: NextRequest,
  evento: string,
  opts: {
    userId?: string | null
    statusHttp?: number
    meta?: Record<string, unknown>
  } = {},
): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('api_audit_log').insert({
      user_id: opts.userId ?? null,
      evento,
      ip: getIp(req),
      user_agent: (req.headers.get('user-agent') ?? '').slice(0, 500),
      rota: new URL(req.url).pathname.slice(0, 200),
      status_http: opts.statusHttp ?? null,
      meta: opts.meta ?? {},
    })
  } catch (e) {
    console.error('[audit] falha ao gravar', e)
  }
}
