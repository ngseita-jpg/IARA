'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Check,
  Trophy, Loader2, X, Target, Sparkles, Trash2,
} from 'lucide-react'

type CalendarItem = {
  id: string
  titulo: string
  plataforma?: string
  tipo_conteudo: string
  data_planejada: string
  concluido: boolean
  concluido_em?: string
  pontos: number
  meta_id?: string
  meta?: {
    id: string
    titulo: string
    quantidade_atual: number
    quantidade_meta: number
    pontos_recompensa: number
    status: string
  }
}

type Meta = {
  id: string
  titulo: string
  plataforma?: string
  meta_tipo: string
  quantidade_atual: number
  quantidade_meta: number
  pontos_recompensa: number
  status: string
  data_limite?: string
}

type PontosNotif = { pts: number; meta?: string } | null

const TIPOS = [
  { value: 'post',      label: 'Post',      icon: '📸', color: 'bg-pink-900/30 border-pink-800/30 text-pink-300' },
  { value: 'reel',      label: 'Reel',      icon: '🎬', color: 'bg-purple-900/30 border-purple-800/30 text-purple-300' },
  { value: 'story',     label: 'Story',     icon: '📱', color: 'bg-blue-900/30 border-blue-800/30 text-blue-300' },
  { value: 'video',     label: 'Vídeo',     icon: '▶️', color: 'bg-red-900/30 border-red-800/30 text-red-300' },
  { value: 'live',      label: 'Live',      icon: '🔴', color: 'bg-orange-900/30 border-orange-800/30 text-orange-300' },
  { value: 'carrossel', label: 'Carrossel', icon: '🖼️', color: 'bg-teal-900/30 border-teal-800/30 text-teal-300' },
]

const PLATAFORMAS = ['Instagram', 'YouTube', 'TikTok', 'LinkedIn', 'Twitter/X', 'Kwai']
const PLATAFORMA_ICONES: Record<string, string> = {
  Instagram: '📸', YouTube: '▶️', TikTok: '🎵',
  LinkedIn: '💼', 'Twitter/X': '𝕏', Kwai: '🎬',
}

function getTipoInfo(tipo: string) {
  return TIPOS.find(t => t.value === tipo) ?? TIPOS[0]
}

function getWeekDays(referenceDate: Date): Date[] {
  const d = new Date(referenceDate)
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return date
  })
}

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const DIAS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function CalendarioPage() {
  const [weekRef, setWeekRef] = useState(new Date())
  const [items, setItems] = useState<CalendarItem[]>([])
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState<string | null>(null) // date string
  const [concluindo, setConcluindo] = useState<string | null>(null)
  const [pontosNotif, setPontosNotif] = useState<PontosNotif>(null)
  const [totalPontos, setTotalPontos] = useState<number | null>(null)

  const [form, setForm] = useState({
    titulo: '', plataforma: '', tipo_conteudo: 'post', meta_id: '',
  })

  const weekDays = getWeekDays(weekRef)
  const inicio = toLocalDateStr(weekDays[0])
  const fim = toLocalDateStr(weekDays[6])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/calendario?inicio=${inicio}&fim=${fim}`)
      const data = await res.json()
      setItems(data.items ?? [])
      setMetas(data.metas ?? [])
    } finally {
      setLoading(false)
    }
  }, [inicio, fim])

  useEffect(() => { loadData() }, [loadData])

  async function addItem(date: string) {
    if (!form.titulo.trim()) return
    const res = await fetch('/api/calendario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, data_planejada: date, meta_id: form.meta_id || null }),
    })
    const data = await res.json()
    if (res.ok) {
      setItems(prev => [...prev, data])
      setForm({ titulo: '', plataforma: '', tipo_conteudo: 'post', meta_id: '' })
      setShowForm(null)
    }
  }

  async function concluirItem(id: string) {
    setConcluindo(id)
    try {
      const res = await fetch('/api/calendario', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (res.ok) {
        setItems(prev => prev.map(item =>
          item.id === id ? { ...item, concluido: true, concluido_em: new Date().toISOString() } : item
        ))
        // Atualizar meta no painel se foi concluída
        if (data.meta_concluida) {
          setMetas(prev => prev.map(m => {
            const item = items.find(i => i.id === id)
            if (item?.meta_id === m.id) return { ...m, status: 'concluida' }
            return m
          }))
        }
        // Atualizar progresso da meta localmente
        setItems(prev => prev.map(item => {
          if (item.id === id && item.meta) {
            return { ...item, meta: { ...item.meta, quantidade_atual: item.meta.quantidade_atual + 1 } }
          }
          return item
        }))
        setTotalPontos(data.pontos_total)
        setPontosNotif({
          pts: data.pontos_ganhos,
          meta: data.meta_concluida ? 'Meta concluída! 🎉' : undefined,
        })
        setTimeout(() => setPontosNotif(null), 3500)
      }
    } finally {
      setConcluindo(null)
    }
  }

  async function deletarItem(id: string) {
    await fetch(`/api/calendario?id=${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const today = toLocalDateStr(new Date())
  const itensConcluidosSemana = items.filter(i => i.concluido).length
  const totalSemana = items.length
  const pontosSemana = items.filter(i => i.concluido).reduce((acc, i) => acc + i.pontos, 0)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-iara-400 text-sm font-medium mb-2">
          <Calendar className="w-4 h-4" />
          <span>Módulo</span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#f1f1f8]">
              Calendário <span className="iara-gradient-text">Editorial</span>
            </h1>
            <p className="mt-1 text-[#9b9bb5] text-sm">
              Planeje seu conteúdo, conecte às metas e ganhe pontos ao postar.
            </p>
          </div>

          {/* Resumo da semana */}
          <div className="flex items-center gap-3">
            <div className="iara-card px-4 py-2.5 text-center">
              <p className="text-lg font-bold iara-gradient-text">{itensConcluidosSemana}/{totalSemana}</p>
              <p className="text-[10px] text-[#5a5a7a]">postagens</p>
            </div>
            <div className="iara-card px-4 py-2.5 text-center">
              <p className="text-lg font-bold text-yellow-400">+{pontosSemana}</p>
              <p className="text-[10px] text-[#5a5a7a]">pts esta semana</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notificação de pontos */}
      {pontosNotif && (
        <div className="fixed top-6 right-6 z-50 animate-slide-up iara-card px-5 py-3 border-iara-700/50 shadow-2xl flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-yellow-400">+{pontosNotif.pts} pontos!</p>
            {pontosNotif.meta && <p className="text-xs text-green-400">{pontosNotif.meta}</p>}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendário principal */}
        <div className="flex-1 min-w-0">
          {/* Navegação de semana */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => { const d = new Date(weekRef); d.setDate(d.getDate() - 7); setWeekRef(d) }}
              className="iara-btn-secondary px-3 py-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-[#f1f1f8]">
              {weekDays[0].getDate()} {MESES_PT[weekDays[0].getMonth()]} – {weekDays[6].getDate()} {MESES_PT[weekDays[6].getMonth()]} {weekDays[6].getFullYear()}
            </span>
            <button
              onClick={() => { const d = new Date(weekRef); d.setDate(d.getDate() + 7); setWeekRef(d) }}
              className="iara-btn-secondary px-3 py-2"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Grade semanal — scrollable horizontally on mobile */}
          <div className="-mx-4 sm:mx-0 overflow-x-auto pb-2">
          <div className="grid grid-cols-7 gap-2 min-w-[560px] px-4 sm:px-0">
            {weekDays.map((day, idx) => {
              const dateStr = toLocalDateStr(day)
              const isToday = dateStr === today
              const isPast = dateStr < today
              const dayItems = items.filter(i => i.data_planejada === dateStr)
              const isFormOpen = showForm === dateStr

              return (
                <div key={dateStr} className={`rounded-2xl border transition-all duration-200 overflow-hidden
                  ${isToday ? 'border-iara-600/50 bg-iara-900/20' : 'border-iara-900/30 bg-[#13131f]'}`}
                >
                  {/* Cabeçalho do dia */}
                  <div className={`px-2 py-2 text-center border-b border-iara-900/20
                    ${isToday ? 'bg-iara-600/20' : ''}`}
                  >
                    <p className="text-[10px] text-[#5a5a7a] uppercase tracking-wider">{DIAS_PT[idx]}</p>
                    <p className={`text-sm font-bold mt-0.5 ${isToday ? 'text-iara-300' : isPast ? 'text-[#5a5a7a]' : 'text-[#f1f1f8]'}`}>
                      {day.getDate()}
                    </p>
                  </div>

                  {/* Itens do dia */}
                  <div className="p-1.5 space-y-1 min-h-[80px]">
                    {loading ? (
                      <div className="flex justify-center pt-4">
                        <Loader2 className="w-3 h-3 text-iara-600 animate-spin" />
                      </div>
                    ) : (
                      dayItems.map(item => {
                        const tipo = getTipoInfo(item.tipo_conteudo)
                        const isConcluindo = concluindo === item.id
                        return (
                          <div
                            key={item.id}
                            className={`rounded-lg border text-[10px] p-1.5 transition-all duration-200 group relative
                              ${item.concluido
                                ? 'opacity-50 bg-green-900/10 border-green-800/20'
                                : tipo.color}`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span>{tipo.icon}</span>
                              <button
                                onClick={() => deletarItem(item.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-[#5a5a7a] hover:text-red-400"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <p className="text-[10px] leading-tight mt-0.5 font-medium line-clamp-2">
                              {item.titulo}
                            </p>
                            {item.meta && (
                              <div className="flex items-center gap-0.5 mt-1">
                                <Target className="w-2 h-2 text-yellow-400 flex-shrink-0" />
                                <span className="text-[9px] text-yellow-400 truncate">{item.meta.titulo}</span>
                              </div>
                            )}
                            {!item.concluido && (
                              <button
                                onClick={() => concluirItem(item.id)}
                                disabled={isConcluindo}
                                className="mt-1.5 w-full flex items-center justify-center gap-1 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors text-[9px] font-medium"
                              >
                                {isConcluindo
                                  ? <Loader2 className="w-2 h-2 animate-spin" />
                                  : <><Check className="w-2 h-2" /> Feito +{item.pontos}pts</>
                                }
                              </button>
                            )}
                            {item.concluido && (
                              <div className="mt-1 flex items-center gap-0.5 text-green-400">
                                <Check className="w-2.5 h-2.5" />
                                <span className="text-[9px]">Concluído</span>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}

                    {/* Form inline */}
                    {isFormOpen ? (
                      <div className="space-y-1">
                        <input
                          autoFocus
                          value={form.titulo}
                          onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') addItem(dateStr); if (e.key === 'Escape') setShowForm(null) }}
                          placeholder="O que vai postar?"
                          className="w-full text-[10px] px-1.5 py-1 rounded bg-[#0f0f1e] border border-iara-700/40 text-[#f1f1f8] placeholder:text-[#5a5a7a] focus:outline-none focus:border-iara-500/60"
                        />
                        <select
                          value={form.tipo_conteudo}
                          onChange={e => setForm(p => ({ ...p, tipo_conteudo: e.target.value }))}
                          className="w-full text-[9px] px-1 py-1 rounded bg-[#0f0f1e] border border-iara-900/40 text-[#9b9bb5] focus:outline-none"
                        >
                          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                        </select>
                        {metas.length > 0 && (
                          <select
                            value={form.meta_id}
                            onChange={e => setForm(p => ({ ...p, meta_id: e.target.value }))}
                            className="w-full text-[9px] px-1 py-1 rounded bg-[#0f0f1e] border border-iara-900/40 text-[#9b9bb5] focus:outline-none"
                          >
                            <option value="">Sem meta vinculada</option>
                            {metas.map(m => (
                              <option key={m.id} value={m.id}>🎯 {m.titulo}</option>
                            ))}
                          </select>
                        )}
                        <div className="flex gap-1">
                          <button onClick={() => addItem(dateStr)} className="flex-1 py-1 rounded bg-iara-600/40 text-iara-300 text-[9px] hover:bg-iara-600/60 transition-colors">
                            ✓
                          </button>
                          <button onClick={() => setShowForm(null)} className="flex-1 py-1 rounded bg-[#1a1a2e] text-[#5a5a7a] text-[9px]">
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setShowForm(dateStr); setForm({ titulo: '', plataforma: '', tipo_conteudo: 'post', meta_id: '' }) }}
                        className="w-full py-1 rounded-lg border border-dashed border-iara-900/40 text-[#3a3a5a] hover:border-iara-700/40 hover:text-[#5a5a7a] transition-colors flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          </div>{/* end scroll wrapper */}

          {/* Legenda */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            {TIPOS.map(t => (
              <div key={t.value} className="flex items-center gap-1.5">
                <span className="text-xs">{t.icon}</span>
                <span className="text-[11px] text-[#5a5a7a]">{t.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-2">
              <Target className="w-3 h-3 text-yellow-400" />
              <span className="text-[11px] text-[#5a5a7a]">Vinculado a uma meta</span>
            </div>
          </div>
        </div>

        {/* Painel lateral — metas ativas */}
        <div className="lg:w-56 lg:flex-shrink-0 space-y-3">
          <p className="text-xs font-semibold text-[#9b9bb5] uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Metas ativas
          </p>

          {metas.length === 0 ? (
            <div className="iara-card p-4 text-center">
              <p className="text-xs text-[#5a5a7a]">Nenhuma meta ativa.</p>
              <a href="/dashboard/metas" className="text-xs text-iara-400 hover:text-iara-300 mt-1 block">
                Criar meta →
              </a>
            </div>
          ) : (
            metas.map(meta => {
              const progress = Math.round((meta.quantidade_atual / meta.quantidade_meta) * 100)
              const itensVinculados = items.filter(i => i.meta_id === meta.id)
              const concluidosVinculados = itensVinculados.filter(i => i.concluido).length
              return (
                <div key={meta.id} className="iara-card p-3">
                  <p className="text-xs font-medium text-[#f1f1f8] leading-tight mb-2">{meta.titulo}</p>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#5a5a7a]">{meta.quantidade_atual}/{meta.quantidade_meta}</span>
                    <span className="text-[10px] font-bold text-iara-400">{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-iara-600 to-accent-purple transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-yellow-400 font-medium flex items-center gap-0.5">
                      <Trophy className="w-2.5 h-2.5" />
                      +{meta.pontos_recompensa}pts
                    </span>
                    {itensVinculados.length > 0 && (
                      <span className="text-[#5a5a7a]">{concluidosVinculados}/{itensVinculados.length} no calendário</span>
                    )}
                  </div>
                </div>
              )
            })
          )}

          {/* Dica */}
          <div className="iara-card p-3 border-iara-900/20 mt-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3 h-3 text-iara-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#5a5a7a] leading-relaxed">
                Vincule um item do calendário a uma meta para que a conclusão registre progresso automaticamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
