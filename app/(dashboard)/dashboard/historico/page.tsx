'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  History, Search, Filter, FileText, Layers, Image,
  Smartphone, Mic, BookOpen, Lightbulb, Clock,
  Copy, Check, Trash2, Loader2, ChevronDown, ChevronUp,
  RotateCcw,
} from 'lucide-react'

type HistItem = {
  id: string
  tipo: string
  titulo: string
  parametros: Record<string, unknown>
  conteudo: unknown
  created_at: string
}

const TIPOS: { value: string; label: string; icon: React.ElementType; color: string }[] = [
  { value: '',          label: 'Tudo',        icon: History,    color: 'text-[#9b9bb5]' },
  { value: 'roteiro',   label: 'Roteiros',    icon: FileText,   color: 'text-iara-400' },
  { value: 'carrossel', label: 'Carrossel',   icon: Layers,     color: 'text-accent-pink' },
  { value: 'thumbnail', label: 'Thumbnail',   icon: Image,      color: 'text-teal-400' },
  { value: 'stories',   label: 'Stories',     icon: Smartphone, color: 'text-accent-purple' },
  { value: 'temas',     label: 'Faísca',      icon: Lightbulb,  color: 'text-iara-300' },
  { value: 'midia_kit', label: 'Mídia Kit',   icon: BookOpen,   color: 'text-amber-400' },
  { value: 'oratorio',  label: 'Oratória',    icon: Mic,        color: 'text-green-400' },
]

const TIPO_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  roteiro:   { label: 'Roteiro',   icon: FileText,   color: 'text-iara-400',    bg: 'bg-iara-900/30',     border: 'border-iara-700/25' },
  carrossel: { label: 'Carrossel', icon: Layers,     color: 'text-accent-pink', bg: 'bg-pink-950/30',     border: 'border-pink-800/25' },
  thumbnail: { label: 'Thumbnail', icon: Image,      color: 'text-teal-400',    bg: 'bg-teal-950/30',     border: 'border-teal-800/25' },
  stories:   { label: 'Stories',   icon: Smartphone, color: 'text-accent-purple', bg: 'bg-purple-950/30', border: 'border-purple-800/25' },
  temas:     { label: 'Faísca Criativa', icon: Lightbulb, color: 'text-iara-300', bg: 'bg-iara-900/40', border: 'border-iara-600/30' },
  midia_kit: { label: 'Mídia Kit', icon: BookOpen,   color: 'text-amber-400',   bg: 'bg-amber-950/30',   border: 'border-amber-800/25' },
  oratorio:  { label: 'Oratória',  icon: Mic,        color: 'text-green-400',   bg: 'bg-green-950/30',   border: 'border-green-800/25' },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = diffMs / 3600000
  if (diffH < 1) return 'Agora há pouco'
  if (diffH < 24) return `${Math.floor(diffH)}h atrás`
  if (diffH < 48) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function extractText(conteudo: unknown): string {
  if (typeof conteudo === 'string') return conteudo.slice(0, 300)
  if (typeof conteudo === 'object' && conteudo !== null) return JSON.stringify(conteudo).slice(0, 300)
  return ''
}

function HistoricoCard({ item, onDelete }: { item: HistItem; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const meta = TIPO_META[item.tipo] ?? TIPO_META['roteiro']
  const Icon = meta.icon
  const preview = extractText(item.conteudo)

  function copy() {
    navigator.clipboard.writeText(preview)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function del() {
    setDeleting(true)
    await fetch(`/api/historico?id=${item.id}`, { method: 'DELETE' })
    onDelete(item.id)
  }

  return (
    <div className={`rounded-2xl border ${meta.border} bg-[#0f0f1e] overflow-hidden hover:border-opacity-50 transition-all duration-200`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className={`w-8 h-8 rounded-xl ${meta.bg} border ${meta.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Icon className={`w-4 h-4 ${meta.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
            <span className="text-[10px] text-[#3a3a5a]">·</span>
            <span className="flex items-center gap-1 text-[10px] text-[#4a4a6a]">
              <Clock className="w-3 h-3" />
              {formatDate(item.created_at)}
            </span>
          </div>
          <p className="text-sm font-semibold text-[#f1f1f8] truncate">{item.titulo}</p>
          {!expanded && (
            <p className="text-xs text-[#5a5a7a] mt-1 leading-relaxed line-clamp-2">{preview}</p>
          )}
        </div>
        <div className="flex-shrink-0 mt-1">
          {expanded
            ? <ChevronUp className="w-4 h-4 text-[#3a3a5a]" />
            : <ChevronDown className="w-4 h-4 text-[#3a3a5a]" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#1a1a2e]">
          {/* Params chips */}
          {item.parametros && Object.keys(item.parametros).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-3 mb-3">
              {Object.entries(item.parametros).slice(0, 5).map(([k, v]) =>
                v ? (
                  <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a2e] text-[#6b6b8a] border border-[#2a2a3e]">
                    {String(v).slice(0, 30)}
                  </span>
                ) : null
              )}
            </div>
          )}

          {/* Content preview */}
          <div className="rounded-xl bg-[#0a0a14] border border-[#1a1a2e] p-3 mb-3 max-h-60 overflow-y-auto">
            <pre className="text-xs text-[#9b9bb5] whitespace-pre-wrap leading-relaxed font-sans">
              {preview}{preview.length >= 300 ? '...' : ''}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={copy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#1a1a2e] text-[#6b6b8a] hover:border-iara-700/40 hover:text-iara-400 transition-all"
            >
              {copied
                ? <><Check className="w-3 h-3 text-green-400" /> Copiado</>
                : <><Copy className="w-3 h-3" /> Copiar</>}
            </button>
            <button
              onClick={del}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#1a1a2e] text-[#6b6b8a] hover:border-red-800/40 hover:text-red-400 transition-all disabled:opacity-40"
            >
              {deleting
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <><Trash2 className="w-3 h-3" /> Apagar</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HistoricoPage() {
  const [items, setItems] = useState<HistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tipo, setTipo] = useState('')
  const [busca, setBusca] = useState('')

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (tipo) params.set('tipo', tipo)
    const res = await fetch(`/api/historico?${params}`)
    if (res.ok) {
      const data = await res.json()
      setItems(data.items ?? [])
    }
    setLoading(false)
  }, [tipo])

  useEffect(() => { fetchItems() }, [fetchItems])

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const filtered = busca
    ? items.filter(i => i.titulo.toLowerCase().includes(busca.toLowerCase()))
    : items

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-iara-900/40 border border-iara-700/30 flex items-center justify-center">
            <History className="w-4 h-4 text-iara-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#f1f1f8]">Histórico</h1>
        </div>
        <p className="text-sm text-[#6b6b8a]">
          Todo o conteúdo que você gerou, salvo automaticamente.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3a3a5a]" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar no histórico..."
            className="w-full rounded-xl border border-[#1a1a2e] bg-[#0f0f1e] px-4 py-2.5 pl-11 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-700/50 focus:outline-none transition-all"
          />
        </div>

        {/* Refresh */}
        <button
          onClick={fetchItems}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1a1a2e] text-sm text-[#6b6b8a] hover:text-[#f1f1f8] hover:border-iara-700/40 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      {/* Type filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-5 -mx-1 px-1">
        {TIPOS.map(t => {
          const Icon = t.icon
          const active = tipo === t.value
          return (
            <button
              key={t.value}
              onClick={() => setTipo(t.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border flex-none transition-all ${
                active
                  ? 'bg-iara-900/40 border-iara-700/50 text-iara-300'
                  : 'border-[#1a1a2e] text-[#6b6b8a] hover:border-iara-900/50 hover:text-[#9b9bb5]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-iara-400' : t.color}`} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-[#4a4a6a] mb-4">
          {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
          {busca && ` para "${busca}"`}
          {tipo && ` · ${TIPO_META[tipo]?.label ?? tipo}`}
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-iara-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0f0f1e] border border-[#1a1a2e] flex items-center justify-center">
            <History className="w-7 h-7 text-[#2a2a3a]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#4a4a6a] mb-1">
              {busca ? 'Nenhum resultado para essa busca' : 'Nenhum conteúdo gerado ainda'}
            </p>
            <p className="text-xs text-[#3a3a5a]">
              {busca ? 'Tente outros termos' : 'Use os módulos e seu histórico aparece aqui'}
            </p>
          </div>
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="text-xs text-iara-400 hover:text-iara-300 transition-colors"
            >
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <HistoricoCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
