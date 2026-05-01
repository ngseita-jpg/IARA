import { createAdminClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

/**
 * Rate limit por chave (IP, user_id, ou combinação).
 * Usa função SQL atômica `rate_limit_check` em rate_limits.
 *
 * Falha aberta: se o DB cair, deixa passar (preferimos disponibilidade
 * a bloquear users legítimos por bug nosso).
 */
export async function rateLimit(
  key: string,
  max: number,
  windowSec: number,
): Promise<{ ok: boolean; remaining: number }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('rate_limit_check', {
      p_key: key,
      p_max: max,
      p_window_sec: windowSec,
    })
    if (error || !Array.isArray(data) || !data.length) {
      console.error('[rateLimit] erro RPC', error?.message)
      return { ok: true, remaining: max } // fail-open
    }
    const row = data[0] as { ok: boolean; remaining: number }
    return row
  } catch (e) {
    console.error('[rateLimit] exceção', e)
    return { ok: true, remaining: max }
  }
}

/** Extrai IP do request (Vercel, Cloudflare, fallback). */
export function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

/** Helper: rate limit por IP, retorna Response 429 se exceder. */
export async function checkRateLimitIp(
  req: NextRequest,
  bucket: string,
  max: number,
  windowSec: number,
): Promise<Response | null> {
  const ip = getIp(req)
  const { ok, remaining } = await rateLimit(`ip:${ip}:${bucket}`, max, windowSec)
  if (!ok) {
    return new Response(
      JSON.stringify({
        error: 'Muitas requisições. Aguarda um pouco e tenta de novo.',
        retry_after_sec: windowSec,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(windowSec),
          'X-RateLimit-Remaining': String(remaining),
        },
      },
    )
  }
  return null
}
