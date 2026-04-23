/**
 * Script de criação automatizada dos produtos e preços do Iara Hub no Stripe.
 *
 * Uso:
 *   npx tsx scripts/criar-produtos-stripe.ts
 *
 * Requer STRIPE_SECRET_KEY no .env.local.
 *
 * Idempotente: se um produto já existe (mesmo metadata.key), reusa em vez de duplicar.
 */

import Stripe from 'stripe'
import * as fs from 'fs'
import * as path from 'path'

// ── Carrega .env.local manualmente ─────────────────────────────────
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
if (!SECRET) {
  console.error('❌ STRIPE_SECRET_KEY não encontrada no .env.local')
  process.exit(1)
}

const stripe = new Stripe(SECRET, { apiVersion: '2026-03-25.dahlia' })

const MODE = SECRET.startsWith('sk_live_') ? 'LIVE 🔴' : 'TEST 🧪'
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`  Iara Hub — Criação de produtos no Stripe (${MODE})`)
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

// ── Definição dos 4 produtos ───────────────────────────────────────
type ProdutoDef = {
  key: string                 // identificador único (metadata.iara_plano)
  name: string
  description: string
  envVarMensal: string
  envVarAnual: string
  precoMensalCents: number    // em centavos
  precoAnualCents: number     // em centavos (12 meses × 0,75)
}

function descMes(limitesOuPromessa: string) {
  return `Assinatura MENSAL — ${limitesOuPromessa}`
}

function descAno(limitesOuPromessa: string) {
  return `Assinatura ANUAL (25% off) — ${limitesOuPromessa}`
}

const PRODUTOS: ProdutoDef[] = [
  {
    key: 'plus',
    name: 'Iara Hub Plus',
    description: '10 roteiros, 7 carrosseis, 7 thumbnails, 7 stories, 3 análises de oratória, 25 fotos, Mídia Kit PDF.',
    envVarMensal: 'STRIPE_PRICE_PLUS',
    envVarAnual:  'STRIPE_PRICE_PLUS_ANUAL',
    precoMensalCents: 5990,
    precoAnualCents:  53880,
  },
  {
    key: 'premium',
    name: 'Iara Hub Premium',
    description: '20 roteiros, 18 carrosseis, 18 thumbnails, 18 stories, 8 análises de oratória, 80 fotos, Métricas com IA, suporte prioritário.',
    envVarMensal: 'STRIPE_PRICE_PREMIUM',
    envVarAnual:  'STRIPE_PRICE_PREMIUM_ANUAL',
    precoMensalCents: 12900,
    precoAnualCents:  116100,
  },
  {
    key: 'profissional',
    name: 'Iara Hub Profissional',
    description: 'Tudo ilimitado — roteiros, carrosseis, thumbnails, stories, oratórias, mídia kits e fotos. Prioridade no match com marcas, suporte VIP.',
    envVarMensal: 'STRIPE_PRICE_PROFISSIONAL',
    envVarAnual:  'STRIPE_PRICE_PROFISSIONAL_ANUAL',
    precoMensalCents: 24900,
    precoAnualCents:  224100,
  },
  {
    key: 'agencia',
    name: 'Iara Hub Agência',
    description: 'Até 5 perfis gerenciáveis, dashboard de clientes, relatórios white-label, match prioritário com marcas, suporte dedicado.',
    envVarMensal: 'STRIPE_PRICE_AGENCIA',
    envVarAnual:  'STRIPE_PRICE_AGENCIA_ANUAL',
    precoMensalCents: 49900,
    precoAnualCents:  449100,
  },
]

// ── Criação idempotente ────────────────────────────────────────────
async function upsertProduto(def: ProdutoDef): Promise<{ productId: string; created: boolean }> {
  // Procura produto com metadata iara_plano = def.key
  const existentes = await stripe.products.search({
    query: `metadata['iara_plano']:'${def.key}' AND active:'true'`,
    limit: 1,
  })

  if (existentes.data[0]) {
    // Atualiza nome e descrição (caso tenha mudado)
    const atualizado = await stripe.products.update(existentes.data[0].id, {
      name: def.name,
      description: def.description,
    })
    return { productId: atualizado.id, created: false }
  }

  const novo = await stripe.products.create({
    name: def.name,
    description: def.description,
    metadata: { iara_plano: def.key },
    // Default price será criado logo abaixo
  })
  return { productId: novo.id, created: true }
}

async function upsertPrice(
  productId: string,
  planoKey: string,
  intervalo: 'month' | 'year',
  amount: number,
): Promise<{ priceId: string; created: boolean }> {
  // Procura preço existente com mesma config
  const existentes = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  })
  const encontrado = existentes.data.find(p =>
    p.recurring?.interval === intervalo &&
    p.unit_amount === amount &&
    p.currency === 'brl'
  )
  if (encontrado) {
    return { priceId: encontrado.id, created: false }
  }

  const novo = await stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency: 'brl',
    recurring: { interval: intervalo },
    metadata: {
      iara_plano: planoKey,
      iara_periodo: intervalo === 'month' ? 'mensal' : 'anual',
    },
  })
  return { priceId: novo.id, created: true }
}

// ── Execução ───────────────────────────────────────────────────────
async function main() {
  const resultado: Record<string, string> = {}

  for (const def of PRODUTOS) {
    const { productId, created } = await upsertProduto(def)
    console.log(`${created ? '✨ Criado' : '♻️  Reusado'} — ${def.name}  (${productId})`)

    const { priceId: priceMensal, created: c1 } = await upsertPrice(productId, def.key, 'month', def.precoMensalCents)
    console.log(`   ${c1 ? '✨ ' : '♻️  '}Preço mensal R$ ${(def.precoMensalCents / 100).toFixed(2).replace('.', ',')} → ${priceMensal}`)
    resultado[def.envVarMensal] = priceMensal

    const { priceId: priceAnual, created: c2 } = await upsertPrice(productId, def.key, 'year', def.precoAnualCents)
    console.log(`   ${c2 ? '✨ ' : '♻️  '}Preço anual  R$ ${(def.precoAnualCents / 100).toFixed(2).replace('.', ',')} → ${priceAnual}`)
    resultado[def.envVarAnual] = priceAnual

    console.log()
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  ✅ COPIA AS LINHAS ABAIXO E COLA NA VERCEL`)
  console.log(`     Settings → Environment Variables`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  Object.entries(resultado).forEach(([k, v]) => console.log(`${k}=${v}`))

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  Modo: ${MODE}`)
  console.log(`  Depois de colar na Vercel, faz redeploy.`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message)
  if (err.type === 'StripeAuthenticationError') {
    console.error('   Verifica se STRIPE_SECRET_KEY está correta no .env.local')
  }
  process.exit(1)
})
