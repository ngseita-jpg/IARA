'use client'

import { useEffect, useState } from 'react'
import { Zap, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { UpgradeModal } from '@/components/upgrade-modal'

type Uso = { usado: number; limite: number | null }
type UsoData = { plano: string; uso: Record<string, Uso> }

const LABELS: Record<string, string> = {
  roteiro:   'Roteiros',
  carrossel: 'Carrossel',
  thumbnail: 'Thumbnail',
  stories:   'Stories',
  oratorio:  'Oratória',
  midia_kit: 'Mídia Kit',
  temas:     'Faísca',
  fotos:     'Fotos',
}

function barColor(pct: number): string {
  if (pct >= 100) return 'bg-red-500'
  if (pct >= 80)  return 'bg-amber-500'
  if (pct >= 50)  return 'bg-iara-500'
  return 'bg-iara-600/60'
}

function textColor(pct: number): string {
  if (pct >= 100) return 'text-red-400'
  if (pct >= 80)  return 'text-amber-400'
  return 'text-[#6b6b8a]'
}

export function UsoSidebar() {
  const [data, setData] = useState<UsoData | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetch('/api/uso').then(r => r.json()).then(d => setData(d)).catch(() => {})
    // Refresh every 2 minutes
    const id = setInterval(() => {
      fetch('/api/uso').then(r => r.json()).then(d => setData(d)).catch(() => {})
    }, 120_000)
    return () => clearInterval(id)
  }, [])

  if (!data) return null

  const plano = data.plano ?? 'free'
  const isProfissional = plano === 'profissional'
  if (isProfissional) return null // unlimited — don't show tracker

  const entries = Object.entries(data.uso).filter(([, v]) => v.limite !== null) as [string, { usado: number; limite: number }][]
  const totalUsado = entries.reduce((s, [, v]) => s + v.usado, 0)
  const totalLimite = entries.reduce((s, [, v]) => s + v.limite, 0)
  const globalPct = totalLimite > 0 ? Math.round((totalUsado / totalLimite) * 100) : 0

  const anyAtLimit = entries.some(([, v]) => v.usado >= v.limite)
  const anyNearLimit = !anyAtLimit && entries.some(([, v]) => v.usado / v.limite >= 0.8)

  const statusColor = anyAtLimit ? 'text-red-400' : anyNearLimit ? 'text-amber-400' : 'text-[#6b6b8a]'
  const statusBg    = anyAtLimit ? 'bg-red-950/30 border-red-900/30' : anyNearLimit ? 'bg-amber-950/20 border-amber-900/25' : 'bg-[#0f0f1e] border-[#1a1a2e]'

  return (
    <>
      <div className={`mx-2 mb-3 rounded-2xl border ${statusBg} overflow-hidden transition-all duration-300`}>
        {/* Header row — always visible */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2.5 gap-2 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Zap className={`w-3.5 h-3.5 flex-shrink-0 ${statusColor}`} />
            <span className="text-xs font-semibold text-[#9b9bb5] truncate">Uso do mês</span>
            {anyAtLimit && (
              <span className="flex-shrink-0 text-[9px] font-bold text-red-400 bg-red-950/50 border border-red-900/40 px-1.5 py-0.5 rounded-full">
                Limite
              </span>
            )}
            {anyNearLimit && (
              <span className="flex-shrink-0 text-[9px] font-bold text-amber-400 bg-amber-950/40 border border-amber-900/30 px-1.5 py-0.5 rounded-full">
                80%+
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`text-[11px] font-bold ${statusColor}`}>{globalPct}%</span>
            {expanded
              ? <ChevronUp className="w-3 h-3 text-[#3a3a5a]" />
              : <ChevronDown className="w-3 h-3 text-[#3a3a5a]" />}
          </div>
        </button>

        {/* Global bar */}
        <div className="px-3 pb-2">
          <div className="h-1 rounded-full bg-[#1a1a2e] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor(globalPct)}`}
              style={{ width: `${Math.min(100, globalPct)}%` }}
            />
          </div>
        </div>

        {/* Expanded — per-module bars */}
        {expanded && (
          <div className="px-3 pb-3 space-y-2 border-t border-[#1a1a2e] pt-2">
            {entries.map(([key, val]) => {
              const pct = Math.round((val.usado / val.limite) * 100)
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-[#6b6b8a]">{LABELS[key] ?? key}</span>
                    <span className={`text-[10px] font-bold ${textColor(pct)}`}>
                      {val.usado}/{val.limite}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-[#1a1a2e] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor(pct)}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* CTA */}
        {(anyAtLimit || anyNearLimit) && (
          <button
            onClick={() => setModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold border-t border-[#1a1a2e] transition-all hover:bg-iara-900/30"
            style={{ color: anyAtLimit ? '#f87171' : '#fbbf24' }}
          >
            {anyAtLimit ? 'Ver planos para continuar' : 'Fazer upgrade antes de acabar'}
            <ArrowRight className="w-3 h-3" />
          </button>
        )}

        {!anyAtLimit && !anyNearLimit && expanded && (
          <button
            onClick={() => setModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium text-[#4a4a6a] border-t border-[#1a1a2e] hover:text-iara-400 transition-colors"
          >
            Ver planos <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      <UpgradeModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
