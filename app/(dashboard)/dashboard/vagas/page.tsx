'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Briefcase, Loader2, Calendar, DollarSign,
  Send, X, AlertCircle, Check, MessageCircle,
  ChevronRight, Users, ListChecks, Smartphone,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ChatModal } from '@/components/chat-modal'

type Vaga = {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  valor: number | null
  nichos: string[]
  plataformas: string[]
  prazo_inscricao: string | null
  prazo_entrega: string | null
  nome_empresa: string | null
  entregaveis: string[] | null
  min_seguidores: number | null
  segmento: string | null
  created_at: string
}

type Candidatura = {
  id: string
  status: string
  mensagem: string | null
  created_at: string
  vaga_id: string
  vaga: Vaga | null
  conversa: {
    id: string
    status: string
    valor_acordado: number | null
    unread: number
  } | null
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pendente: { label: 'Aguardando resposta', cls: 'text-amber-400 bg-amber-950/40 border-amber-800/40' },
  aprovada: { label: 'Aprovada',             cls: 'text-green-400 bg-green-950/40 border-green-800/40' },
  recusada: { label: 'Não aprovada',          cls: 'text-[#5a5a7a] bg-[#1a1a2e] border-[#2a2a3e]' },
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function VagasCreatorPage() {
  const [tab, setTab] = useState<'explorar' | 'candidaturas'>('explorar')
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCands, setLoadingCands] = useState(true)
  const [myUserId, setMyUserId] = useState<string | null>(null)

  // Apply modal
  const [applyingTo, setApplyingTo] = useState<Vaga | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())

  // Detail modal
  const [detailVaga, setDetailVaga] = useState<Vaga | null>(null)

  // Chat
  const [chat, setChat] = useState<{
    conversaId: string; conversaStatus: string; valorAcordado: number | null; otherName: string
  } | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setMyUserId(data.user?.id ?? null))
  }, [])

  const fetchVagas = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/vagas')
    if (r.ok) { const d = await r.json(); setVagas(d.vagas ?? []) }
    setLoading(false)
  }, [])

  const fetchCandidaturas = useCallback(async () => {
    setLoadingCands(true)
    const r = await fetch('/api/minhas-candidaturas')
    if (r.ok) {
      const d = await r.json()
      const list: Candidatura[] = d.candidaturas ?? []
      setCandidaturas(list)
      setAppliedIds(new Set(list.map(c => c.vaga_id)))
    }
    setLoadingCands(false)
  }, [])

  useEffect(() => { fetchVagas() }, [fetchVagas])
  useEffect(() => { fetchCandidaturas() }, [fetchCandidaturas])

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
      setAppliedIds(prev => new Set([...prev, applyingTo.id]))
      setApplyingTo(null); setMensagem('')
      fetchCandidaturas()
      setTab('candidaturas')
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Erro ao enviar candidatura.')
    } finally {
      setSending(false)
    }
  }

  const totalUnread = candidaturas.reduce((sum, c) => sum + (c.conversa?.unread ?? 0), 0)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
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

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-2xl bg-[#0f0f1e] border border-[#1a1a2e] w-fit">
        <button
          onClick={() => setTab('explorar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'explorar'
              ? 'bg-iara-600/20 text-iara-300 border border-iara-600/30'
              : 'text-[#6b6b8a] hover:text-[#9b9bb5]'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Explorar
        </button>
        <button
          onClick={() => setTab('candidaturas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'candidaturas'
              ? 'bg-iara-600/20 text-iara-300 border border-iara-600/30'
              : 'text-[#6b6b8a] hover:text-[#9b9bb5]'
          }`}
        >
          <Users className="w-4 h-4" />
          Candidaturas
          {candidaturas.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-iara-600/25 text-iara-300">
              {candidaturas.length}
            </span>
          )}
          {totalUnread > 0 && (
            <span className="w-2 h-2 rounded-full bg-iara-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Explorar tab */}
      {tab === 'explorar' && (
        loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-iara-400 animate-spin" />
          </div>
        ) : vagas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#0f0f1e] border border-[#1a1a2e] flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-[#3a3a5a]" />
            </div>
            <p className="text-sm text-[#5a5a7a]">Nenhuma oportunidade aberta no momento. Volte em breve!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {vagas.map(vaga => {
              const alreadyApplied = appliedIds.has(vaga.id)
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

                  <h3 className="font-bold text-[#f1f1f8] text-base leading-snug mb-2">{vaga.titulo}</h3>

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

                  {/* Quick info */}
                  <div className="flex flex-wrap gap-3 text-[10px] text-[#5a5a7a] mb-4">
                    {vaga.prazo_inscricao && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Inscrições até {formatDate(vaga.prazo_inscricao)}
                      </span>
                    )}
                    {(vaga.min_seguidores ?? 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {vaga.min_seguidores?.toLocaleString('pt-BR')}+ seguidores
                      </span>
                    )}
                    {vaga.entregaveis && vaga.entregaveis.length > 0 && (
                      <span className="flex items-center gap-1">
                        <ListChecks className="w-3 h-3" /> {vaga.entregaveis.length} entregável{vaga.entregaveis.length !== 1 ? 'is' : ''}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-[#1a1a2e]">
                    <button
                      onClick={() => setDetailVaga(vaga)}
                      className="text-xs text-[#5a5a7a] hover:text-iara-400 transition-colors flex items-center gap-1"
                    >
                      Ver detalhes <ChevronRight className="w-3 h-3" />
                    </button>

                    {alreadyApplied ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-iara-400">
                        <Check className="w-3.5 h-3.5" /> Candidatada
                      </span>
                    ) : (
                      <button
                        onClick={() => { setApplyingTo(vaga); setSendError(null); setMensagem('') }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
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
        )
      )}

      {/* Candidaturas tab */}
      {tab === 'candidaturas' && (
        loadingCands ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-iara-400 animate-spin" />
          </div>
        ) : candidaturas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#0f0f1e] border border-[#1a1a2e] flex items-center justify-center">
              <Users className="w-7 h-7 text-[#3a3a5a]" />
            </div>
            <p className="text-sm text-[#5a5a7a]">Você ainda não se candidatou a nenhuma oportunidade.</p>
            <button
              onClick={() => setTab('explorar')}
              className="text-xs text-iara-400 hover:text-iara-300 transition-colors font-medium"
            >
              Explorar oportunidades →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {candidaturas.map(cand => {
              const vaga = cand.vaga
              const conv = cand.conversa
              const statusInfo = STATUS_LABEL[cand.status] ?? STATUS_LABEL.pendente

              return (
                <div key={cand.id} className="rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] p-5">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-[#6b6b8a]">{vaga?.nome_empresa ?? 'Empresa'}</span>
                        {vaga?.tipo === 'pago' && vaga.valor && (
                          <span className="flex items-center gap-0.5 text-xs text-iara-400 font-semibold">
                            <DollarSign className="w-3 h-3" /> R${vaga.valor.toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-[#f1f1f8] text-sm leading-snug mb-2">
                        {vaga?.titulo ?? 'Vaga encerrada'}
                      </h3>

                      {/* Status badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                        {conv && (
                          <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            conv.status === 'fechado'
                              ? 'text-iara-400 bg-iara-900/30 border-iara-700/30'
                              : 'text-[#9b9bb5] bg-[#1a1a2e] border-[#2a2a3e]'
                          }`}>
                            {conv.status === 'fechado'
                              ? `✅ Acordo fechado${conv.valor_acordado ? ` · R$${conv.valor_acordado.toLocaleString('pt-BR')}` : ''}`
                              : conv.status === 'proposta_enviada' ? '💰 Proposta recebida'
                              : '💬 Em conversa'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chat button */}
                    {conv && conv.status !== 'cancelado' && (
                      <button
                        onClick={() => setChat({
                          conversaId: conv.id,
                          conversaStatus: conv.status,
                          valorAcordado: conv.valor_acordado,
                          otherName: vaga?.nome_empresa ?? 'Empresa',
                        })}
                        className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex-shrink-0"
                        style={conv.status === 'proposta_enviada'
                          ? { background: 'rgba(201,168,76,0.12)', borderColor: 'rgba(201,168,76,0.35)', color: '#E2C068' }
                          : { background: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }
                        }
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {conv.status === 'proposta_enviada' ? 'Ver proposta' : 'Mensagens'}
                        {conv.unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-iara-500 text-[9px] font-bold text-white flex items-center justify-center">
                            {conv.unread > 9 ? '9+' : conv.unread}
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Platforms & details */}
                  {vaga && (vaga.plataformas?.length > 0 || vaga.prazo_entrega) && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#1a1a2e] items-center">
                      {vaga.plataformas?.map(p => (
                        <span key={p} className="flex items-center gap-1 text-[10px] text-[#5a5a7a]">
                          <Smartphone className="w-3 h-3" /> {p}
                        </span>
                      ))}
                      {vaga.prazo_entrega && (
                        <span className="flex items-center gap-1 text-[10px] text-[#5a5a7a] ml-auto">
                          <Calendar className="w-3 h-3" /> Entrega: {formatDate(vaga.prazo_entrega)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Detail modal */}
      {detailVaga && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setDetailVaga(null) }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-[#1a1a2e] bg-[#0d0d1a] shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#1a1a2e]">
              <div>
                <p className="text-xs text-[#6b6b8a] mb-0.5">{detailVaga.nome_empresa ?? 'Empresa parceira'}</p>
                <h2 className="text-base font-bold text-[#f1f1f8]">{detailVaga.titulo}</h2>
              </div>
              <button onClick={() => setDetailVaga(null)} className="p-1.5 rounded-lg text-[#5a5a7a] hover:text-[#f1f1f8]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Valor */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#0a0a14] border border-[#1a1a2e]">
                <DollarSign className="w-5 h-5 text-iara-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#5a5a7a] mb-0.5">Remuneração</p>
                  <p className="text-sm font-bold text-[#f1f1f8]">
                    {detailVaga.tipo === 'pago' && detailVaga.valor
                      ? `R$ ${detailVaga.valor.toLocaleString('pt-BR')} (negociável via chat)`
                      : detailVaga.tipo === 'pago' ? 'Valor a combinar via chat' : 'Permuta / Recebidos'}
                  </p>
                </div>
              </div>

              {/* Descrição */}
              {detailVaga.descricao && (
                <div>
                  <p className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Sobre a campanha</p>
                  <p className="text-sm text-[#c9c9d8] leading-relaxed">{detailVaga.descricao}</p>
                </div>
              )}

              {/* Entregáveis */}
              {detailVaga.entregaveis && detailVaga.entregaveis.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Entregáveis esperados</p>
                  <ul className="space-y-1.5">
                    {detailVaga.entregaveis.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#c9c9d8]">
                        <span className="w-1.5 h-1.5 rounded-full bg-iara-400 mt-1.5 flex-shrink-0" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Nichos + Plataformas */}
              <div className="grid grid-cols-2 gap-4">
                {detailVaga.nichos?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Nichos</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailVaga.nichos.map(n => (
                        <span key={n} className="px-2 py-1 rounded-lg text-[10px] font-medium bg-iara-900/30 border border-iara-700/30 text-iara-400">{n}</span>
                      ))}
                    </div>
                  </div>
                )}
                {detailVaga.plataformas?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Plataformas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailVaga.plataformas.map(p => (
                        <span key={p} className="px-2 py-1 rounded-lg text-[10px] font-medium bg-[#0a0a14] border border-[#1a1a2e] text-[#6b6b8a]">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Requisitos e prazos */}
              <div className="grid grid-cols-2 gap-3">
                {(detailVaga.min_seguidores ?? 0) > 0 && (
                  <div className="p-3 rounded-xl bg-[#0a0a14] border border-[#1a1a2e]">
                    <p className="text-[10px] text-[#5a5a7a] mb-0.5">Mín. seguidores</p>
                    <p className="text-sm font-bold text-[#f1f1f8]">{detailVaga.min_seguidores?.toLocaleString('pt-BR')}</p>
                  </div>
                )}
                {detailVaga.prazo_inscricao && (
                  <div className="p-3 rounded-xl bg-[#0a0a14] border border-[#1a1a2e]">
                    <p className="text-[10px] text-[#5a5a7a] mb-0.5">Prazo de inscrição</p>
                    <p className="text-sm font-bold text-[#f1f1f8]">{formatDate(detailVaga.prazo_inscricao)}</p>
                  </div>
                )}
                {detailVaga.prazo_entrega && (
                  <div className="p-3 rounded-xl bg-[#0a0a14] border border-[#1a1a2e]">
                    <p className="text-[10px] text-[#5a5a7a] mb-0.5">Entrega do conteúdo</p>
                    <p className="text-sm font-bold text-[#f1f1f8]">{formatDate(detailVaga.prazo_entrega)}</p>
                  </div>
                )}
                {detailVaga.segmento && (
                  <div className="p-3 rounded-xl bg-[#0a0a14] border border-[#1a1a2e]">
                    <p className="text-[10px] text-[#5a5a7a] mb-0.5">Segmento</p>
                    <p className="text-sm font-bold text-[#f1f1f8]">{detailVaga.segmento}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setDetailVaga(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border border-[#1a1a2e] text-[#6b6b8a] hover:text-[#9b9bb5] transition-all"
              >
                Fechar
              </button>
              {!appliedIds.has(detailVaga.id) ? (
                <button
                  onClick={() => { setApplyingTo(detailVaga); setDetailVaga(null); setSendError(null); setMensagem('') }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                >
                  <Send className="w-4 h-4" /> Candidatar-se
                </button>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-iara-400 border border-iara-700/30 bg-iara-900/20">
                  <Check className="w-4 h-4" /> Candidatura enviada
                </div>
              )}
            </div>
          </div>
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
                  Sua mensagem <span className="text-[#3a3a5a] normal-case font-normal">(recomendado)</span>
                </label>
                <textarea
                  value={mensagem}
                  onChange={e => setMensagem(e.target.value)}
                  placeholder="Por que você é o criador ideal para essa campanha? Fale sobre seus diferenciais, engajamento, casos de sucesso..."
                  rows={5}
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none transition-all resize-none"
                />
                <p className="text-xs text-[#3a3a5a] mt-1.5">Após aprovada, a marca poderá abrir um chat para negociar os detalhes</p>
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

      {/* Chat modal */}
      {chat && myUserId && (
        <ChatModal
          conversaId={chat.conversaId}
          conversaStatus={chat.conversaStatus}
          valorAcordado={chat.valorAcordado}
          myUserId={myUserId}
          isBrand={false}
          otherName={chat.otherName}
          onClose={() => setChat(null)}
          onDealClosed={() => {
            setChat(prev => prev ? { ...prev, conversaStatus: 'fechado' } : null)
            fetchCandidaturas()
          }}
        />
      )}
    </div>
  )
}
