'use client'

import { useState } from 'react'
import { Sparkles, Clock, MapPin, Copy, Check, RefreshCw, Trophy, Loader2, ChevronDown } from 'lucide-react'

type Props = {
  item: {
    id: string
    titulo: string
    plataforma?: string
    tipo_conteudo: string
    data_planejada: string
    horario_sugerido?: string | null
    local_sugerido?: string | null
    gancho?: string | null
    script?: string | null
    cta?: string | null
    concluido: boolean
    pontos: number
  }
  onConcluir: (id: string) => Promise<void>
  onRegerar?: () => Promise<void>
  podeRegerar?: boolean
}

export function CronogramaHojeCard({ item, onConcluir, onRegerar, podeRegerar }: Props) {
  const [scriptAberto, setScriptAberto] = useState(false)
  const [copiado, setCopiado] = useState<'gancho' | 'script' | 'cta' | null>(null)
  const [concluindo, setConcluindo] = useState(false)
  const [regerando, setRegerando] = useState(false)

  const tipoLabel: Record<string, string> = {
    reel: 'Reel', carrossel: 'Carrossel', post: 'Post',
    story: 'Story', video: 'Vídeo', live: 'Live',
  }

  async function copiar(texto: string, tipo: 'gancho' | 'script' | 'cta') {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(tipo)
      setTimeout(() => setCopiado(null), 1800)
    } catch { /* noop */ }
  }

  async function handleConcluir() {
    setConcluindo(true)
    try { await onConcluir(item.id) } finally { setConcluindo(false) }
  }

  async function handleRegerar() {
    if (!onRegerar) return
    setRegerando(true)
    try { await onRegerar() } finally { setRegerando(false) }
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-iara-600/30 via-accent-purple/20 to-accent-pink/20 border border-iara-500/40 p-5 sm:p-6 shadow-2xl shadow-iara-900/30 mb-6">
      {/* Header com badge HOJE */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-iara-500 text-white">
              Hoje
            </span>
            <span className="text-[10px] uppercase tracking-wider text-iara-300 font-semibold">
              {tipoLabel[item.tipo_conteudo] ?? item.tipo_conteudo}
              {item.plataforma ? ` · ${item.plataforma}` : ''}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">{item.titulo}</h2>
        </div>
        {item.concluido && (
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/40">
            <Check className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-bold text-green-400">Feito</span>
          </div>
        )}
      </div>

      {/* Horário + Local */}
      <div className="flex flex-wrap gap-3 mb-5">
        {item.horario_sugerido && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a0a14]/50 border border-iara-700/30">
            <Clock className="w-3.5 h-3.5 text-iara-400" />
            <span className="text-xs font-semibold text-white tabular-nums">{item.horario_sugerido.slice(0, 5)}</span>
          </div>
        )}
        {item.local_sugerido && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a0a14]/50 border border-iara-700/30 max-w-full">
            <MapPin className="w-3.5 h-3.5 text-iara-400 flex-shrink-0" />
            <span className="text-xs text-white truncate">{item.local_sugerido}</span>
          </div>
        )}
      </div>

      {/* Gancho destaque */}
      {item.gancho && (
        <div className="rounded-2xl bg-[#0a0a14]/60 border border-iara-700/30 p-4 mb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-[10px] uppercase tracking-widest font-bold text-iara-400">Hook (1ª linha do reel)</p>
            <button
              onClick={() => item.gancho && copiar(item.gancho, 'gancho')}
              className="text-[10px] flex items-center gap-1 text-iara-300 hover:text-white"
            >
              {copiado === 'gancho' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiado === 'gancho' ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="text-base font-bold text-white leading-snug">{item.gancho}</p>
        </div>
      )}

      {/* Script colapsável */}
      {item.script && (
        <div className="rounded-2xl bg-[#0a0a14]/60 border border-iara-700/30 overflow-hidden mb-3">
          <button
            onClick={() => setScriptAberto(v => !v)}
            className="w-full flex items-center justify-between gap-2 p-4 active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-iara-400" />
              <span className="text-sm font-bold text-white">Script completo</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-iara-400 transition-transform ${scriptAberto ? 'rotate-180' : ''}`} />
          </button>
          {scriptAberto && (
            <div className="border-t border-iara-700/30 p-4">
              <p className="text-sm text-[#c4c4d8] leading-relaxed whitespace-pre-wrap mb-3">{item.script}</p>
              <button
                onClick={() => item.script && copiar(item.script, 'script')}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-iara-600/30 border border-iara-500/40 text-iara-200 text-xs font-semibold hover:bg-iara-600/50"
              >
                {copiado === 'script' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiado === 'script' ? 'Copiado!' : 'Copiar script inteiro'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* CTA sugerido */}
      {item.cta && (
        <div className="rounded-2xl bg-[#0a0a14]/60 border border-iara-700/30 p-4 mb-5">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="text-[10px] uppercase tracking-widest font-bold text-iara-400">Call-to-action</p>
            <button
              onClick={() => item.cta && copiar(item.cta, 'cta')}
              className="text-[10px] flex items-center gap-1 text-iara-300 hover:text-white"
            >
              {copiado === 'cta' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiado === 'cta' ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="text-sm text-white leading-snug">{item.cta}</p>
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        {!item.concluido && (
          <button
            onClick={handleConcluir}
            disabled={concluindo}
            className="flex-1 flex items-center justify-center gap-2 min-h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-iara-500 text-white text-sm font-bold active:scale-95 disabled:opacity-50 transition"
          >
            {concluindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
            Marquei como feito (+{item.pontos} pts)
          </button>
        )}
        {podeRegerar && onRegerar && (
          <button
            onClick={handleRegerar}
            disabled={regerando}
            className="flex items-center gap-1.5 px-3 min-h-12 rounded-xl border border-[#2a2a4a] text-[#c1c1d8] text-xs font-semibold active:scale-95 hover:bg-[#1a1a2e] disabled:opacity-50 transition"
          >
            {regerando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Regerar
          </button>
        )}
      </div>
    </div>
  )
}
