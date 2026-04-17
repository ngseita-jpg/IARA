'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, Plus, Edit3, Trash2, Sparkles, Users, Eye,
  Heart, MessageCircle, Share2, Bookmark, BarChart2,
  RefreshCw, ChevronDown, ChevronUp, X, Check,
} from 'lucide-react'
import { getPlatformIcon } from '@/components/platform-icons'
import { SocialConnect } from '@/components/social-connect'

// ─── tipos ───────────────────────────────────────────────────────────────────

interface MetricaRede {
  id: string
  plataforma: string
  seguidores: number
  alcance_mensal: number
  impressoes_mensais: number
  curtidas_mensais: number
  comentarios_mensais: number
  compartilhamentos_mensais: number
  salvamentos_mensais: number
  visualizacoes_mensais: number
  posts_mensais: number
  taxa_engajamento: number | null
  updated_at: string
}

interface Profile {
  nicho?: string
  tom_de_voz?: string
  nome_artistico?: string
  objetivo?: string
  voz_perfil?: string
  sobre?: string
}

// ─── constantes ──────────────────────────────────────────────────────────────

const PLATAFORMAS = [
  { value: 'instagram', label: 'Instagram', color: '#E1306C', bg: 'bg-pink-900/20', border: 'border-pink-800/30', text: 'text-pink-400' },
  { value: 'youtube',   label: 'YouTube',   color: '#FF0000', bg: 'bg-red-900/20',  border: 'border-red-800/30',  text: 'text-red-400'  },
  { value: 'tiktok',    label: 'TikTok',    color: '#69C9D0', bg: 'bg-cyan-900/20', border: 'border-cyan-800/30', text: 'text-cyan-400' },
  { value: 'linkedin',  label: 'LinkedIn',  color: '#0077B5', bg: 'bg-blue-900/20', border: 'border-blue-800/30', text: 'text-blue-400' },
  { value: 'twitter',   label: 'Twitter/X', color: '#1DA1F2', bg: 'bg-sky-900/20',  border: 'border-sky-800/30',  text: 'text-sky-400'  },
]

function getPlatInfo(value: string) {
  return PLATAFORMAS.find((p) => p.value === value) ?? {
    value, label: value, color: '#9b9bb5', bg: 'bg-iara-900/20',
    border: 'border-iara-700/30', text: 'text-iara-400',
  }
}

const EMPTY_FORM = {
  plataforma: 'instagram',
  seguidores: '',
  alcance_mensal: '',
  impressoes_mensais: '',
  curtidas_mensais: '',
  comentarios_mensais: '',
  compartilhamentos_mensais: '',
  salvamentos_mensais: '',
  visualizacoes_mensais: '',
  posts_mensais: '',
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null || n === 0) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('pt-BR')
}

function parseAnalise(text: string) {
  const sections: { tag: string; title: string; content: string }[] = []
  const tags = ['PANORAMA', 'INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'LINKEDIN', 'TWITTER', 'FOCO_AGORA']
  const titles: Record<string, string> = {
    PANORAMA: 'Panorama Geral',
    INSTAGRAM: 'Instagram',
    YOUTUBE: 'YouTube',
    TIKTOK: 'TikTok',
    LINKEDIN: 'LinkedIn',
    TWITTER: 'Twitter/X',
    FOCO_AGORA: 'Foco dos próximos 30 dias',
  }

  let remaining = text
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]
    const startMarker = `[${tag}]`
    const startIdx = remaining.indexOf(startMarker)
    if (startIdx === -1) continue

    const afterStart = remaining.slice(startIdx + startMarker.length)
    // find next tag
    let endIdx = afterStart.length
    for (let j = i + 1; j < tags.length; j++) {
      const nextMarker = `[${tags[j]}]`
      const idx = afterStart.indexOf(nextMarker)
      if (idx !== -1 && idx < endIdx) endIdx = idx
    }

    const content = afterStart.slice(0, endIdx).trim()
    if (content) sections.push({ tag, title: titles[tag], content })
  }
  return sections
}

// ─── componente de formulário ─────────────────────────────────────────────────

function MetricaForm({
  initial,
  onSave,
  onCancel,
  existingPlataformas,
}: {
  initial?: Partial<MetricaRede> & { plataforma?: string }
  onSave: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  existingPlataformas: string[]
}) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    plataforma: initial?.plataforma ?? 'instagram',
    seguidores: initial?.seguidores?.toString() ?? '',
    alcance_mensal: initial?.alcance_mensal?.toString() ?? '',
    impressoes_mensais: initial?.impressoes_mensais?.toString() ?? '',
    curtidas_mensais: initial?.curtidas_mensais?.toString() ?? '',
    comentarios_mensais: initial?.comentarios_mensais?.toString() ?? '',
    compartilhamentos_mensais: initial?.compartilhamentos_mensais?.toString() ?? '',
    salvamentos_mensais: initial?.salvamentos_mensais?.toString() ?? '',
    visualizacoes_mensais: initial?.visualizacoes_mensais?.toString() ?? '',
    posts_mensais: initial?.posts_mensais?.toString() ?? '',
  })
  const [saving, setSaving] = useState(false)

  const availablePlats = isEdit
    ? PLATAFORMAS
    : PLATAFORMAS.filter((p) => !existingPlataformas.includes(p.value) || p.value === form.plataforma)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      plataforma: form.plataforma,
      seguidores: parseInt(form.seguidores) || 0,
      alcance_mensal: parseInt(form.alcance_mensal) || 0,
      impressoes_mensais: parseInt(form.impressoes_mensais) || 0,
      curtidas_mensais: parseInt(form.curtidas_mensais) || 0,
      comentarios_mensais: parseInt(form.comentarios_mensais) || 0,
      compartilhamentos_mensais: parseInt(form.compartilhamentos_mensais) || 0,
      salvamentos_mensais: parseInt(form.salvamentos_mensais) || 0,
      visualizacoes_mensais: parseInt(form.visualizacoes_mensais) || 0,
      posts_mensais: parseInt(form.posts_mensais) || 0,
    })
    setSaving(false)
  }

  const platInfo = getPlatInfo(form.plataforma)
  const isYouTube = form.plataforma === 'youtube'
  const isTikTok = form.plataforma === 'tiktok'
  const isInstagram = form.plataforma === 'instagram'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!isEdit && (
        <div>
          <label className="block text-xs font-medium text-[#9b9bb5] mb-2">Plataforma</label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {availablePlats.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, plataforma: p.value }))}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                  form.plataforma === p.value
                    ? `${p.bg} ${p.border} ${p.text}`
                    : 'bg-[#0a0a14] border-[#1a1a2e] text-[#5a5a7a] hover:border-[#2a2a4a]'
                }`}
              >
                {getPlatformIcon(p.value, 22)}
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#9b9bb5] mb-1.5">Seguidores / Inscritos</label>
          <input
            type="number" min="0"
            value={form.seguidores}
            onChange={(e) => setForm((f) => ({ ...f, seguidores: e.target.value }))}
            placeholder="ex: 45000"
            className="iara-input w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#9b9bb5] mb-1.5">Posts no mês</label>
          <input
            type="number" min="0"
            value={form.posts_mensais}
            onChange={(e) => setForm((f) => ({ ...f, posts_mensais: e.target.value }))}
            placeholder="ex: 20"
            className="iara-input w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#9b9bb5] mb-1.5">
            {isYouTube ? 'Visualizações mensais' : isTikTok ? 'Visualizações mensais' : 'Alcance mensal'}
          </label>
          <input
            type="number" min="0"
            value={isYouTube || isTikTok ? form.visualizacoes_mensais : form.alcance_mensal}
            onChange={(e) => setForm((f) => isYouTube || isTikTok
              ? { ...f, visualizacoes_mensais: e.target.value }
              : { ...f, alcance_mensal: e.target.value }
            )}
            placeholder="ex: 150000"
            className="iara-input w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#9b9bb5] mb-1.5">Impressões mensais</label>
          <input
            type="number" min="0"
            value={form.impressoes_mensais}
            onChange={(e) => setForm((f) => ({ ...f, impressoes_mensais: e.target.value }))}
            placeholder="ex: 200000"
            className="iara-input w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#9b9bb5] mb-1.5">Curtidas mensais</label>
          <input
            type="number" min="0"
            value={form.curtidas_mensais}
            onChange={(e) => setForm((f) => ({ ...f, curtidas_mensais: e.target.value }))}
            placeholder="ex: 8000"
            className="iara-input w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#9b9bb5] mb-1.5">Comentários mensais</label>
          <input
            type="number" min="0"
            value={form.comentarios_mensais}
            onChange={(e) => setForm((f) => ({ ...f, comentarios_mensais: e.target.value }))}
            placeholder="ex: 400"
            className="iara-input w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#9b9bb5] mb-1.5">
            {isInstagram ? 'Salvamentos mensais' : 'Compartilhamentos mensais'}
          </label>
          <input
            type="number" min="0"
            value={isInstagram ? form.salvamentos_mensais : form.compartilhamentos_mensais}
            onChange={(e) => setForm((f) => isInstagram
              ? { ...f, salvamentos_mensais: e.target.value }
              : { ...f, compartilhamentos_mensais: e.target.value }
            )}
            placeholder="ex: 1200"
            className="iara-input w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#9b9bb5] mb-1.5">Compartilhamentos</label>
          <input
            type="number" min="0"
            value={form.compartilhamentos_mensais}
            onChange={(e) => setForm((f) => ({ ...f, compartilhamentos_mensais: e.target.value }))}
            placeholder="ex: 600"
            className="iara-input w-full"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="iara-btn-primary flex-1">
          {saving ? 'Salvando…' : isEdit ? 'Atualizar métricas' : `Adicionar ${platInfo.label}`}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-[#1a1a2e] text-[#9b9bb5] hover:bg-[#1a1a2e] transition-colors text-sm">
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─── card de rede ─────────────────────────────────────────────────────────────

function RedeCard({
  m,
  onEdit,
  onDelete,
}: {
  m: MetricaRede
  onEdit: () => void
  onDelete: () => void
}) {
  const plat = getPlatInfo(m.plataforma)
  const isYouTube = m.plataforma === 'youtube'
  const isTikTok = m.plataforma === 'tiktok'
  const alcanceOuViews = isYouTube || isTikTok ? m.visualizacoes_mensais : m.alcance_mensal
  const interacoes = (m.curtidas_mensais ?? 0) + (m.comentarios_mensais ?? 0)
    + (m.compartilhamentos_mensais ?? 0) + (m.salvamentos_mensais ?? 0)

  return (
    <div className={`iara-card p-5 border ${plat.border} ${plat.bg} relative group`}>
      {/* header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {getPlatformIcon(m.plataforma, 28)}
          <div>
            <p className={`font-semibold text-sm ${plat.text}`}>{plat.label}</p>
            <p className="text-xs text-[#5a5a7a]">
              Atualizado {new Date(m.updated_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex gap-1 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-[#1a1a2e] text-[#5a5a7a] hover:text-[#9b9bb5]">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-900/30 text-[#5a5a7a] hover:text-red-400">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* métricas principais */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0a0a14]/60 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3 h-3 text-[#5a5a7a]" />
            <span className="text-xs text-[#5a5a7a]">Seguidores</span>
          </div>
          <p className={`text-xl font-bold ${plat.text}`}>{fmt(m.seguidores)}</p>
        </div>
        <div className="bg-[#0a0a14]/60 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Eye className="w-3 h-3 text-[#5a5a7a]" />
            <span className="text-xs text-[#5a5a7a]">{isYouTube || isTikTok ? 'Views' : 'Alcance'}</span>
          </div>
          <p className={`text-xl font-bold ${plat.text}`}>{fmt(alcanceOuViews)}</p>
        </div>
        <div className="bg-[#0a0a14]/60 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Heart className="w-3 h-3 text-[#5a5a7a]" />
            <span className="text-xs text-[#5a5a7a]">Interações</span>
          </div>
          <p className={`text-xl font-bold ${plat.text}`}>{fmt(interacoes)}</p>
        </div>
        <div className="bg-[#0a0a14]/60 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart2 className="w-3 h-3 text-[#5a5a7a]" />
            <span className="text-xs text-[#5a5a7a]">Engajamento</span>
          </div>
          <p className={`text-xl font-bold ${plat.text}`}>
            {m.taxa_engajamento != null ? `${m.taxa_engajamento}%` : '—'}
          </p>
        </div>
      </div>

      {/* mini stats row */}
      <div className="flex items-center gap-3 mt-3 text-xs text-[#5a5a7a]">
        {m.curtidas_mensais > 0 && (
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{fmt(m.curtidas_mensais)}</span>
        )}
        {m.comentarios_mensais > 0 && (
          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{fmt(m.comentarios_mensais)}</span>
        )}
        {m.compartilhamentos_mensais > 0 && (
          <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{fmt(m.compartilhamentos_mensais)}</span>
        )}
        {m.salvamentos_mensais > 0 && (
          <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" />{fmt(m.salvamentos_mensais)}</span>
        )}
        {m.posts_mensais > 0 && (
          <span className="ml-auto">{m.posts_mensais} posts</span>
        )}
      </div>
    </div>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function MetricasPage() {
  const [metricas, setMetricas] = useState<MetricaRede[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [ultimaAnalise, setUltimaAnalise] = useState<{ analise: string; created_at: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<MetricaRede | null>(null)

  const [analiseTexto, setAnaliseTexto] = useState<string | null>(null)
  const [analisando, setAnalisando] = useState(false)
  const [analiseExpandida, setAnaliseExpandida] = useState(true)

  const [toast, setToast] = useState<{ msg: string; tipo?: 'sucesso' | 'erro' } | null>(null)
  const [connections, setConnections] = useState<{ platform: string; platform_username: string | null; connected_at: string; token_expires_at: string | null }[]>([])

  function showToast(msg: string, tipo: 'sucesso' | 'erro' = 'sucesso') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3500)
  }

  async function fetchConnections() {
    const res = await fetch('/api/metricas/sync')
    if (res.ok) {
      const d = await res.json()
      setConnections(d.connections ?? [])
    }
  }

  async function handleSync(platform: string) {
    const res = await fetch('/api/metricas/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    })
    if (res.ok) {
      await fetchData()
      showToast(`Métricas do ${platform} atualizadas!`)
    } else {
      showToast('Erro ao sincronizar', 'erro')
    }
  }

  async function handleDisconnect(platform: string) {
    await fetch('/api/oauth/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    })
    await fetchConnections()
    showToast('Conta desconectada')
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/metricas')
    if (res.ok) {
      const d = await res.json()
      setMetricas(d.metricas ?? [])
      setProfile(d.profile ?? null)
      if (d.ultimaAnalise) {
        setUltimaAnalise(d.ultimaAnalise)
        setAnaliseTexto(d.ultimaAnalise.analise)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData(); fetchConnections() }, [fetchData])

  async function handleSave(data: Record<string, unknown>) {
    const res = await fetch('/api/metricas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      await fetchData()
      setShowForm(false)
      setEditTarget(null)
      showToast('Métricas salvas!')
    } else {
      showToast('Erro ao salvar métricas', 'erro')
    }
  }

  async function handleDelete(plataforma: string) {
    if (!confirm(`Remover dados do ${getPlatInfo(plataforma).label}?`)) return
    await fetch(`/api/metricas?plataforma=${plataforma}`, { method: 'DELETE' })
    await fetchData()
    showToast('Rede removida')
  }

  async function handleAnalisar() {
    if (metricas.length === 0) return
    setAnalisando(true)
    setAnaliseExpandida(true)
    const res = await fetch('/api/metricas/analisar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metricas, profile }),
    })
    if (res.ok) {
      const d = await res.json()
      setAnaliseTexto(d.analise)
      setUltimaAnalise({ analise: d.analise, created_at: new Date().toISOString() })
      showToast('Análise gerada com IA!')
    } else {
      showToast('Erro ao gerar análise', 'erro')
    }
    setAnalisando(false)
  }

  // ─── totais combinados ──────────────────────────────────────────────────────

  const totais = metricas.reduce(
    (acc, m) => ({
      seguidores: acc.seguidores + (m.seguidores ?? 0),
      alcance: acc.alcance + (m.alcance_mensal ?? 0) + (m.visualizacoes_mensais ?? 0),
      interacoes: acc.interacoes + (m.curtidas_mensais ?? 0) + (m.comentarios_mensais ?? 0)
        + (m.compartilhamentos_mensais ?? 0) + (m.salvamentos_mensais ?? 0),
      posts: acc.posts + (m.posts_mensais ?? 0),
    }),
    { seguidores: 0, alcance: 0, interacoes: 0, posts: 0 }
  )

  const metricasComEng = metricas.filter((m) => m.taxa_engajamento != null)
  const engMedio = metricasComEng.length > 0
    ? metricasComEng.reduce((s, m) => s + (m.taxa_engajamento ?? 0), 0) / metricasComEng.length
    : 0

  const sections = analiseTexto ? parseAnalise(analiseTexto) : []
  const sectionColors: Record<string, string> = {
    PANORAMA: 'text-iara-400',
    INSTAGRAM: 'text-pink-400',
    YOUTUBE: 'text-red-400',
    TIKTOK: 'text-cyan-400',
    LINKEDIN: 'text-blue-400',
    TWITTER: 'text-sky-400',
    FOCO_AGORA: 'text-yellow-400',
  }

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl flex items-center gap-2 ${
          toast.tipo === 'erro' ? 'bg-red-900/90 text-red-200' : 'bg-iara-900/90 text-iara-200 border border-iara-700/40'
        }`}>
          {toast.tipo === 'erro' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-iara-400 text-sm font-medium mb-2">
          <TrendingUp className="w-4 h-4" />
          <span>Análise de desempenho</span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#f1f1f8]">
              Métricas das <span className="iara-gradient-text">Redes</span>
            </h1>
            <p className="mt-1 text-[#9b9bb5] text-sm">
              Adicione suas métricas mensais e receba análise estratégica personalizada.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {metricas.length > 0 && (
              <button
                onClick={handleAnalisar}
                disabled={analisando}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-iara-600 to-accent-purple text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {analisando
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analisando…</>
                  : <><Sparkles className="w-4 h-4" /> Analisar com IA</>
                }
              </button>
            )}
            {!showForm && !editTarget && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-iara-700/40 text-iara-400 text-sm font-medium hover:bg-iara-900/30 transition-colors"
              >
                <Plus className="w-4 h-4" /> Adicionar rede
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contas conectadas */}
      <SocialConnect
        connections={connections}
        onSync={handleSync}
        onDisconnect={handleDisconnect}
      />

      {/* Formulário (nova rede) */}
      {showForm && !editTarget && (
        <div className="iara-card p-6 mb-8">
          <h2 className="text-sm font-semibold text-[#f1f1f8] mb-5">Adicionar rede social</h2>
          <MetricaForm
            existingPlataformas={metricas.map((m) => m.plataforma)}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Formulário (edição) */}
      {editTarget && (
        <div className="iara-card p-6 mb-8">
          <h2 className="text-sm font-semibold text-[#f1f1f8] mb-5">
            Editar métricas — {getPlatInfo(editTarget.plataforma).label}
          </h2>
          <MetricaForm
            initial={editTarget}
            existingPlataformas={metricas.map((m) => m.plataforma)}
            onSave={handleSave}
            onCancel={() => setEditTarget(null)}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-[#5a5a7a]">Carregando métricas…</div>
      ) : metricas.length === 0 && !showForm ? (
        /* Estado vazio */
        <div className="iara-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-iara-900/50 border border-iara-700/30 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-7 h-7 text-iara-400" />
          </div>
          <h3 className="text-lg font-semibold text-[#f1f1f8] mb-2">Nenhuma rede adicionada</h3>
          <p className="text-sm text-[#9b9bb5] max-w-sm mx-auto mb-6">
            Adicione suas métricas mensais de cada plataforma e receba análise estratégica personalizada para crescer.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="iara-btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Adicionar primeira rede
          </button>
        </div>
      ) : (
        <>
          {/* Totais combinados */}
          {metricas.length > 1 && (
            <div className="mb-8">
              <h2 className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-wider mb-3">
                Totais combinados — todas as redes
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Seguidores totais', value: fmt(totais.seguidores), icon: Users },
                  { label: 'Alcance + Views', value: fmt(totais.alcance), icon: Eye },
                  { label: 'Interações totais', value: fmt(totais.interacoes), icon: Heart },
                  {
                    label: 'Eng. médio',
                    value: metricas.filter((m) => m.taxa_engajamento != null).length > 0
                      ? `${engMedio.toFixed(2)}%`
                      : '—',
                    icon: BarChart2,
                  },
                ].map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.label} className="iara-card px-4 py-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-iara-900/50 border border-iara-700/30 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-iara-400" />
                      </div>
                      <div>
                        <p className="text-lg font-bold iara-gradient-text">{stat.value}</p>
                        <p className="text-xs text-[#5a5a7a]">{stat.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Grid de redes */}
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-wider mb-3">
              Por plataforma
            </h2>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {metricas.map((m) => (
                <RedeCard
                  key={m.plataforma}
                  m={m}
                  onEdit={() => { setEditTarget(m); setShowForm(false) }}
                  onDelete={() => handleDelete(m.plataforma)}
                />
              ))}
              {/* Botão add mais redes */}
              {metricas.length < PLATAFORMAS.length && !showForm && !editTarget && (
                <button
                  onClick={() => setShowForm(true)}
                  className="iara-card p-5 border border-dashed border-[#1a1a2e] hover:border-iara-700/40 flex flex-col items-center justify-center gap-2 text-[#5a5a7a] hover:text-iara-400 transition-colors min-h-[180px]"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-sm font-medium">Adicionar rede</span>
                </button>
              )}
            </div>
          </div>

          {/* Análise de IA */}
          {(analiseTexto || analisando) && (
            <div className="iara-card overflow-hidden">
              <div
                className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a2e] cursor-pointer"
                onClick={() => setAnaliseExpandida((v) => !v)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-iara-600/30 to-accent-purple/20 border border-iara-700/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-iara-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#f1f1f8]">Análise estratégica com IA</p>
                    {ultimaAnalise && (
                      <p className="text-xs text-[#5a5a7a]">
                        Gerada em {new Date(ultimaAnalise.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAnalisar() }}
                    disabled={analisando}
                    className="text-xs text-[#5a5a7a] hover:text-iara-400 flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${analisando ? 'animate-spin' : ''}`} />
                    {analisando ? 'Analisando…' : 'Atualizar'}
                  </button>
                  {analiseExpandida ? <ChevronUp className="w-4 h-4 text-[#5a5a7a]" /> : <ChevronDown className="w-4 h-4 text-[#5a5a7a]" />}
                </div>
              </div>

              {analiseExpandida && (
                <div className="px-6 py-5 space-y-6">
                  {analisando && !analiseTexto && (
                    <div className="flex items-center gap-3 text-[#9b9bb5] text-sm">
                      <RefreshCw className="w-4 h-4 animate-spin text-iara-400" />
                      A Iara está analisando suas métricas…
                    </div>
                  )}
                  {sections.map((sec) => (
                    <div key={sec.tag}>
                      <h3 className={`text-sm font-bold mb-2 ${sectionColors[sec.tag] ?? 'text-iara-400'}`}>
                        {sec.tag === 'FOCO_AGORA' ? '🎯 ' : ''}{sec.title}
                      </h3>
                      <div className="text-sm text-[#c4c4d8] leading-relaxed whitespace-pre-wrap">
                        {sec.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CTA análise se ainda não gerou */}
          {!analiseTexto && !analisando && metricas.length > 0 && (
            <div className="iara-card p-8 text-center border border-dashed border-iara-700/30">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-iara-600/20 to-accent-purple/10 border border-iara-700/30 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-iara-400" />
              </div>
              <h3 className="text-base font-semibold text-[#f1f1f8] mb-1">Pronto para a análise</h3>
              <p className="text-sm text-[#9b9bb5] mb-4 max-w-sm mx-auto">
                A Iara vai analisar suas métricas e gerar dicas estratégicas personalizadas para o seu perfil e nicho.
              </p>
              <button
                onClick={handleAnalisar}
                className="iara-btn-primary inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Gerar análise agora
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
