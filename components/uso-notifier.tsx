'use client'

import { useEffect, useRef } from 'react'
import { toast } from '@/lib/toast'

type UsoMod = { usado: number; limite: number | null }
type UsoData = { plano: string; uso: Record<string, UsoMod> }
type NotifState = {
  uso_50_avisado_em: string | null
  uso_80_avisado_em: string | null
}

const LABELS: Record<string, string> = {
  roteiro:   'Roteiros',
  carrossel: 'Carrosseis',
  thumbnail: 'Thumbnails',
  stories:   'Stories',
  oratorio:  'Análises de oratória',
  midia_kit: 'Mídia Kits',
  temas:     'Faísca Criativa',
  fotos:     'Fotos no banco',
}

/**
 * Componente invisível que monitora uso vs limite e dispara toast proativo
 * em 80% (uma vez por mês) e em "limite atingido" (sempre).
 *
 * Renderizar uma vez no layout do dashboard.
 */
export function UsoNotifier() {
  const jaCheguei = useRef(false)

  useEffect(() => {
    if (jaCheguei.current) return
    jaCheguei.current = true

    const checar = async () => {
      try {
        const [usoRes, stateRes] = await Promise.all([
          fetch('/api/uso'),
          fetch('/api/uso/notif-state'),
        ])
        if (!usoRes.ok || !stateRes.ok) return

        const uso = await usoRes.json() as UsoData
        const state = await stateRes.json() as NotifState

        // Plano profissional/agencia: ilimitado em tudo, não notifica
        if (uso.plano === 'profissional' || uso.plano === 'agencia') return

        // Já avisamos esse mês? (>= dia 1 do mês corrente)
        const inicioMes = new Date()
        inicioMes.setUTCDate(1)
        inicioMes.setUTCHours(0, 0, 0, 0)
        const jaAvisou80NesseMes = state.uso_80_avisado_em &&
          new Date(state.uso_80_avisado_em) >= inicioMes

        // Encontra módulo com maior % de uso
        let maiorPct = 0
        let modCritico: string | null = null
        let usadoCritico = 0
        let limiteCritico = 0
        for (const [mod, m] of Object.entries(uso.uso)) {
          if (m.limite === null || m.limite === 0) continue
          const pct = m.usado / m.limite
          if (pct > maiorPct) {
            maiorPct = pct
            modCritico = mod
            usadoCritico = m.usado
            limiteCritico = m.limite
          }
        }

        if (!modCritico) return
        const label = LABELS[modCritico] ?? modCritico

        // Limite atingido (100%): sempre avisa
        if (maiorPct >= 1) {
          toast.warning(`Limite de ${label} atingido (${usadoCritico}/${limiteCritico})`, {
            description: 'Faça upgrade pra continuar gerando esse mês.',
            duration: 7000,
          })
          return
        }

        // 80%: avisa 1x por mês
        if (maiorPct >= 0.8 && !jaAvisou80NesseMes) {
          toast.info(`${label}: ${usadoCritico} de ${limiteCritico} usados esse mês`, {
            description: 'Você está perto do limite. Considere fazer upgrade pra não parar.',
            duration: 6000,
          })
          fetch('/api/uso/notif-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campo: 'uso_80_avisado_em' }),
          }).catch(() => null)
        }
      } catch {
        // silencioso — notif é nice-to-have
      }
    }

    // Pequeno delay pra não competir com loading principal
    const t = setTimeout(checar, 1500)
    return () => clearTimeout(t)
  }, [])

  return null
}
