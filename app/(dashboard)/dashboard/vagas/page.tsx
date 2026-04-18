'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Briefcase, Loader2, Calendar, DollarSign,
  Send, X, AlertCircle, Check,
} from 'lucide-react'

type Vaga = {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  valor: number | null
  nichos: string[]
  plataformas: string[]
  prazo_inscricao: string | null
  nome_empresa: string | null
  created_at: string
}

type ApplyState = { applied: boolean; status: string | null }

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pendente: { label: 'Candidatura enviada', cls: 'text-amber-400' },
  aprovada: { label: 'Aprovada! 🎉',         cls: 'text-green-400' },
  recusada: { label: 'Não aprovada',          cls: 'text-[#5a5a7a]' },
}

export default function VagasCreatorPage() {
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [loading, setLoading] = useState(true)
  const [applyStates, setApplyStates] = useState<Record<string, ApplyState>>({})
  const [applyingTo, setApplyingTo] = useState<Vaga | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const fetchVagas = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/vagas')
    if (r.ok) {
      const d = await r.json()
      const list: Vaga[] = d.vagas ?? []
      setVagas(list)

      // Check apply state for each vaga
      const states = await Promise.all(
        list.map(async v => {
          const res = await fetch(`/api/vagas/${v.id}/candidatar`)
          if (res.ok) { const s = await res.json(); return [v.id, s] as [string, ApplyState] }
          return [v.id, { applied: false, status: null }] as [string, ApplyState]
        })
      )
      setApplyStates(Object.fromEntries(states))
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchVagas() }, [fetchVagas])

  async function handleApply() {
    if (!applyingTo) return
    setSending(true); setSendError(null)
    try {
      const r = await fetch(`/api/vagas/${applyingTo.id}/candidatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: mensagem.trim() }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setApplyStates(prev => ({ ...prev, [applyingTo.id]: { applied: true, status: 'pendente' } }))
      setApplyingTo(null); setMensagem('')
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Erro ao enviar candidatura.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-[#5a5a7a] mb-2">
          <span>Dashboard</span><span>/</span>
          <span className="text-[#9b9bb5]">Oportunidades</span>
        </div>
        <h1 className="text-3xl font-bold text-[#f1f1f8]">
          <span className="iara-gradient-text">Oportunidades</span>
        </h1>
        <p className="text-sm text-[#5a5a7a] mt-1">
          Campanhas abertas por marcas — candidate-se e feche parcerias direto na plataforma
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-iara-400 animate-spin" />
        </div>
      ) : vagas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[#0f0f1e] border border-[#1a1a2e] flex items-center justify-center">
            <Briefcase className="w-7 h-7 text-[#3a3a5a]" />
          </div>
          <p className="text-sm text-[#5a5a7a]">Nenhuma vaga aberta no momento. Volte em breve!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {vagas.map(vaga => {
            const state = applyStates[vaga.id]
            const applied = state?.applied

            return (
              <div
                key={vaga.id}
                className="flex flex-col rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] p-5 hover:border-iara-700/40 transition-all duration-200"
              >
                {/* Brand + tipo */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold text-[#6b6b8a] truncate">
                    {vaga.nome_empresa ?? 'Empresa parceira'}
                  </span>
                  <span className={`flex items-center gap-1 text-xs font-semibold flex-shrink-0 ${
                    vaga.tipo === 'pago' ? 'text-iara-400' : 'text-[#6b6b8a]'
                  }`}>
                    <DollarSign className="w-3 h-3" />
                    {vaga.tipo === 'pago' && vaga.valor
                      ? `R$${vaga.valor.toLocaleString('pt-BR')}`
                      : 'Permuta'}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-[#f1f1f8] text-base leading-snug mb-2">{vaga.titulo}</h3>

                {/* Description */}
                {vaga.descricao && (
                  <p className="text-xs text-[#5a5a7a] leading-relaxed mb-3 line-clamp-3">{vaga.descricao}</p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {vaga.nichos?.map(n => (
                    <span key={n} className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-iara-900/30 border border-iara-700/30 text-iara-400">{n}</span>
                  ))}
                  {vaga.plataformas?.map(p => (
                    <span key={p} className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-[#0a0a14] border border-[#1a1a2e] text-[#6b6b8a]">{p}</span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-[#1a1a2e]">
                  {vaga.prazo_inscricao && (
                    <div className="flex items-center gap-1 text-xs text-[#5a5a7a]">
                      <Calendar className="w-3.5 h-3.5" />
                      até {formatDate(vaga.prazo_inscricao)}
                    </div>
                  )}

                  {applied ? (
                    <span className={`ml-auto flex items-center gap-1.5 text-xs font-semibold ${STATUS_LABEL[state.status ?? 'pendente']?.cls ?? 'text-[#6b6b8a]'}`}>
                      <Check className="w-3.5 h-3.5" />
                      {STATUS_LABEL[state.status ?? 'pendente']?.label}
                    </span>
                  ) : (
                    <button
                      onClick={() => { setApplyingTo(vaga); setSendError(null); setMensagem('') }}
                      className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                    >
                      <Send className="w-3.5 h-3.5" /> Candidatar-se
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Apply modal */}
      {applyingTo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setApplyingTo(null) }}
        >
          <div className="w-full max-w-md rounded-3xl border border-[#1a1a2e] bg-[#0d0d1a] shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#1a1a2e]">
              <h2 className="text-base font-bold text-[#f1f1f8]">Candidatar-se</h2>
              <button onClick={() => setApplyingTo(null)} className="p-1.5 rounded-lg text-[#5a5a7a] hover:text-[#f1f1f8]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-[#0a0a14] border border-[#1a1a2e]">
                <p className="text-xs text-[#5a5a7a] mb-0.5">{applyingTo.nome_empresa ?? 'Empresa'}</p>
                <p className="font-semibold text-[#f1f1f8] text-sm">{applyingTo.titulo}</p>
              </div>

              {sendError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-950/20 border border-red-800/40 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {sendError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
                  Sua mensagem <span className="text-[#3a3a5a] normal-case font-normal">(opcional, mas recomendado)</span>
                </label>
                <textarea
                  value={mensagem}
                  onChange={e => setMensagem(e.target.value)}
                  placeholder="Apresente-se brevemente, por que você é a escolha certa para essa campanha, seus diferenciais..."
                  rows={5}
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setApplyingTo(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border border-[#1a1a2e] text-[#6b6b8a] hover:text-[#9b9bb5] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
              >
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Send className="w-4 h-4" /> Enviar candidatura</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
