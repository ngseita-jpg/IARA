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

/**
 * Rate limit por USUARIO (preferido pra rotas IA autenticadas).
 *
 * Por que NAO usar IP: multiplos users atras do mesmo NAT (familia, escritorio,
 * escola, wifi publico) dividem a cota. Usuario "ilimitado" perdia o ilimitado
 * porque o IP estourava. 60/h batia em ~12 carrosseis (cada um usa 5 reqs).
 *
 * Estrategia atual:
 *   - autenticado (userId): cota generosa por user (ex: 300/h, ~5/min) — humano
 *     real nao bate, bot bate na hora.
 *   - anonimo (sem login): limite IP rigido (proteção real contra scraper).
 *
 * O `verificarLimite` por plano (lib/checkLimite.ts) ainda regula uso por mes
 * conforme o plano pago — esse rate limit so previne abuso de curta janela.
 */
export async function checkRateLimitUser(
  req: NextRequest,
  userId: string | null,
  bucket: string,
  options: { maxAuth?: number; maxAnon?: number; windowSec?: number } = {},
): Promise<Response | null> {
  const { maxAuth = 300, maxAnon = 30, windowSec = 3600 } = options

  // Anonimo: limita rigido por IP (defesa contra scraper/bot)
  if (!userId) {
    return checkRateLimitIp(req, `${bucket}:anon`, maxAnon, windowSec)
  }

  // Autenticado: limita generoso por user_id (humano real nao bate)
  const { ok, remaining } = await rateLimit(`user:${userId}:${bucket}`, maxAuth, windowSec)
  if (!ok) {
    return new Response(
      JSON.stringify({
        error: 'Você está gerando muito rápido. Aguarda 1 minuto e tenta de novo.',
        retry_after_sec: 60,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Remaining': String(remaining),
        },
      },
    )
  }
  return null
}
