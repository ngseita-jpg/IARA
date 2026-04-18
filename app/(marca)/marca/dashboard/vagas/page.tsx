'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Briefcase, Plus, X, ChevronDown, ChevronUp, Check,
  Loader2, Users, Calendar, Zap, DollarSign, AlertCircle,
} from 'lucide-react'

const NICHOS = [
  'Lifestyle', 'Fitness e saúde', 'Gastronomia', 'Moda e beleza',
  'Finanças e negócios', 'Tecnologia', 'Educação', 'Entretenimento',
  'Viagem', 'Esportes', 'Games', 'Maternidade e família', 'Outro',
]
const PLATAFORMAS = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn', 'Pinterest', 'Twitch']

type Vaga = {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  valor: number | null
  nichos: string[]
  plataformas: string[]
  prazo_inscricao: string | null
  status: string
  candidaturas_count: number
  created_at: string
}

type Candidatura = {
  id: string
  mensagem: string | null
  status: string
  created_at: string
  creator_profiles: {
    nome_artistico: string | null
    nicho: string | null
    nivel: number | null
    pontos: number | null
  } | null
}

const STATUS_BADGE: Record<string, string> = {
  aberta:    'text-green-400 bg-green-950/40 border-green-800/40',
  encerrada: 'text-[#5a5a7a] bg-[#1a1a2e] border-[#2a2a3e]',
  pausada:   'text-amber-400 bg-amber-950/40 border-amber-800/40',
}

const CAND_BADGE: Record<string, string> = {
  pendente:  'text-amber-400 bg-amber-950/40 border-amber-800/40',
  aprovada:  'text-green-400 bg-green-950/40 border-green-800/40',
  recusada:  'text-red-400 bg-red-950/40 border-red-800/40',
}

const NIVEL_LABELS = ['', 'Iniciante', 'Crescente', 'Estabelecido', 'Influente', 'Elite']

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function VagasPage() {
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [candidaturas, setCandidaturas] = useState<Record<string, Candidatura[]>>({})
  const [loadingCand, setLoadingCand] = useState<string | null>(null)

  // Form state
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState<'pago' | 'recebido'>('pago')
  const [valor, setValor] = useState('')
  const [nichosSel, setNichosSel] = useState<string[]>([])
  const [plataformasSel, setPlataformasSel] = useState<string[]>([])
  const [prazoInscricao, setPrazoInscricao] = useState('')
  const [entregaveis, setEntregaveis] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const fetchVagas = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/marca/vagas')
    if (r.ok) { const d = await r.json(); setVagas(d.vagas ?? []) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchVagas() }, [fetchVagas])

  async function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (candidaturas[id]) return
    setLoadingCand(id)
    const r = await fetch(`/api/marca/vagas/${id}/candidaturas`)
    if (r.ok) { const d = await r.json(); setCandidaturas(prev => ({ ...prev, [id]: d.candidaturas })) }
    setLoadingCand(null)
  }

  async function updateStatus(vagaId: string, status: string) {
    await fetch(`/api/marca/vagas/${vagaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setVagas(prev => prev.map(v => v.id === vagaId ? { ...v, status } : v))
  }

  async function updateCandidatura(vagaId: string, candId: string, status: string) {
    await fetch(`/api/marca/vagas/${vagaId}/candidaturas`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidatura_id: candId, status }),
    })
    setCandidaturas(prev => ({
      ...prev,
      [vagaId]: prev[vagaId].map(c => c.id === candId ? { ...c, status } : c),
    }))
  }

  function resetForm() {
    setTitulo(''); setDescricao(''); setTipo('pago'); setValor('')
    setNichosSel([]); setPlataformasSel([]); setPrazoInscricao('')
    setEntregaveis(''); setCreateError(null)
  }

  function toggleChip<T extends string>(arr: T[], val: T, set: (v: T[]) => void) {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  async function handleCreate() {
    if (!titulo.trim()) { setCreateError('O título é obrigatório.'); return }
    setCreating(true); setCreateError(null)
    try {
      const r = await fetch('/api/marca/vagas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          tipo,
          valor: tipo === 'pago' && valor ? Number(valor) : null,
          nichos: nichosSel,
          plataformas: plataformasSel,
          prazo_inscricao: prazoInscricao || null,
          entregaveis: entregaveis.split('\n').map(s => s.trim()).filter(Boolean),
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setVagas(prev => [d.vaga, ...prev])
      setShowCreate(false)
      resetForm()
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Erro ao criar vaga.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-[#5a5a7a] mb-2">
          <span>Área da Marca</span><span>/</span>
          <span className="text-[#9b9bb5]">Vagas de Campanha</span>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-[#f1f1f8]">
              Vagas de <span className="marca-gradient-text">Campanha</span>
            </h1>
            <p className="text-sm text-[#5a5a7a] mt-1">Publique vagas e receba candidaturas de criadores alinhados</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #a855f7)' }}
          >
            <Plus className="w-4 h-4" /> Nova Vaga
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#E2C068] animate-spin" />
        </div>
      ) : vagas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#0f0f1e] border border-[#1a1a2e] flex items-center justify-center">
            <Briefcase className="w-7 h-7 text-[#3a3a5a]" />
          </div>
          <div className="text-center">
            <p className="text-[#f1f1f8] font-semibold mb-1">Nenhuma vaga publicada ainda</p>
            <p className="text-sm text-[#5a5a7a]">Crie sua primeira vaga e receba candidaturas de criadores</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #a855f7)' }}
          >
            <Plus className="w-4 h-4" /> Criar primeira vaga
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {vagas.map(vaga => {
            const isOpen = expandedId === vaga.id
            const cands = candidaturas[vaga.id] ?? []

            return (
              <div key={vaga.id} className="rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] overflow-hidden">
                {/* Vaga header */}
                <div className="p-5">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_BADGE[vaga.status] ?? STATUS_BADGE.encerrada}`}>
                          {vaga.status}
                        </span>
                        {vaga.tipo === 'pago' && vaga.valor ? (
                          <span className="flex items-center gap-1 text-xs text-[#E2C068] font-semibold">
                            <DollarSign className="w-3 h-3" /> R${vaga.valor.toLocaleString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-xs text-[#6b6b8a]">Permuta</span>
                        )}
                      </div>
                      <h3 className="font-bold text-[#f1f1f8] text-base leading-snug">{vaga.titulo}</h3>
                      {vaga.descricao && (
                        <p className="text-xs text-[#5a5a7a] mt-1 line-clamp-2">{vaga.descricao}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {vaga.nichos?.map(n => (
                          <span key={n} className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#E2C068]">{n}</span>
                        ))}
                        {vaga.plataformas?.map(p => (
                          <span key={p} className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-[#0a0a14] border border-[#1a1a2e] text-[#6b6b8a]">{p}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {vaga.prazo_inscricao && (
                        <div className="flex items-center gap-1 text-xs text-[#5a5a7a]">
                          <Calendar className="w-3.5 h-3.5" />
                          até {formatDate(vaga.prazo_inscricao)}
                        </div>
                      )}
                      <button
                        onClick={() => toggleExpand(vaga.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#C9A84C]/25 text-[#E2C068] hover:bg-[#C9A84C]/10 transition-all"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {vaga.candidaturas_count} candidatura{vaga.candidaturas_count !== 1 ? 's' : ''}
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      {vaga.status === 'aberta' && (
                        <button
                          onClick={() => updateStatus(vaga.id, 'encerrada')}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#2a2a3e] text-[#5a5a7a] hover:border-red-800/40 hover:text-red-400 transition-all"
                        >
                          Encerrar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Candidaturas panel */}
                {isOpen && (
                  <div className="border-t border-[#1a1a2e] px-5 pb-5 pt-4">
                    {loadingCand === vaga.id ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="w-5 h-5 text-[#E2C068] animate-spin" />
                      </div>
                    ) : cands.length === 0 ? (
                      <p className="text-sm text-[#3a3a5a] text-center py-6">Nenhuma candidatura ainda.</p>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-[#6b6b8a] uppercase tracking-widest mb-3">Candidaturas</p>
                        {cands.map(c => {
                          const creator = c.creator_profiles
                          const nivel = creator?.nivel ?? 1
                          return (
                            <div key={c.id} className="flex items-start gap-3 p-4 rounded-xl border border-[#1a1a2e] bg-[#0a0a14]">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C9A84C]/20 to-accent-purple/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-marca-300">
                                {(creator?.nome_artistico ?? 'C').charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-sm font-semibold text-[#f1f1f8]">
                                    {creator?.nome_artistico ?? 'Criador'}
                                  </span>
                                  <span className="text-[10px] text-[#6b6b8a]">{NIVEL_LABELS[nivel] ?? 'Iniciante'}</span>
                                  {creator?.nicho && (
                                    <span className="text-[10px] text-[#5a5a7a]">· {creator.nicho}</span>
                                  )}
                                  <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${CAND_BADGE[c.status] ?? CAND_BADGE.pendente}`}>
                                    {c.status}
                                  </span>
                                </div>
                                {c.mensagem && (
                                  <p className="text-xs text-[#9b9bb5] leading-relaxed mb-3">{c.mensagem}</p>
                                )}
                                {c.status === 'pendente' && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => updateCandidatura(vaga.id, c.id, 'aprovada')}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-400 border border-green-800/40 hover:bg-green-950/30 transition-all"
                                    >
                                      <Check className="w-3 h-3" /> Aprovar
                                    </button>
                                    <button
                                      onClick={() => updateCandidatura(vaga.id, c.id, 'recusada')}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-800/40 hover:bg-red-950/30 transition-all"
                                    >
                                      <X className="w-3 h-3" /> Recusar
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) { setShowCreate(false); resetForm() } }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-[#1a1a2e] bg-[#0d0d1a] shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#1a1a2e]">
              <h2 className="text-lg font-bold text-[#f1f1f8]">Nova Vaga de Campanha</h2>
              <button onClick={() => { setShowCreate(false); resetForm() }} className="p-1.5 rounded-lg text-[#5a5a7a] hover:text-[#f1f1f8] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {createError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-950/20 border border-red-800/40 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Título da vaga *</label>
                <input
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex: Criador de conteúdo para lançamento de produto"
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/40 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Descrição</label>
                <textarea
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Descreva o que você espera do criador, o contexto da campanha..."
                  rows={3}
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/40 focus:outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Tipo de parceria</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['pago', 'recebido'] as const).map(t => (
                    <button key={t} onClick={() => setTipo(t)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                        tipo === t ? 'bg-[#C9A84C]/15 border-[#C9A84C]/35 text-marca-300'
                          : 'border-[#1a1a2e] text-[#9b9bb5] hover:border-[#C9A84C]/20'
                      }`}>
                      <DollarSign className="w-4 h-4" />
                      {t === 'pago' ? 'Pago' : 'Permuta / Recebidos'}
                    </button>
                  ))}
                </div>
              </div>

              {tipo === 'pago' && (
                <div>
                  <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Valor (R$)</label>
                  <input
                    type="number"
                    value={valor}
                    onChange={e => setValor(e.target.value)}
                    placeholder="Ex: 2500"
                    className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/40 focus:outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Nichos desejados</label>
                <div className="flex flex-wrap gap-2">
                  {NICHOS.map(n => (
                    <button key={n} onClick={() => toggleChip(nichosSel, n, setNichosSel)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        nichosSel.includes(n)
                          ? 'bg-[#C9A84C]/15 border-[#C9A84C]/35 text-marca-300'
                          : 'border-[#1a1a2e] text-[#6b6b8a] hover:border-[#C9A84C]/20 hover:text-[#9b9bb5]'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Plataformas</label>
                <div className="flex flex-wrap gap-2">
                  {PLATAFORMAS.map(p => (
                    <button key={p} onClick={() => toggleChip(plataformasSel, p, setPlataformasSel)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        plataformasSel.includes(p)
                          ? 'bg-[#C9A84C]/15 border-[#C9A84C]/35 text-marca-300'
                          : 'border-[#1a1a2e] text-[#6b6b8a] hover:border-[#C9A84C]/20 hover:text-[#9b9bb5]'
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Prazo de inscrição</label>
                <input
                  type="date"
                  value={prazoInscricao}
                  onChange={e => setPrazoInscricao(e.target.value)}
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] focus:border-[#C9A84C]/40 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
                  Entregáveis <span className="text-[#3a3a5a] normal-case font-normal">(um por linha)</span>
                </label>
                <textarea
                  value={entregaveis}
                  onChange={e => setEntregaveis(e.target.value)}
                  placeholder="Ex: 3 Reels de 30s&#10;2 Stories com link&#10;1 post no feed"
                  rows={3}
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/40 focus:outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowCreate(false); resetForm() }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border border-[#1a1a2e] text-[#6b6b8a] hover:text-[#9b9bb5] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !titulo.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #a855f7)' }}
              >
                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Publicando...</> : <><Zap className="w-4 h-4" /> Publicar Vaga</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
