import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe, priceIdToPlano } from '@/lib/stripe'
import { isAdmin } from '@/lib/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Reconcilia creator_profiles.plano com o estado real da Stripe.
 * Resolve o bug dos usuários que ficaram travados em 'trial' no DB mesmo
 * tendo uma assinatura válida (active ou trialing) na Stripe.
 *
 * Uso: POST /api/admin/reconciliar-planos (admin only)
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { dry_run = false } = (await req.json().catch(() => ({}))) as { dry_run?: boolean }
  const admin = createAdminClient()

  // Pega todos que têm stripe_subscription_id
  const { data: perfis, error } = await admin
    .from('creator_profiles')
    .select('user_id, plano, stripe_subscription_id')
    .not('stripe_subscription_id', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const atualizados: { user_id: string; de: string; para: string; status: string }[] = []
  const erros: { user_id: string; motivo: string }[] = []

  for (const p of perfis ?? []) {
    try {
      const sub = await stripe.subscriptions.retrieve(p.stripe_subscription_id!)
      const priceId = sub.items.data[0]?.price.id
      const planoReal = priceId ? priceIdToPlano(priceId) : null
      if (!planoReal) {
        erros.push({ user_id: p.user_id, motivo: 'priceId não mapeado pra plano' })
        continue
      }

      const statusAtivo = sub.status === 'active' || sub.status === 'trialing'
      const statusCancelado = ['canceled', 'unpaid', 'incomplete_expired'].includes(sub.status)

      const planoAlvo = statusCancelado ? 'free' : statusAtivo ? planoReal : p.plano

      if (planoAlvo !== p.plano) {
        if (!dry_run) {
          await admin
            .from('creator_profiles')
            .update({ plano: planoAlvo })
            .eq('user_id', p.user_id)
        }
        atualizados.push({ user_id: p.user_id, de: p.plano, para: planoAlvo, status: sub.status })
      }
    } catch (e) {
      erros.push({ user_id: p.user_id, motivo: e instanceof Error ? e.message : 'erro' })
    }
  }

  return NextResponse.json({
    dry_run,
    total_analisados: perfis?.length ?? 0,
    atualizados,
    erros,
  })
}
