'use client'

import { useEffect, useState } from 'react'
import { Lightbulb, Loader2, RefreshCw } from 'lucide-react'

type Insight = { texto: string; fonte?: string; cta?: string }

const STORAGE_KEY = 'iara:insight:lastShown'
const STORAGE_DATA = 'iara:insight:data'
const TTL_MS = 10 * 60 * 1000  // 10 minutos

export function IaraInsightsCard() {
  const [insight, setInsight] = useState<Insight | null>(null)
  const [loading, setLoading] = useState(true)
  const [refrescando, setRefrescando] = useState(false)

  async function carregar(forcar = false) {
    if (typeof window === 'undefined') return
    try {
      // Se ja tem insight no localStorage e ainda esta na janela de 10min,
      // reusa — evita N requests por F5/navegacao do user
      const lastTs = localStorage.getItem(STORAGE_KEY)
      const lastData = localStorage.getItem(STORAGE_DATA)
      if (!forcar && lastTs && lastData) {
        const age = Date.now() - Number(lastTs)
        if (age < TTL_MS) {
          setInsight(JSON.parse(lastData))
          setLoading(false)
          return
        }
      }

      // Janela passou ou forçou refresh — busca novo
      if (forcar) setRefrescando(true)
      const res = await fetch('/api/insights/atual', { cache: 'no-store' })
      if (!res.ok) {
        setLoading(false)
        return
      }
      const data = await res.json()
      if (data.insight) {
        setInsight(data.insight)
        try {
          localStorage.setItem(STORAGE_KEY, String(Date.now()))
          localStorage.setItem(STORAGE_DATA, JSON.stringify(data.insight))
        } catch {/* quota cheia */}
      }
    } catch {/* falha silenciosa */}
    finally {
      setLoading(false)
      setRefrescando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  if (loading) {
    return (
      <div className="rounded-2xl border border-iara-800/30 bg-gradient-to-br from-iara-950/40 to-violet-950/20 p-4 mb-10 flex items-center gap-3 min-h-[88px]">
        <Loader2 className="w-4 h-4 animate-spin text-iara-400" />
        <span className="text-xs text-iara-300">Iara escolhendo um insight pra você…</span>
      </div>
    )
  }

  if (!insight) return null

  return (
    <div className="rounded-2xl border border-iara-700/40 bg-gradient-to-br from-iara-950/50 via-violet-950/30 to-pink-950/20 p-4 sm:p-5 mb-10 group">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-iara-600/30 border border-iara-500/40 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-iara-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[10px] uppercase tracking-widest font-bold text-iara-400">
              Iara Insights
            </p>
            <button
              onClick={() => carregar(true)}
              disabled={refrescando}
              className="text-[10px] text-iara-400/70 hover:text-iara-300 flex items-center gap-1 disabled:opacity-50"
              title="Sortear outro insight"
            >
              {refrescando ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              <span className="hidden sm:inline">Outro</span>
            </button>
          </div>
          <p className="text-sm sm:text-base text-white leading-snug">
            {insight.texto}
          </p>
          {(insight.fonte || insight.cta) && (
            <p className="text-[11px] text-iara-300/70 mt-2">
              {insight.cta && <span className="font-semibold text-iara-300">{insight.cta}</span>}
              {insight.cta && insight.fonte && <span className="mx-1">·</span>}
              {insight.fonte && <span className="italic">{insight.fonte}</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
