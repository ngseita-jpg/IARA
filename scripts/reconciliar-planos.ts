/**
 * Reconcilia creator_profiles.plano + brand_profiles.plano com o estado real da Stripe.
 * Corrige usuários que ficaram travados em 'trial' ou em plano errado por conta do bug
 * antigo do webhook.
 *
 * Uso:
 *   npx tsx scripts/reconciliar-planos.ts           # dry-run (só mostra)
 *   npx tsx scripts/reconciliar-planos.ts --apply   # aplica as mudanças
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ── Carrega .env.local ──────────────────────────────────────────────
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

const DRY_RUN = !process.argv.includes('--apply')
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY
const SUPA_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!STRIPE_SECRET || !SUPA_URL || !SUPA_KEY) {
  console.error('❌ Faltando STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Usamos metadata do product.metadata (iara_plano ou iara_plano_marca) como
// ground truth — é o que os scripts de criação definiram no Stripe.
// Isso é mais confiável que env vars que podem estar desatualizados localmente.

const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2026-03-25.dahlia' })
const supabase = createClient(SUPA_URL, SUPA_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const MODE = STRIPE_SECRET.startsWith('sk_live_') ? 'LIVE 🔴' : 'TEST 🧪'
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`  Reconciliação de planos (${MODE}) — ${DRY_RUN ? 'DRY-RUN' : 'APPLY ✏️'}`)
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

type Perfil = { user_id: string; plano: string; stripe_subscription_id: string | null }

async function reconciliar(
  label: 'CRIADOR' | 'MARCA',
  tabela: 'creator_profiles' | 'brand_profiles',
) {
  console.log(`── ${label} ──────────────────────────────`)

  const { data: perfis, error } = await supabase
    .from(tabela)
    .select('user_id, plano, stripe_subscription_id')
    .not('stripe_subscription_id', 'is', null)

  if (error) {
    console.error(`❌ Erro ao ler ${tabela}: ${error.message}`)
    return
  }

  console.log(`${perfis?.length ?? 0} assinaturas com stripe_subscription_id\n`)

  let atualizados = 0
  let okjaCerto = 0
  const erros: string[] = []

  const metaKey = label === 'MARCA' ? 'iara_plano_marca' : 'iara_plano'

  for (const p of (perfis ?? []) as Perfil[]) {
    if (!p.stripe_subscription_id) continue
    try {
      const sub = await stripe.subscriptions.retrieve(p.stripe_subscription_id, {
        expand: ['items.data.price.product'],
      })
      const price = sub.items.data[0]?.price
      const product = price?.product as Stripe.Product | undefined

      // Ordem de prioridade: product.metadata → price.metadata → sub.metadata
      let planoReal = product?.metadata?.[metaKey] || price?.metadata?.[metaKey] || sub.metadata?.plano
      if (planoReal) planoReal = planoReal.replace(/^marca_/, '')

      if (!planoReal) {
        erros.push(`${p.user_id}: não achei metadata.${metaKey} em price ${price?.id}`)
        continue
      }

      const periodo = (price?.metadata?.iara_periodo || sub.metadata?.periodo || 'mensal') as 'mensal' | 'anual'
      const statusCancelado = ['canceled', 'unpaid', 'incomplete_expired'].includes(sub.status)
      const statusAtivo = sub.status === 'active' || sub.status === 'trialing'

      let planoAlvo: string
      if (statusCancelado) planoAlvo = 'free'
      else if (statusAtivo) planoAlvo = planoReal
      else planoAlvo = p.plano

      if (planoAlvo === p.plano) {
        okjaCerto++
        continue
      }

      console.log(`  ${p.user_id.slice(0, 8)}…  ${p.plano}  →  ${planoAlvo}   [stripe=${sub.status}]`)

      if (!DRY_RUN) {
        const update: Record<string, unknown> = { plano: planoAlvo }
        if (statusCancelado) update.stripe_subscription_id = null
        if (tabela === 'brand_profiles') update.plano_periodo = periodo

        const { error: upErr } = await supabase
          .from(tabela)
          .update(update)
          .eq('user_id', p.user_id)
        if (upErr) {
          erros.push(`${p.user_id}: ${upErr.message}`)
          continue
        }
      }
      atualizados++
    } catch (e) {
      erros.push(`${p.user_id}: ${e instanceof Error ? e.message : 'erro'}`)
    }
  }

  console.log(`\n   já corretos: ${okjaCerto}`)
  console.log(`   ${DRY_RUN ? 'a atualizar' : 'atualizados'}: ${atualizados}`)
  if (erros.length) {
    console.log(`   erros: ${erros.length}`)
    erros.slice(0, 5).forEach(e => console.log(`     ⚠ ${e}`))
  }
  console.log()
}

async function main() {
  await reconciliar('CRIADOR', 'creator_profiles')
  await reconciliar('MARCA',   'brand_profiles')

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  if (DRY_RUN) {
    console.log(`  Rode novamente com --apply pra aplicar as mudanças.`)
  } else {
    console.log(`  ✅ Reconciliação concluída.`)
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

main().catch(e => {
  console.error('❌ Erro fatal:', e)
  process.exit(1)
})
