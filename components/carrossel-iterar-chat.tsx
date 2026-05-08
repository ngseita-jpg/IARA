'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Send, AlertCircle } from 'lucide-react'
import type { CarrosselData } from '@/app/api/carrossel/gerar/route'

const SUGESTOES = [
  'Deixa o hook mais polêmico',
  'Adiciona uma estatística no slide 2',
  'Reescreve o CTA do último',
  'Mais brasileiro, menos formal',
  'Encurta os slides',
  'Inclui um exemplo prático',
]

type Props = {
  carrossel: CarrosselData
  onAtualizar: (novo: CarrosselData) => void
}

export function CarrosselIterarChat({ carrossel, onAtualizar }: Props) {
  const [instrucao, setInstrucao] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ultimaMudanca, setUltimaMudanca] = useState<string | null>(null)

  async function enviar() {
    const txt = instrucao.trim()
    if (!txt || carregando) return
    setCarregando(true)
    setErro(null)
    try {
      const res = await fetch('/api/carrossel/iterar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrossel, instrucao: txt }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.detalhe ? `${data.error} [${data.detalhe}]` : (data.error ?? 'Erro'))
        return
      }
      onAtualizar(data.carrossel)
      setUltimaMudanca(txt)
      setInstrucao('')
      setTimeout(() => setUltimaMudanca(null), 4000)
    } catch {
      setErro('Falha de conexão')
    } finally {
      setCarregando(false)
    }
  }

  function aplicarSugestao(s: string) {
    setInstrucao(s)
  }

  return (
    <div className="iara-card p-4 sm:p-5 mb-6 border border-iara-700/30 bg-gradient-to-br from-iara-950/30 to-violet-950/20">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="text-sm font-bold text-iara-200">Pedir alteração à Iara</h3>
        <span className="text-[10px] text-[#6b6b8a] ml-auto hidden sm:inline">
          mantém o que funciona, muda o que você pediu
        </span>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={instrucao}
          onChange={(e) => setInstrucao(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && enviar()}
          disabled={carregando}
          placeholder='Ex: "muda o hook" / "adiciona dado no slide 3" / "mais informal"'
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#0a0a14]/80 border border-[#2a2a4a] focus:border-iara-500/50 focus:outline-none text-sm text-[#f1f1f8] placeholder:text-[#5a5a7a] disabled:opacity-50"
        />
        <button
          onClick={enviar}
          disabled={!instrucao.trim() || carregando}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-iara-500 to-accent-purple text-white font-bold text-sm disabled:opacity-50 flex items-center gap-2 transition-all"
        >
          {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="hidden sm:inline">{carregando ? 'Iara pensando...' : 'Enviar'}</span>
        </button>
      </div>

      {/* Sugestões rápidas */}
      <div className="flex flex-wrap gap-1.5">
        {SUGESTOES.map((s) => (
          <button
            key={s}
            onClick={() => aplicarSugestao(s)}
            disabled={carregando}
            className="text-[11px] px-2.5 py-1 rounded-full bg-iara-900/30 border border-iara-700/30 text-iara-300 hover:bg-iara-900/50 hover:text-iara-200 transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {erro && (
        <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-red-950/30 border border-red-800/40 text-red-300 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}
      {ultimaMudanca && !erro && (
        <p className="mt-3 text-xs text-emerald-400/80 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Aplicado: <span className="italic">&ldquo;{ultimaMudanca}&rdquo;</span>
        </p>
      )}
    </div>
  )
}
