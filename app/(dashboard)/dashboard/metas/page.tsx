'use client'

import { useState, useEffect } from 'react'
import {
  Target, Plus, Check, Trophy, Trash2,
  Loader2, Sparkles, Calendar, ChevronDown,
  Instagram, X,
} from 'lucide-react'

type Meta = {
  id: string
  titulo: string
  descricao?: string
  plataforma?: string
  meta_tipo: string
  quantidade_meta: number
  quantidade_atual: number
  data_limite?: string
  pontos_recompensa: number
  status: 'ativa' | 'concluida' | 'expirada'
  concluida_em?: string
  created_at: string
}

const PLATAFORMAS = ['Instagram', 'YouTube', 'TikTok', 'LinkedIn', 'Twitter/X', 'Kwai', 'Podcast', 'Qualquer']
const TIPOS = ['postagens', 'stories', 'reels', 'lives', 'vídeos', 'treinos de oratória', 'roteiros criados']

const PLATAFORMA_ICONES: Record<string, string> = {
  Instagram: '📸', YouTube: '▶️', TikTok: '🎵', LinkedIn: '💼',
  'Twitter/X': '𝕏', Kwai: '🎬', Podcast: '🎙️', Qualquer: '🌐',
}

function progressColor(p: number) {
  if (p >= 100) return 'bg-green-500'
  if (p >= 60)  return 'bg-iara-500'
  return 'bg-iara-700'
}

function diasRestantes(dataLimite: string): number {
  const diff = new Date(dataLimite).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function MetasPage() {
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [atualizando, setAtualizando] = useState<string | null>(null)
  const [pontosGanhos, setPontosGanhos] = useState<{ id: string; pts: number } | null>(null)

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    plataforma: '',
    meta_tipo: 'postagens',
    quantidade_meta: 3,
    data_limite: '',
  })

  useEffect(() => {
    fetch('/api/metas')
      .then((r) => r.json())
      .then(setMetas)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function criarMeta(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/metas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setMetas((prev) => [data, ...prev])
        setShowForm(false)
        setForm({ titulo: '', descricao: '', plataforma: '', meta_tipo: 'postagens', quantidade_meta: 3, data_limite: '' })
      }
    } finally {
      setSaving(false)
    }
  }

  async function registrarProgresso(id: string) {
    setAtualizando(id)
    try {
      const res = await fetch('/api/metas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'incrementar' }),
      })
      const data = await res.json()
      if (res.ok) {
        setMetas((prev) => prev.map((m) => m.id === id ? data.meta : m))
        if (data.meta_concluida && data.pontos_ganhos > 0) {
          setPontosGanhos({ id, pts: data.pontos_ganhos })
          setTimeout(() => setPontosGanhos(null), 3000)
        }
      }
    } finally {
      setAtualizando(null)
    }
  }

  async function deletarMeta(id: string) {
    await fetch(`/api/metas?id=${id}`, { method: 'DELETE' })
    setMetas((prev) => prev.filter((m) => m.id !== id))
  }

  const ativas = metas.filter((m) => m.status === 'ativa')
  const concluidas = metas.filter((m) => m.status === 'concluida')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 text-iara-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-iara-400 text-sm font-medium mb-2">
          <Target className="w-4 h-4" />
          <span>Módulo</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#f1f1f8]">
              Metas de <span className="iara-gradient-text">Postagem</span>
            </h1>
            <p className="mt-2 text-[#9b9bb5]">
              Organize sua agenda, bata metas e ganhe pontos que elevam seu nível de influenciador.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="iara-btn-primary flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nova meta
          </button>
        </div>
      </div>

      {/* Modal nova meta */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-[#0a0a14]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md iara-card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#f1f1f8]">Nova meta</h2>
              <button onClick={() => setShowForm(false)} className="text-[#5a5a7a] hover:text-[#f1f1f8]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={criarMeta} className="space-y-4">
              <div>
                <label className="iara-label">Título da meta <span className="text-red-500">*</span></label>
                <input
                  required
                  value={form.titulo}
                  onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                  placeholder="Ex: 3 Reels essa semana, 1 Live por mês..."
                  className="iara-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="iara-label">Tipo</label>
                  <div className="relative">
                    <select
                      value={form.meta_tipo}
                      onChange={(e) => setForm((p) => ({ ...p, meta_tipo: e.target.value }))}
                      className="iara-input appearance-none pr-8 cursor-pointer"
                    >
                      {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="iara-label">Quantidade</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.quantidade_meta}
                    onChange={(e) => setForm((p) => ({ ...p, quantidade_meta: parseInt(e.target.value) || 1 }))}
                    className="iara-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="iara-label">Plataforma</label>
                  <div className="relative">
                    <select
                      value={form.plataforma}
                      onChange={(e) => setForm((p) => ({ ...p, plataforma: e.target.value }))}
                      className="iara-input appearance-none pr-8 cursor-pointer"
                    >
                      <option value="">Qualquer</option>
                      {PLATAFORMAS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="iara-label">Prazo (opcional)</label>
                  <input
                    type="date"
                    value={form.data_limite}
                    onChange={(e) => setForm((p) => ({ ...p, data_limite: e.target.value }))}
                    className="iara-input"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="iara-btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="iara-btn-primary flex-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Criar meta</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Metas ativas */}
      <div className="space-y-4 mb-8">
        {ativas.length === 0 && (
          <div className="iara-card p-10 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#13131f] border border-iara-900/30 flex items-center justify-center">
              <Target className="w-6 h-6 text-[#3a3a5a]" />
            </div>
            <p className="text-sm text-[#5a5a7a]">
              Nenhuma meta ativa. Crie sua primeira meta e comece a ganhar pontos!
            </p>
            <button onClick={() => setShowForm(true)} className="iara-btn-primary mt-2">
              <Plus className="w-4 h-4" /> Criar meta
            </button>
          </div>
        )}

        {ativas.map((meta) => {
          const progress = Math.round((meta.quantidade_atual / meta.quantidade_meta) * 100)
          const dias = meta.data_limite ? diasRestantes(meta.data_limite) : null
          const isUpdating = atualizando === meta.id
          const justConcluded = pontosGanhos?.id === meta.id

          return (
            <div key={meta.id} className="iara-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg">{PLATAFORMA_ICONES[meta.plataforma ?? 'Qualquer'] ?? '🌐'}</span>
                  <div>
                    <p className="font-semibold text-[#f1f1f8] text-sm">{meta.titulo}</p>
                    <p className="text-xs text-[#5a5a7a] mt-0.5 capitalize">
                      {meta.quantidade_meta} {meta.meta_tipo}
                      {dias !== null && (
                        <span className={`ml-2 ${dias < 3 ? 'text-red-400' : dias < 7 ? 'text-yellow-400' : 'text-[#5a5a7a]'}`}>
                          • {dias > 0 ? `${dias}d restantes` : 'Prazo encerrado'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-yellow-400 font-medium px-2 py-1 rounded-lg bg-yellow-900/20 border border-yellow-800/30">
                    <Trophy className="w-3 h-3" />
                    +{meta.pontos_recompensa}pts
                  </span>
                  <button
                    onClick={() => deletarMeta(meta.id)}
                    className="text-[#3a3a5a] hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progresso */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#9b9bb5]">{meta.quantidade_atual} de {meta.quantidade_meta} {meta.meta_tipo}</span>
                  <span className="text-xs font-bold text-iara-400">{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1a1a2e] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor(progress)}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Pontos ganhos notif */}
              {justConcluded && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-green-900/20 border border-green-800/30 text-green-400 text-sm animate-fade-in">
                  <Sparkles className="w-4 h-4" />
                  Meta concluída! +{pontosGanhos.pts} pontos ganhos 🎉
                </div>
              )}

              <button
                onClick={() => registrarProgresso(meta.id)}
                disabled={isUpdating}
                className="iara-btn-secondary w-full py-2 text-sm"
              >
                {isUpdating
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><Check className="w-4 h-4" /> Registrar {meta.meta_tipo.replace(/s$/, '')}</>
                }
              </button>
            </div>
          )
        })}
      </div>

      {/* Metas concluídas */}
      {concluidas.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#5a5a7a] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Concluídas ({concluidas.length})
          </h2>
          <div className="space-y-2">
            {concluidas.map((meta) => (
              <div key={meta.id} className="iara-card p-4 opacity-60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#f1f1f8]">{meta.titulo}</p>
                    <p className="text-xs text-[#5a5a7a]">
                      {meta.quantidade_meta} {meta.meta_tipo} concluídas
                      {meta.concluida_em && ` · ${new Date(meta.concluida_em).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-green-400 font-medium">+{meta.pontos_recompensa}pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
