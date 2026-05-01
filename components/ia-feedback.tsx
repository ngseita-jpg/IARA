'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Loader2, Check } from 'lucide-react'
import { toast } from '@/lib/toast'

/**
 * Componente compacto de feedback like/dislike pós-geração de IA.
 *
 * - Compacta visualmente (não rouba atenção do conteúdo gerado)
 * - 1 clique pra rating; opcional textarea de motivo no dislike
 * - Persiste em ia_feedback (1 por user por geração)
 *
 * Uso:
 *   <IaFeedback modulo="roteiro" historyId={item.id} parametros={params} />
 */
export function IaFeedback({
  modulo,
  historyId,
  parametros,
  className = '',
}: {
  modulo: string
  historyId?: string | null
  parametros?: Record<string, unknown>
  className?: string
}) {
  const [rating, setRating] = useState<1 | -1 | null>(null)
  const [loading, setLoading] = useState<'like' | 'dislike' | null>(null)
  const [motivoOpen, setMotivoOpen] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [enviado, setEnviado] = useState(false)

  async function send(r: 1 | -1, motivoTexto?: string) {
    setLoading(r === 1 ? 'like' : 'dislike')
    try {
      const res = await fetch('/api/ia-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modulo,
          rating: r,
          conteudo_history_id: historyId ?? null,
          motivo: motivoTexto,
          parametros: parametros ?? {},
        }),
      })
      if (!res.ok) throw new Error()
      setRating(r)
      if (r === 1) {
        toast.success('Valeu pelo feedback!')
      } else {
        if (motivoTexto) {
          setEnviado(true)
          toast.success('Obrigada — vamos melhorar')
          setMotivoOpen(false)
        } else {
          // Sem motivo ainda — pede textarea
          setMotivoOpen(true)
        }
      }
    } catch {
      toast.error('Não consegui enviar feedback')
    } finally {
      setLoading(null)
    }
  }

  // Após like, mostra confirmação compacta. Dislike só fecha após enviar motivo (ou pular).
  const ratingFinal: 1 | -1 | null = rating
  if (ratingFinal === 1 || enviado) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs text-green-400 ${className}`}>
        <Check className="w-3.5 h-3.5" /> Feedback registrado
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#5a5a7a]">Esse resultado foi útil?</span>
        <button
          onClick={() => send(1)}
          disabled={!!loading}
          aria-label="Sim, gostei"
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all border border-[#1a1a2e] text-[#6b6b8a] hover:border-green-800/40 hover:text-green-400 disabled:opacity-50`}
        >
          {loading === 'like' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
        </button>
        <button
          onClick={() => send(-1)}
          disabled={!!loading}
          aria-label="Não, posso melhorar"
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all border ${
            ratingFinal === -1
              ? 'border-red-800/50 bg-red-950/30 text-red-400'
              : 'border-[#1a1a2e] text-[#6b6b8a] hover:border-red-800/40 hover:text-red-400'
          } disabled:opacity-50`}
        >
          {loading === 'dislike' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
        </button>
      </div>

      {motivoOpen && (
        <div className="flex flex-col gap-2 max-w-md">
          <textarea
            value={motivo}
            onChange={e => setMotivo(e.target.value.slice(0, 500))}
            placeholder="O que poderia ter sido melhor? (opcional)"
            rows={2}
            className="w-full rounded-xl border border-red-800/30 bg-[#0a0a14] px-3 py-2 text-xs text-[#c9c9d8] placeholder:text-[#3a3a5a] focus:border-red-700/50 focus:outline-none resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => send(-1, motivo)}
              className="px-3 min-h-9 rounded-lg bg-red-900/30 border border-red-800/40 text-red-300 text-xs font-medium hover:bg-red-900/50"
            >
              Enviar
            </button>
            <button
              onClick={() => { setMotivoOpen(false); setEnviado(true) }}
              className="px-3 min-h-9 rounded-lg border border-[#1a1a2e] text-[#6b6b8a] text-xs"
            >
              Pular
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
