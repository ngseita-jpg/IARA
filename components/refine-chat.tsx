'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from '@/lib/toast'

const SUGESTOES_PADRAO = [
  'Mais curto',
  'Mais formal',
  'Mais ousado',
  'Tom mais brasileiro',
  'Adicione um CTA forte',
  'Mais leve, menos sério',
]

/**
 * Chat compacto pra refinar conteúdo gerado pela IA.
 * Suporta sugestões clicáveis + textarea livre.
 *
 * Uso:
 *   <RefineChat
 *     modulo="roteiro"
 *     conteudoAtual={roteiro}
 *     onRefinado={(novo) => setRoteiro(novo)}
 *     sugestoes={['Mais curto', 'Mais punchy']}
 *   />
 */
export function RefineChat({
  modulo,
  conteudoAtual,
  onRefinado,
  sugestoes = SUGESTOES_PADRAO,
  defaultOpen = false,
}: {
  modulo: 'roteiro' | 'stories' | 'temas'
  conteudoAtual: string
  onRefinado: (novo: string) => void
  sugestoes?: string[]
  defaultOpen?: boolean
}) {
  const [aberto, setAberto] = useState(defaultOpen)
  const [instrucao, setInstrucao] = useState('')
  const [loading, setLoading] = useState(false)

  async function refinar(texto: string) {
    if (!texto.trim() || texto.length < 3) {
      toast.error('Diga o que ajustar (ex: "mais curto")')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/refinar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modulo,
          conteudo_atual: conteudoAtual,
          instrucao: texto,
        }),
      })
      const data = await res.json()
      if (res.status === 429) {
        toast.warning(data.mensagem ?? 'Limite atingido — faça upgrade')
        return
      }
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao refinar')
        return
      }
      if (data.refinado) {
        onRefinado(data.refinado)
        setInstrucao('')
        toast.success('Refinamento aplicado')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-iara-700/30 bg-gradient-to-br from-iara-900/15 to-[#0a0a14] overflow-hidden">
      <button
        onClick={() => setAberto(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-iara-600 to-accent-purple flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-iara-300 uppercase tracking-wider">Refinar com a Iara</p>
          <p className="text-xs text-[#6b6b8a]">{aberto ? 'Mande um ajuste e a IA reescreve' : 'Toque pra ajustar sem regerar do zero'}</p>
        </div>
        {aberto ? <ChevronUp className="w-4 h-4 text-[#5a5a7a]" /> : <ChevronDown className="w-4 h-4 text-[#5a5a7a]" />}
      </button>

      {aberto && (
        <div className="px-4 pb-4 border-t border-iara-700/20">
          {/* Sugestões rápidas */}
          <div className="flex flex-wrap gap-1.5 mt-3 mb-3">
            {sugestoes.map(s => (
              <button
                key={s}
                onClick={() => refinar(s)}
                disabled={loading}
                className="text-xs px-3 min-h-9 rounded-full bg-[#0a0a14] border border-iara-700/30 text-iara-300 hover:bg-iara-900/30 transition-colors disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input livre */}
          <div className="flex items-end gap-2">
            <textarea
              value={instrucao}
              onChange={e => setInstrucao(e.target.value.slice(0, 500))}
              placeholder="Ou descreva o ajuste: ex: 'troca o hook por algo de pergunta'"
              rows={2}
              disabled={loading}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  refinar(instrucao)
                }
              }}
              className="flex-1 rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-3 py-2.5 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-700/50 focus:outline-none resize-none"
            />
            <button
              onClick={() => refinar(instrucao)}
              disabled={loading || !instrucao.trim()}
              aria-label="Enviar"
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-r from-iara-600 to-accent-purple text-white disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-[#3a3a5a] mt-1.5">⌘+Enter pra enviar</p>
        </div>
      )}
    </div>
  )
}
