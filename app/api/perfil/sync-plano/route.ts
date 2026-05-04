import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sincronizarPlanoStripe } from '@/lib/syncPlano'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Forca sincronizacao do plano do usuario com a Stripe.
 * Util quando o webhook nao chegou (ex: temporariamente desativado) e o user
 * pagou mas continua vendo limite atingido. Botao "Atualizar plano" na /conta
 * chama esse endpoint.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('creator_profiles')
    .select('plano, stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({
      atualizado: false,
      mensagem: 'Você ainda não tem assinatura ativa.',
      plano_atual: profile?.plano ?? 'free',
    })
  }

  const planoReal = await sincronizarPlanoStripe(admin, user.id, profile.stripe_customer_id)
  if (!planoReal) {
    return NextResponse.json({
      atualizado: false,
      mensagem: 'Não encontrei assinatura ativa na Stripe.',
      plano_atual: profile.plano,
    })
  }

  if (planoReal === profile.plano) {
    return NextResponse.json({
      atualizado: false,
      mensagem: 'Seu plano já está atualizado.',
      plano_atual: planoReal,
    })
  }

  return NextResponse.json({
    atualizado: true,
    mensagem: `Plano atualizado: ${profile.plano} → ${planoReal}`,
    plano_anterior: profile.plano,
    plano_atual: planoReal,
  })
}
