import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { isAdmin } from '@/lib/admin'

export const runtime = 'nodejs'
export const maxDuration = 30

const TARGET_URL = 'https://iarahubapp.com.br/api/stripe/webhook'
const ENABLED_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
  'charge.refunded',
] as Parameters<typeof stripe.webhookEndpoints.create>[0]['enabled_events']

/**
 * GET — lista webhooks atuais (status e URL)
 * POST — reativa webhook desativado OU cria novo se nao existir.
 *        Retorna o signing secret pra setar em STRIPE_WEBHOOK_SECRET no Vercel.
 *
 * Resolve o cenario "Stripe desativou meu endpoint e nao consigo reativar
 * pelo Dashboard" (2026-05-04).
 */
export async function GET() {
  const auth = await checkAuth()
  if (auth) return auth

  const list = await stripe.webhookEndpoints.list({ limit: 50 })
  return NextResponse.json({
    webhooks: list.data.map(w => ({
      id: w.id,
      url: w.url,
      status: w.status,
      enabled_events: w.enabled_events,
      api_version: w.api_version,
      description: w.description,
    })),
  })
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (auth) return auth

  const { action = 'auto' } = (await req.json().catch(() => ({}))) as { action?: 'auto' | 'recreate' }

  // 1) Tenta achar webhook existente apontando pro nosso URL
  const list = await stripe.webhookEndpoints.list({ limit: 50 })
  const existing = list.data.find(w => w.url === TARGET_URL)

  // 2) Se action === 'recreate', deleta todos com nosso URL e cria novo
  if (action === 'recreate') {
    for (const w of list.data.filter(x => x.url === TARGET_URL)) {
      try { await stripe.webhookEndpoints.del(w.id) } catch { /* ignora */ }
    }
    const created = await stripe.webhookEndpoints.create({
      url: TARGET_URL,
      enabled_events: ENABLED_EVENTS,
      description: 'Iara Hub — produção (recriado via API)',
    })
    return NextResponse.json({
      acao: 'recriado',
      id: created.id,
      url: created.url,
      status: created.status,
      signing_secret: created.secret,
      proximo_passo: `Cole esse secret em STRIPE_WEBHOOK_SECRET no Vercel (env vars do projeto iara-cp8e) e redeploye. Apos isso, o webhook estara totalmente funcional.`,
    })
  }

  // 3) Action 'auto':
  //    - Se nao existe: cria
  //    - Se existe e disabled: deleta e recria (Stripe API nao expoe um "enable" direto)
  //    - Se existe e enabled: nao mexe
  if (!existing) {
    const created = await stripe.webhookEndpoints.create({
      url: TARGET_URL,
      enabled_events: ENABLED_EVENTS,
      description: 'Iara Hub — produção',
    })
    return NextResponse.json({
      acao: 'criado',
      id: created.id,
      url: created.url,
      status: created.status,
      signing_secret: created.secret,
      proximo_passo: `Cole "${created.secret}" em STRIPE_WEBHOOK_SECRET no Vercel e redeploye.`,
    })
  }

  if (existing.status === 'enabled') {
    return NextResponse.json({
      acao: 'ja_ativo',
      id: existing.id,
      url: existing.url,
      status: existing.status,
      mensagem: 'Webhook ja esta ativo. Nao precisa fazer nada. Se ainda da problema, use action: "recreate" pra forcar.',
    })
  }

  // disabled — recria
  try { await stripe.webhookEndpoints.del(existing.id) } catch { /* ignora */ }
  const created = await stripe.webhookEndpoints.create({
    url: TARGET_URL,
    enabled_events: ENABLED_EVENTS,
    description: 'Iara Hub — produção (reativado via API)',
  })
  return NextResponse.json({
    acao: 'reativado',
    id_anterior: existing.id,
    id_novo: created.id,
    url: created.url,
    status: created.status,
    signing_secret: created.secret,
    proximo_passo: `IMPORTANTE: cole "${created.secret}" em STRIPE_WEBHOOK_SECRET no Vercel (Settings -> Environment Variables -> Edit STRIPE_WEBHOOK_SECRET) e redeploye. O secret antigo nao funciona mais.`,
  })
}

async function checkAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })
  }
  return null
}
