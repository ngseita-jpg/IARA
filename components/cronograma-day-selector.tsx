'use client'

import { Moon, CheckCircle2 } from 'lucide-react'

type Item = {
  id: string
  data_planejada: string
  tipo_conteudo: string
  concluido: boolean
  gerado_por_ia?: boolean
}

type Props = {
  diasSemana: string[]            // ['2026-05-04', '2026-05-05', ..., '2026-05-10']
  hoje: string                     // 'YYYY-MM-DD' do dia atual
  selecionado: string              // 'YYYY-MM-DD' do dia selecionado
  onSelecionar: (data: string) => void
  items: Item[]
}

const NOMES_DIA_CURTO = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']
const TIPO_EMOJI: Record<string, string> = {
  reel: '🎬',
  carrossel: '🖼️',
  post: '📸',
  story: '📱',
  video: '▶️',
  live: '🔴',
}

export function CronogramaDaySelector({ diasSemana, hoje, selecionado, onSelecionar, items }: Props) {
  return (
    <div className="mb-4">
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {diasSemana.map((data) => {
          const d = new Date(data + 'T00:00:00')
          const diaSemana = NOMES_DIA_CURTO[d.getDay()]
          const numDia = d.getDate()
          const ehHoje = data === hoje
          const ehSelecionado = data === selecionado
          const itemDoDia = items.find(i => i.data_planejada === data && i.gerado_por_ia)
          const concluido = itemDoDia?.concluido === true

          return (
            <button
              key={data}
              onClick={() => onSelecionar(data)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 sm:px-4 py-2.5 rounded-2xl border transition-all min-w-[60px]
                ${ehSelecionado
                  ? 'bg-gradient-to-br from-iara-600 to-accent-purple border-iara-400 shadow-lg shadow-iara-900/40 scale-105'
                  : ehHoje
                    ? 'bg-iara-900/40 border-iara-600/50 hover:border-iara-500'
                    : itemDoDia
                      ? 'bg-[#13131f] border-[#1f1f35] hover:border-iara-700/40'
                      : 'bg-[#0a0a14] border-[#1a1a2e] hover:border-[#2a2a4a]'
                }`}
            >
              <span className={`text-[10px] font-bold tracking-wider ${ehSelecionado ? 'text-white' : ehHoje ? 'text-iara-300' : 'text-[#5a5a7a]'}`}>
                {diaSemana}
              </span>
              <span className={`text-lg font-black ${ehSelecionado ? 'text-white' : ehHoje ? 'text-iara-200' : itemDoDia ? 'text-[#d0d0e8]' : 'text-[#5a5a7a]'}`}>
                {numDia}
              </span>
              <div className="h-4 flex items-center justify-center">
                {concluido ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : itemDoDia ? (
                  <span className="text-xs">{TIPO_EMOJI[itemDoDia.tipo_conteudo] ?? '•'}</span>
                ) : (
                  <Moon className="w-3 h-3 text-[#3a3a5a]" />
                )}
              </div>
              {ehHoje && !ehSelecionado && (
                <span className="text-[8px] uppercase tracking-widest text-iara-400 font-bold mt-0.5">hoje</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
