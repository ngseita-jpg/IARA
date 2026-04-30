import { NextResponse } from 'next/server'
import { stripe, PRICE_IDS, PRICE_IDS_ANUAL, PRICE_IDS_MARCA, PRICE_IDS_MARCA_ANUAL } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Endpoint público de diagnóstico — valida a config Stripe.
// NÃO retorna keys, só status. Use pra debugar problemas de checkout.
export async function GET() {
  const secret = process.env.STRIPE_SECRET_KEY ?? ''
  const modo = secret.startsWith('sk_live_') ? 'live' : secret.startsWith('sk_test_') ? 'test' : 'invalido'

  type PriceCheck = { ok: boolean; modo?: string; ativo?: boolean; valor?: number; erro?: string; configurado: boolean }
  const resultados: Record<string, PriceCheck> = {}

  const todos: Record<string, string | undefined> = {
    'plus_mensal': PRICE_IDS.plus,
    'premium_mensal': PRICE_IDS.premium,
    'profissional_mensal': PRICE_IDS.profissional,
    'agencia_mensal': PRICE_IDS.agencia,
    'plus_anual': PRICE_IDS_ANUAL.plus,
    'premium_anual': PRICE_IDS_ANUAL.premium,
    'profissional_anual': PRICE_IDS_ANUAL.profissional,
    'agencia_anual': PRICE_IDS_ANUAL.agencia,
    'marca_start_mensal': PRICE_IDS_MARCA.start,
    'marca_pro_mensal': PRICE_IDS_MARCA.pro,
    'marca_scale_mensal': PRICE_IDS_MARCA.scale,
    'marca_start_anual': PRICE_IDS_MARCA_ANUAL.start,
    'marca_pro_anual': PRICE_IDS_MARCA_ANUAL.pro,
    'marca_scale_anual': PRICE_IDS_MARCA_ANUAL.scale,
  }

  for (const [chave, priceId] of Object.entries(todos)) {
    if (!priceId) {
      resultados[chave] = { ok: false, configurado: false, erro: 'env var não definida' }
      continue
    }
    try {
      const price = await stripe.prices.retrieve(priceId)
      resultados[chave] = {
        ok: true,
        configurado: true,
        ativo: price.active,
        valor: price.unit_amount ? price.unit_amount / 100 : undefined,
        modo: price.livemode ? 'live' : 'test',
      }
    } catch (e) {
      resultados[chave] = {
        ok: false,
        configurado: true,
        erro: e instanceof Error ? e.message : 'erro desconhecido',
      }
    }
  }

  // Detecta inconsistências
  const problemas: string[] = []
  if (modo === 'invalido') problemas.push('STRIPE_SECRET_KEY inválida ou não configurada')

  const modosPrice = new Set(Object.values(resultados).filter(r => r.ok).map(r => r.modo))
  if (modosPrice.size > 1) problemas.push(`MISTURA test/live nos price IDs: ${[...modosPrice].join(' + ')}`)
  if (modosPrice.size === 1 && !modosPrice.has(modo)) {
    problemas.push(`MISMATCH: STRIPE_SECRET_KEY é ${modo} mas price IDs são ${[...modosPrice][0]}`)
  }

  const semConfig = Object.entries(resultados).filter(([, r]) => !r.configurado).map(([k]) => k)
  if (semConfig.length) problemas.push(`Price IDs não configurados: ${semConfig.join(', ')}`)

  const inativos = Object.entries(resultados).filter(([, r]) => r.ok && !r.ativo).map(([k]) => k)
  if (inativos.length) problemas.push(`Price IDs INATIVOS no Stripe: ${inativos.join(', ')}`)

  const erros = Object.entries(resultados).filter(([, r]) => r.configurado && !r.ok).map(([k, r]) => `${k}: ${r.erro}`)
  if (erros.length) problemas.push(...erros)

  return NextResponse.json({
    stripe_secret_key_modo: modo,
    api_version: '2026-03-25.dahlia',
    webhook_secret_configurado: !!process.env.STRIPE_WEBHOOK_SECRET,
    problemas,
    saude: problemas.length === 0 ? 'ok' : 'problema',
    detalhes: resultados,
  }, { status: problemas.length ? 200 : 200 })
}
