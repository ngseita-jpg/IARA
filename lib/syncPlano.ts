// Auto-heal de creator_profiles.plano quando o webhook Stripe nao chegou.
// Cenario real (2026-05-04): webhook desativado por timeout, users pagaram
// plano profissional/agencia mas DB ficou em 'free'. Resultado: bateram no
// limite mensal apesar de plano ilimitado pago.
//
// Solucao: quando verificarLimite for falhar com 'limite_atingido', chama
// esse helper. Se user tem stripe_customer_id e ha subscription ativa na
// Stripe, atualiza o DB e retorna o plano real. Caro (chamada Stripe API),
// mas so roda quando bate limite — em uso normal nao paga o custo.

import { stripe, priceIdToPlano } from './stripe'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function sincronizarPlanoStripe(
  admin: SupabaseClient,
  userId: string,
  stripeCustomerId: string,
): Promise<string | null> {
  try {
    // Pega subscriptions ativas/trialing do customer
    const subs = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      limit: 5,
    })

    // Pega a primeira que esteja ativa ou em trial
    const ativa = subs.data.find(s => s.status === 'active' || s.status === 'trialing')
    if (!ativa) return null

    const priceId = ativa.items.data[0]?.price.id
    if (!priceId) return null

    const planoReal = priceIdToPlano(priceId)
    if (!planoReal) return null

    // Atualiza o DB com o plano + subscription_id
    await admin
      .from('creator_profiles')
      .update({ plano: planoReal, stripe_subscription_id: ativa.id })
      .eq('user_id', userId)

    return planoReal
  } catch (e) {
    console.error('[syncPlano] erro:', e instanceof Error ? e.message : e)
    return null
  }
}
