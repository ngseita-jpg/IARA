'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Send, Loader2, DollarSign, Check, XCircle, MessageCircle } from 'lucide-react'

type Mensagem = {
  id: string
  sender_id: string
  conteudo: string
  tipo: string
  proposta_valor: number | null
  lida: boolean
  created_at: string
}

type ChatModalProps = {
  conversaId: string
  conversaStatus: string
  valorAcordado?: number | null
  myUserId: string
  isBrand: boolean
  otherName: string
  onClose: () => void
  onDealClosed?: (valor: number | null) => void
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function ChatModal({
  conversaId, conversaStatus: initialStatus, valorAcordado: initialValor,
  myUserId, isBrand, otherName, onClose, onDealClosed,
}: ChatModalProps) {
  const [msgs, setMsgs] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(initialStatus)
  const [valorAcordado, setValorAcordado] = useState(initialValor ?? null)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [proposalValue, setProposalValue] = useState('')
  const [proposalNote, setProposalNote] = useState('')
  const [responding, setResponding] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const loadMsgs = useCallback(async () => {
    const r = await fetch(`/api/conversas/${conversaId}/mensagens`)
    if (r.ok) {
      const d = await r.json()
      setMsgs(d.mensagens ?? [])
    }
    setLoading(false)
  }, [conversaId])

  useEffect(() => {
    loadMsgs()
    const interval = setInterval(loadMsgs, 5000)
    return () => clearInterval(interval)
  }, [loadMsgs])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function sendMessage(conteudo: string, tipo = 'texto', proposta_valor?: number) {
    setSending(true)
    const r = await fetch(`/api/conversas/${conversaId}/mensagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conteudo, tipo, proposta_valor }),
    })
    if (r.ok) {
      const d = await r.json()
      setMsgs(prev => [...prev, d.mensagem])
      if (tipo === 'proposta') setStatus('proposta_enviada')
    }
    setSending(false)
  }

  async function handleSend() {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    await sendMessage(text)
  }

  async function handleProposal() {
    if (!proposalValue || sending) return
    setSending(true)
    const val = Number(proposalValue)
    const nota = proposalNote.trim()
    const conteudo = `💰 Proposta de parceria: R$ ${val.toLocaleString('pt-BR')}${nota ? `\n\n${nota}` : ''}`
    const r = await fetch(`/api/conversas/${conversaId}/mensagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conteudo, tipo: 'proposta', proposta_valor: val }),
    })
    if (r.ok) {
      const d = await r.json()
      setMsgs(prev => [...prev, d.mensagem])
      setStatus('proposta_enviada')
      setShowProposalForm(false)
      setProposalValue('')
      setProposalNote('')
    }
    setSending(false)
  }

  async function handleRespond(acao: 'aceitar' | 'recusar', valor?: number) {
    setResponding(true)
    const r = await fetch(`/api/conversas/${conversaId}/proposta`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao, valor }),
    })
    if (r.ok) {
      const newStatus = acao === 'aceitar' ? 'fechado' : 'aberta'
      setStatus(newStatus)
      if (acao === 'aceitar' && valor) {
        setValorAcordado(valor)
        onDealClosed?.(valor)
      }
      await loadMsgs()
    }
    setResponding(false)
  }

  const lastProposta = [...msgs].reverse().find(m => m.tipo === 'proposta')
  const pendingProposal = status === 'proposta_enviada' && lastProposta && lastProposta.sender_id !== myUserId

  const statusColors: Record<string, string> = {
    aberta: 'text-green-400 bg-green-950/40 border-green-800/40',
    proposta_enviada: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
    fechado: 'text-iara-400 bg-iara-900/30 border-iara-700/40',
    cancelado: 'text-[#5a5a7a] bg-[#1a1a2e] border-[#2a2a3e]',
  }
  const statusLabel: Record<string, string> = {
    aberta: 'Em negociação',
    proposta_enviada: 'Proposta enviada',
    fechado: `Fechado${valorAcordado ? ` · R$ ${valorAcordado.toLocaleString('pt-BR')}` : ''}`,
    cancelado: 'Cancelado',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-end md:justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full md:max-w-lg h-full md:h-[85vh] flex flex-col rounded-none md:rounded-3xl border-0 md:border border-[#1a1a2e] bg-[#0d0d1a] shadow-2xl shadow-black/60 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1a1a2e] flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-iara-600/30 to-accent-purple/20 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-iara-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#f1f1f8] truncate">{otherName}</p>
            <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColors[status] ?? statusColors.aberta}`}>
              {statusLabel[status] ?? status}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#5a5a7a] hover:text-[#f1f1f8] hover:bg-[#1a1a2e] transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.2) transparent' }}>
          {loading ? (
            <div className="flex justify-center pt-10">
              <Loader2 className="w-5 h-5 text-iara-400 animate-spin" />
            </div>
          ) : msgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
              <MessageCircle className="w-8 h-8 text-[#2a2a4a]" />
              <p className="text-sm text-[#3a3a5a] text-center">
                {isBrand ? 'Inicie a conversa com o criador.' : 'A marca entrará em contato em breve.'}
              </p>
            </div>
          ) : (
            msgs.map(msg => {
              const isMe = msg.sender_id === myUserId
              const isProposal = msg.tipo === 'proposta'
              const isSystem = msg.tipo === 'aceite' || msg.tipo === 'recusa'

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className={`px-4 py-2 rounded-2xl text-xs font-medium text-center max-w-[80%] ${
                      msg.tipo === 'aceite'
                        ? 'bg-green-950/40 border border-green-800/40 text-green-400'
                        : 'bg-red-950/30 border border-red-800/30 text-red-400'
                    }`}>
                      {msg.conteudo}
                    </div>
                  </div>
                )
              }

              if (isProposal) {
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%] rounded-2xl border border-[#C9A84C]/30 bg-gradient-to-br from-[#C9A84C]/10 to-accent-purple/5 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-[#E2C068]" />
                        <span className="text-xs font-bold text-[#E2C068] uppercase tracking-wider">Proposta formal</span>
                      </div>
                      <p className="text-sm text-[#f1f1f8] whitespace-pre-wrap leading-relaxed">{msg.conteudo}</p>
                      <p className="text-[10px] text-[#5a5a7a] mt-2">{formatTime(msg.created_at)}</p>
                      {/* Creator: accept/reject buttons */}
                      {!isMe && pendingProposal && msg.id === lastProposta?.id && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-[#C9A84C]/20">
                          <button
                            onClick={() => handleRespond('aceitar', msg.proposta_valor ?? undefined)}
                            disabled={responding}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-all hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                          >
                            <Check className="w-3.5 h-3.5" /> Aceitar
                          </button>
                          <button
                            onClick={() => handleRespond('recusar')}
                            disabled={responding}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-red-400 border border-red-800/40 hover:bg-red-950/30 disabled:opacity-40 transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Recusar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-iara-600/25 border border-iara-700/30 text-[#f1f1f8] rounded-br-sm'
                      : 'bg-[#1a1a2e] border border-[#2a2a3e] text-[#c9c9d8] rounded-bl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.conteudo}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-iara-500/70' : 'text-[#3a3a5a]'}`}>{formatTime(msg.created_at)}</p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Proposal form inline */}
        {showProposalForm && (
          <div className="px-4 pb-3 border-t border-[#1a1a2e] pt-3 bg-[#0a0a14] flex-shrink-0">
            <p className="text-xs font-bold text-[#E2C068] uppercase tracking-wider mb-2">Enviar proposta formal</p>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6b6b8a]">R$</span>
                <input
                  type="number"
                  value={proposalValue}
                  onChange={e => setProposalValue(e.target.value)}
                  placeholder="Valor"
                  className="w-full rounded-xl border border-[#C9A84C]/30 bg-[#0d0d1a] pl-8 pr-3 py-2.5 text-sm text-[#f1f1f8] focus:border-[#C9A84C]/60 focus:outline-none transition-all"
                />
              </div>
              <button
                onClick={handleProposal}
                disabled={!proposalValue || sending}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-[#0a0a14] disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #E2C068, #C9A84C)' }}
              >
                Enviar
              </button>
              <button onClick={() => setShowProposalForm(false)} className="px-3 py-2.5 rounded-xl border border-[#1a1a2e] text-xs text-[#5a5a7a]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={proposalNote}
              onChange={e => setProposalNote(e.target.value)}
              placeholder="Observações (entregáveis, prazo, etc.) — opcional"
              rows={2}
              className="w-full rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] px-3 py-2 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/30 focus:outline-none resize-none transition-all"
            />
          </div>
        )}

        {/* Input area */}
        {status !== 'fechado' && status !== 'cancelado' && (
          <div className="px-4 pb-4 pt-3 border-t border-[#1a1a2e] flex-shrink-0">
            {isBrand && !showProposalForm && (
              <button
                onClick={() => setShowProposalForm(true)}
                className="w-full mb-2 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border border-[#C9A84C]/25 text-[#E2C068] hover:bg-[#C9A84C]/10 transition-all"
              >
                <DollarSign className="w-3.5 h-3.5" /> Enviar Proposta de Valor
              </button>
            )}
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Escreva uma mensagem..."
                rows={1}
                className="flex-1 rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/40 focus:outline-none transition-all resize-none"
                style={{ maxHeight: '120px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="p-3 rounded-xl text-white disabled:opacity-40 transition-all hover:opacity-90 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-[#3a3a5a] mt-1.5 text-center">Enter para enviar · Shift+Enter para nova linha</p>
          </div>
        )}

        {status === 'fechado' && (
          <div className="px-5 pb-5 pt-3 border-t border-iara-700/30 text-center flex-shrink-0">
            <p className="text-sm font-semibold text-iara-400">
              ✅ Acordo fechado{valorAcordado ? ` · R$ ${valorAcordado.toLocaleString('pt-BR')}` : ''}
            </p>
            <p className="text-xs text-[#5a5a7a] mt-0.5">Esta parceria foi formalizada pela Iara Hub</p>
          </div>
        )}
      </div>
    </div>
  )
}
