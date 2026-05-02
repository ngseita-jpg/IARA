import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { emailTrialDicaD1, emailTrialFimD2 } from '@/lib/email'

export const runtime = 'nodejs'
export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

/**
 * Cron diário (rodar 1× por dia, ex: 10h Brasília).
 * Para cada usuário em trial:
 *  - D+1 (24-48h após início): manda dica de uso ("vamos tirar valor?")
 *  - D-1 antes de cobrança: manda lembrete ("seu trial termina amanhã")
 *
 * Idempotência: salva flag em user_notif_state pra não disparar 2×.
 *
 * Disparo: configure no Vercel Cron (vercel.json) ou cron externo
 * com header `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stats = { d1_enviados: 0, d2_enviados: 0, erros: 0 }

  // Lista subscriptions em trial via Stripe (paginado)
  let cursor: string | undefined
  let totalProcessados = 0
  const MAX_LOOP = 10  // até 1000 trials por execução

  for (let i = 0; i < MAX_LOOP; i++) {
    const list = await stripe.subscriptions.list({
      status: 'trialing',
      limit: 100,
      starting_after: cursor,
    })

    for (const sub of list.data) {
      try {
        const userId = sub.metadata?.user_id
        const tipo = sub.metadata?.tipo ?? 'criador'
        const planoMeta = sub.metadata?.plano
        if (!userId || !planoMeta) continue

        const trialStart = sub.trial_start ? new Date(sub.trial_start * 1000) : null
        const trialEnd   = sub.trial_end   ? new Date(sub.trial_end * 1000)   : null
        if (!trialStart || !trialEnd) continue

        const agora = new Date()
        const horasDesdeInicio = (agora.getTime() - trialStart.getTime()) / 3600000
        const horasAteFim      = (trialEnd.getTime() - agora.getTime())   / 3600000

        // Pega email + nome
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (!user?.email) continue

        const tabelaPerfil = tipo === 'marca' ? 'brand_profiles' : 'creator_profiles'
        const { data: perfil } = await supabaseAdmin
          .from(tabelaPerfil)
          .select(tipo === 'marca' ? 'nome_empresa' : 'nome_artistico, full_name')
          .eq('user_id', userId)
          .maybeSingle()

        const nomeUser = (perfil as { nome_artistico?: string; full_name?: string; nome_empresa?: string } | null)?.nome_artistico
          ?? (perfil as { full_name?: string } | null)?.full_name
          ?? (perfil as { nome_empresa?: string } | null)?.nome_empresa
          ?? null

        // Estado de notificações pra não disparar 2×
        const { data: notifState } = await supabaseAdmin
          .from('user_notif_state')
          .select('meta')
          .eq('user_id', userId)
          .maybeSingle()
        const metaNotif = (notifState?.meta as Record<string, string> | null) ?? {}

        // D+1: 18h-30h após início, ainda não enviado
        if (
          horasDesdeInicio >= 18 && horasDesdeInicio <= 30 &&
          !metaNotif.trial_d1_em
        ) {
          await emailTrialDicaD1({
            userEmail: user.email,
            userNome: nomeUser,
            plano: planoMeta,
          })
          await supabaseAdmin.from('user_notif_state').upsert({
            user_id: userId,
            meta: { ...metaNotif, trial_d1_em: agora.toISOString() },
            updated_at: agora.toISOString(),
          }, { onConflict: 'user_id' })
          stats.d1_enviados++
        }

        // D-1 antes do fim: 18-30h antes do trial_end, ainda não enviado
        if (
          horasAteFim >= 18 && horasAteFim <= 30 &&
          !metaNotif.trial_d2_em
        ) {
          // Texto humano: "amanhã às 14h"
          const horaFim = trialEnd.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
          })
          await emailTrialFimD2({
            userEmail: user.email,
            userNome: nomeUser,
            plano: planoMeta,
            terminaEm: `amanhã às ${horaFim}`,
          })
          await supabaseAdmin.from('user_notif_state').upsert({
            user_id: userId,
            meta: { ...metaNotif, trial_d2_em: agora.toISOString() },
            updated_at: agora.toISOString(),
          }, { onConflict: 'user_id' })
          stats.d2_enviados++
        }

        totalProcessados++
      } catch (e) {
        console.error('[cron trial-emails]', e instanceof Error ? e.message : e)
        stats.erros++
      }
    }

    if (!list.has_more) break
    cursor = list.data[list.data.length - 1]?.id
    if (!cursor) break
  }

  return NextResponse.json({
    ok: true,
    processados: totalProcessados,
    ...stats,
  })
}
