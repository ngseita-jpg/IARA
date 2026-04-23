'use client'

import { useState } from 'react'
import { Zap, ArrowRight, Sparkles } from 'lucide-react'
import { UpgradeModal } from '@/components/upgrade-modal'

interface Props {
  quaseNoLimite: boolean
  limiteAtingido: boolean
  plano: string
}

export function UpgradeBanners({ quaseNoLimite, limiteAtingido, plano }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  if (plano === 'profissional') return null

  return (
    <>
      {quaseNoLimite && !limiteAtingido && (
        <button
          onClick={() => setModalOpen(true)}
          className="group mt-3 w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-950/30 to-iara-900/20 border border-amber-800/25 hover:border-amber-700/40 transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-900/30 border border-amber-800/25 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#f1f1f8]">Você está quase no limite do mês</p>
              <p className="text-xs text-[#6b6b8a]">Faça upgrade antes de acabar para não perder ritmo</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
        </button>
      )}

      {limiteAtingido && (
        <button
          onClick={() => setModalOpen(true)}
          className="group mt-3 w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-iara-900/40 to-accent-purple/10 border border-iara-700/30 hover:border-iara-600/50 transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-iara-600/30 to-accent-purple/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-iara-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#f1f1f8]">Limite atingido</p>
              <p className="text-xs text-[#6b6b8a]">Faça upgrade e gere muito mais a partir de R$ 59,90/mês</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-iara-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
        </button>
      )}

      <UpgradeModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
