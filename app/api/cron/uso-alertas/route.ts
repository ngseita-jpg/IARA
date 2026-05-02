import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { LIMITES, inicioMesAtual, type Plano, type TipoUso } from '@/lib/limites'
import { emailUso80Pct } from '@/lib/email'

export const runtime = 'nodejs'
export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

/**
 * Cron diário que detecta users em ≥80% do limite mensal de algum módulo
 * e dispara email (1× por mês por user).
 *
 * Roda pra todos users em planos com limite (free/plus/premium — não pro/agência).
 *
 * Idempotência: user_notif_state.uso_80_avisado_em.
 */
export async function GET(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stats = { processados: 0, enviados: 0, ja_avisados: 0, erros: 0 }

  // Pega todos profiles com plano que tem limite (não pro/agencia)
  const { data: profiles } = await supabaseAdmin
    .from('creator_profiles')
    .select('user_id, nome_artistico, full_name, plano')
    .in('plano', ['free', 'trial', 'plus', 'premium'])

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ ok: true, ...stats })
  }

  // Inicio do mês UTC
  const mesAtual = inicioMesAtual()
  const inicioMesDate = new Date(mesAtual)

  // Estado de notificações em batch
  const userIds = profiles.map(p => p.user_id)
  const { data: notifStates } = await supabaseAdmin
    .from('user_notif_state')
    .select('user_id, uso_80_avisado_em')
    .in('user_id', userIds)

  const notifMap = new Map(
    (notifStates ?? []).map(n => [n.user_id, n.uso_80_avisado_em as string | null]),
  )

  // Tipos a verificar (apenas os que têm uso mensal — não fotos que é total)
  const TIPOS_MENSAIS: TipoUso[] = ['roteiro', 'carrossel', 'thumbnail', 'stories', 'oratorio', 'midia_kit', 'temas', 'metricas']

  for (const profile of profiles) {
    try {
      stats.processados++
      const plano = profile.plano as Plano
      const limites = LIMITES[plano]

      // Já avisou esse mês? Pula.
      const ultimo = notifMap.get(profile.user_id)
      if (ultimo && new Date(ultimo) >= inicioMesDate) {
        stats.ja_avisados++
        continue
      }

      // Encontra módulo com maior % de uso
      let maiorPct = 0
      let modCritico: TipoUso | null = null
      let usadoCritico = 0
      let limiteCritico = 0

      for (const tipo of TIPOS_MENSAIS) {
        const limite = limites[tipo]
        if (limite === null || limite === 0) continue

        // Conta uso mensal
        const tabela = tipo === 'oratorio' ? 'voice_analyses' : tipo === 'metricas' ? 'analises_metricas' : 'content_history'
        let query = supabaseAdmin
          .from(tabela)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.user_id)
          .gte('created_at', mesAtual)

        if (tabela === 'content_history') {
          query = query.eq('tipo', tipo)
        }

        const { count } = await query
        const usado = count ?? 0
        const pct = usado / limite

        if (pct > maiorPct) {
          maiorPct = pct
          modCritico = tipo
          usadoCritico = usado
          limiteCritico = limite
        }
      }

      // Só envia se atingiu 80% e não bateu 100% (pra 100% mostrar toast no app)
      if (maiorPct >= 0.8 && maiorPct < 1.0 && modCritico) {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(profile.user_id)
        if (!user?.email) continue

        await emailUso80Pct({
          userEmail: user.email,
          userNome: profile.nome_artistico ?? profile.full_name ?? null,
          modulo: modCritico,
          usado: usadoCritico,
          limite: limiteCritico,
          plano,
        })

        // Marca como avisado (idempotente)
        await supabaseAdmin
          .from('user_notif_state')
          .upsert({
            user_id: profile.user_id,
            uso_80_avisado_em: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })

        stats.enviados++
      }
    } catch (e) {
      console.error('[cron uso-alertas]', e instanceof Error ? e.message : e)
      stats.erros++
    }
  }

  return NextResponse.json({ ok: true, ...stats })
}
