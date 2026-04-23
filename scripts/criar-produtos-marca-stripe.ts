/**
 * Cria os 3 produtos de marca no Stripe (Start / Pro / Scale) com preço
 * mensal e anual cada. Idempotente — reaproveita produto existente via
 * metadata.iara_plano_marca.
 *
 * Uso: npx tsx scripts/criar-produtos-marca-stripe.ts
 */

import Stripe from 'stripe'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8')
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (match) {
      const [, key, rawValue] = match
      const value = rawValue.replace(/^["']|["']$/g, '').trim()
      if (!process.env[key]) process.env[key] = value
    }
  })
}

const SECRET = process.env.STRIPE_SECRET_KEY
if (!SECRET) { console.error('❌ STRIPE_SECRET_KEY não encontrada'); process.exit(1) }

const stripe = new Stripe(SECRET, { apiVersion: '2026-03-25.dahlia' })
const MODE = SECRET.startsWith('sk_live_') ? 'LIVE 🔴' : 'TEST 🧪'

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`  Iara Hub — Produtos de MARCA no Stripe (${MODE})`)
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

type ProdutoDef = {
  key: string
  name: string
  description: string
  envVarMensal: string
  envVarAnual: string
  precoMensalCents: number
  precoAnualCents: number
}

const PRODUTOS: ProdutoDef[] = [
  {
    key: 'marca_start',
    name: 'Iara Hub — Marca Start',
    description: 'Pra marca testando influência digital. 1 campanha ativa, afiliação de até 5 produtos, catálogo de criadores com filtros, 50 cupons, ROI dashboard simples.',
    envVarMensal: 'STRIPE_PRICE_MARCA_START',
    envVarAnual:  'STRIPE_PRICE_MARCA_START_ANUAL',
    precoMensalCents: 29700,
    precoAnualCents:  267300,  // 297 × 12 × 0,75
  },
  {
    key: 'marca_pro',
    name: 'Iara Hub — Marca Pro',
    description: 'Pra marca com programa de afiliação ativo. 5 campanhas ativas, afiliação ilimitada, Chat Estratégico com IA, ROI completo, match prioritário com criadores.',
    envVarMensal: 'STRIPE_PRICE_MARCA_PRO',
    envVarAnual:  'STRIPE_PRICE_MARCA_PRO_ANUAL',
    precoMensalCents: 69700,
    precoAnualCents:  627300,  // 697 × 12 × 0,75
  },
  {
    key: 'marca_scale',
    name: 'Iara Hub — Marca Scale',
    description: 'Pra grandes marcas, agências e grupos. Campanhas ilimitadas, 20 perfis de time, API, relatórios white-label, dashboard multi-produto, onboarding assistido, auditoria mensal com a Iara, SLA 4h.',
    envVarMensal: 'STRIPE_PRICE_MARCA_SCALE',
    envVarAnual:  'STRIPE_PRICE_MARCA_SCALE_ANUAL',
    precoMensalCents: 149700,
    precoAnualCents:  1347300, // 1497 × 12 × 0,75
  },
]

async function upsertProduto(def: ProdutoDef) {
  const existentes = await stripe.products.search({
    query: `metadata['iara_plano_marca']:'${def.key}' AND active:'true'`,
    limit: 1,
  })
  if (existentes.data[0]) {
    const atualizado = await stripe.products.update(existentes.data[0].id, {
      name: def.name,
      description: def.description,
    })
    return { productId: atualizado.id, created: false }
  }
  const novo = await stripe.products.create({
    name: def.name,
    description: def.description,
    metadata: { iara_plano_marca: def.key },
  })
  return { productId: novo.id, created: true }
}

async function upsertPrice(productId: string, planoKey: string, intervalo: 'month' | 'year', amount: number) {
  const existentes = await stripe.prices.list({ product: productId, active: true, limit: 100 })
  const encontrado = existentes.data.find(p =>
    p.recurring?.interval === intervalo && p.unit_amount === amount && p.currency === 'brl'
  )
  if (encontrado) return { priceId: encontrado.id, created: false }
  const novo = await stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency: 'brl',
    recurring: { interval: intervalo },
    metadata: {
      iara_plano_marca: planoKey,
      iara_periodo: intervalo === 'month' ? 'mensal' : 'anual',
    },
  })
  return { priceId: novo.id, created: true }
}

async function main() {
  const resultado: Record<string, string> = {}
  for (const def of PRODUTOS) {
    const { productId, created } = await upsertProduto(def)
    console.log(`${created ? '✨ Criado' : '♻️  Reusado'} — ${def.name}  (${productId})`)
    const { priceId: priceMensal, created: c1 } = await upsertPrice(productId, def.key, 'month', def.precoMensalCents)
    console.log(`   ${c1 ? '✨ ' : '♻️  '}Mensal R$ ${(def.precoMensalCents / 100).toFixed(2).replace('.', ',')} → ${priceMensal}`)
    resultado[def.envVarMensal] = priceMensal
    const { priceId: priceAnual, created: c2 } = await upsertPrice(productId, def.key, 'year', def.precoAnualCents)
    console.log(`   ${c2 ? '✨ ' : '♻️  '}Anual  R$ ${(def.precoAnualCents / 100).toFixed(2).replace('.', ',')} → ${priceAnual}`)
    resultado[def.envVarAnual] = priceAnual
    console.log()
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  ✅ COLAR NA VERCEL (Production + Preview + Development)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  Object.entries(resultado).forEach(([k, v]) => console.log(`${k}=${v}`))
  console.log()
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message)
  process.exit(1)
})
