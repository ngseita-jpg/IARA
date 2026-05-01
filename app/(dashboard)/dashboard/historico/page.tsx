'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  History, Search, FileText, Layers, Image,
  Smartphone, Mic, BookOpen, Lightbulb, Clock,
  Copy, Check, Trash2, Loader2, ChevronDown, ChevronUp,
  RotateCcw, Star, CopyPlus, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/lib/toast'

type HistItem = {
  id: string
  tipo: string
  titulo: string
  parametros: Record<string, unknown>
  conteudo: unknown
  favoritado?: boolean
  favoritado_em?: string | null
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

const TIPO_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string; rotaModulo: string }> = {
  roteiro:   { label: 'Roteiro',   icon: FileText,   color: 'text-iara-400',    bg: 'bg-iara-900/30',     border: 'border-iara-700/25',   rotaModulo: '/dashboard/roteiros' },
  carrossel: { label: 'Carrossel', icon: Layers,     color: 'text-accent-pink', bg: 'bg-pink-950/30',     border: 'border-pink-800/25',   rotaModulo: '/dashboard/carrossel' },
  thumbnail: { label: 'Thumbnail', icon: Image,      color: 'text-teal-400',    bg: 'bg-teal-950/30',     border: 'border-teal-800/25',   rotaModulo: '/dashboard/thumbnail' },
  stories:   { label: 'Stories',   icon: Smartphone, color: 'text-accent-purple', bg: 'bg-purple-950/30', border: 'border-purple-800/25', rotaModulo: '/dashboard/stories' },
  temas:     { label: 'Faísca Criativa', icon: Lightbulb, color: 'text-iara-300', bg: 'bg-iara-900/40', border: 'border-iara-600/30',     rotaModulo: '/dashboard/temas' },
  midia_kit: { label: 'Mídia Kit', icon: BookOpen,   color: 'text-amber-400',   bg: 'bg-amber-950/30',   border: 'border-amber-800/25',   rotaModulo: '/dashboard/midia-kit' },
  oratorio:  { label: 'Oratória',  icon: Mic,        color: 'text-green-400',   bg: 'bg-green-950/30',   border: 'border-green-800/25',   rotaModulo: '/dashboard/oratorio' },
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

function HistoricoCard({
  item,
  onDelete,
  onUpdate,
}: {
  item: HistItem
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: Partial<HistItem>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [duplicando, setDuplicando] = useState(false)
  const [togglingFav, setTogglingFav] = useState(false)
  const meta = TIPO_META[item.tipo] ?? TIPO_META['roteiro']
  const Icon = meta.icon
  const preview = extractText(item.conteudo)

  function copy() {
    navigator.clipboard.writeText(preview)
    setCopied(true)
    toast.success('Conteúdo copiado')
    setTimeout(() => setCopied(false), 2000)
  }

  async function del() {
    if (!confirm('Apagar esse item do histórico? Não dá pra desfazer.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/historico?id=${item.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onDelete(item.id)
      toast.success('Item removido')
    } catch {
      toast.error('Erro ao apagar. Tenta de novo.')
      setDeleting(false)
    }
  }

  async function duplicar(e: React.MouseEvent) {
    e.stopPropagation()
    setDuplicando(true)
    try {
      const res = await fetch(`/api/historico/duplicar?id=${item.id}`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Cópia criada — recarregando lista')
      // Pequeno delay pra DB confirmar antes de recarregar
      setTimeout(() => window.location.reload(), 300)
    } catch {
      toast.error('Erro ao duplicar')
      setDuplicando(false)
    }
  }

  async function toggleFav(e: React.MouseEvent) {
    e.stopPropagation()
    setTogglingFav(true)
    const novo = !item.favoritado
    // Optimistic
    onUpdate(item.id, { favoritado: novo, favoritado_em: novo ? new Date().toISOString() : null })
    try {
      const res = await fetch(`/api/historico?id=${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favoritado: novo }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Rollback
      onUpdate(item.id, { favoritado: !novo })
      toast.error('Erro ao favoritar')
    } finally {
      setTogglingFav(false)
    }
  }

  return (
    <div className={`rounded-2xl border ${item.favoritado ? 'border-amber-700/40 bg-amber-950/[0.04]' : `${meta.border} bg-[#0f0f1e]`} overflow-hidden hover:border-opacity-50 transition-all duration-200`}>
      <div className="flex items-stretch">
        {/* Botão favoritar — separado do toggle expand */}
        <button
          onClick={toggleFav}
          disabled={togglingFav}
          aria-label={item.favoritado ? 'Desfavoritar' : 'Favoritar'}
          className={`flex-shrink-0 w-11 flex items-center justify-center transition-all ${
            item.favoritado ? 'text-amber-400 hover:text-amber-300' : 'text-[#3a3a5a] hover:text-amber-400'
          }`}
        >
          <Star className={`w-4 h-4 ${item.favoritado ? 'fill-amber-400' : ''}`} />
        </button>

        {/* Toggle expand */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex-1 flex items-start gap-3 p-4 pl-1 text-left hover:bg-white/[0.02] transition-colors min-w-0"
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
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#1a1a2e]">
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

          <div className="rounded-xl bg-[#0a0a14] border border-[#1a1a2e] p-3 mb-3 max-h-60 overflow-y-auto">
            <pre className="text-xs text-[#9b9bb5] whitespace-pre-wrap leading-relaxed font-sans">
              {preview}{preview.length >= 300 ? '...' : ''}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copy}
              className="flex items-center gap-1.5 px-3 min-h-9 rounded-lg text-xs font-medium border border-[#1a1a2e] text-[#6b6b8a] hover:border-iara-700/40 hover:text-iara-400 transition-all"
            >
              {copied
                ? <><Check className="w-3 h-3 text-green-400" /> Copiado</>
                : <><Copy className="w-3 h-3" /> Copiar</>}
            </button>
            <button
              onClick={duplicar}
              disabled={duplicando}
              className="flex items-center gap-1.5 px-3 min-h-9 rounded-lg text-xs font-medium border border-[#1a1a2e] text-[#6b6b8a] hover:border-iara-700/40 hover:text-iara-400 transition-all disabled:opacity-40"
            >
              {duplicando
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <><CopyPlus className="w-3 h-3" /> Duplicar</>}
            </button>
            <Link
              href={meta.rotaModulo}
              className="flex items-center gap-1.5 px-3 min-h-9 rounded-lg text-xs font-medium border border-iara-700/40 text-iara-300 hover:bg-iara-900/30 transition-all"
            >
              <ArrowRight className="w-3 h-3" /> Ir pro módulo
            </Link>
            <button
              onClick={del}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 min-h-9 rounded-lg text-xs font-medium border border-[#1a1a2e] text-[#6b6b8a] hover:border-red-800/40 hover:text-red-400 transition-all disabled:opacity-40 ml-auto"
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
  const [apenasFavoritos, setApenasFavoritos] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchItems = useCallback(async (b: string) => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (tipo) params.set('tipo', tipo)
    if (b && b.length >= 2) params.set('q', b)
    if (apenasFavoritos) params.set('favoritos', '1')
    const res = await fetch(`/api/historico?${params}`)
    if (res.ok) {
      const data = await res.json()
      setItems(data.items ?? [])
    }
    setLoading(false)
  }, [tipo, apenasFavoritos])

  // Debounce busca (300ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchItems(busca), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [busca, fetchItems])

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function handleUpdate(id: string, patch: Partial<HistItem>) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }

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
          Todo o conteúdo que você gerou. Favoritos sobem pro topo.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3a3a5a]" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar pelo título..."
            className="w-full rounded-xl border border-[#1a1a2e] bg-[#0f0f1e] px-4 py-2.5 pl-11 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-700/50 focus:outline-none transition-all"
          />
        </div>

        <button
          onClick={() => setApenasFavoritos(v => !v)}
          aria-pressed={apenasFavoritos}
          className={`flex items-center gap-2 px-4 min-h-11 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
            apenasFavoritos
              ? 'bg-amber-950/40 border border-amber-700/40 text-amber-300'
              : 'border border-[#1a1a2e] text-[#6b6b8a] hover:border-amber-800/40 hover:text-amber-400'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${apenasFavoritos ? 'fill-amber-400' : ''}`} />
          Favoritos
        </button>

        <button
          onClick={() => fetchItems(busca)}
          className="flex items-center justify-center gap-2 px-4 min-h-11 rounded-xl border border-[#1a1a2e] text-sm text-[#6b6b8a] hover:text-[#f1f1f8] hover:border-iara-700/40 transition-all"
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
              className={`flex items-center gap-1.5 px-3 min-h-9 rounded-xl text-xs font-medium border flex-none transition-all ${
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
          {items.length} {items.length === 1 ? 'item' : 'itens'}
          {busca && ` para "${busca}"`}
          {tipo && ` · ${TIPO_META[tipo]?.label ?? tipo}`}
          {apenasFavoritos && ' · só favoritos'}
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-iara-400 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0f0f1e] border border-[#1a1a2e] flex items-center justify-center">
            <History className="w-7 h-7 text-[#2a2a3a]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#9b9bb5] mb-1">
              {busca
                ? 'Nenhum resultado para essa busca'
                : apenasFavoritos
                  ? 'Você ainda não favoritou nada'
                  : 'Nenhum conteúdo gerado ainda'}
            </p>
            <p className="text-xs text-[#5a5a7a] max-w-sm">
              {busca
                ? 'Tente outros termos'
                : apenasFavoritos
                  ? 'Toque na ⭐ de qualquer item pra favoritar — facilita reusar depois'
                  : 'Use os módulos abaixo e seu histórico aparece aqui automaticamente'}
            </p>
          </div>
          {!busca && !apenasFavoritos && (
            <div className="flex flex-wrap gap-2 mt-2 justify-center max-w-md">
              {TIPOS.slice(1, 6).map(t => {
                const Icon = t.icon
                const meta = TIPO_META[t.value]
                if (!meta) return null
                return (
                  <Link
                    key={t.value}
                    href={meta.rotaModulo}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${meta.border} ${meta.bg} ${meta.color} hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </Link>
                )
              })}
            </div>
          )}
          {(busca || apenasFavoritos) && (
            <button
              onClick={() => { setBusca(''); setApenasFavoritos(false) }}
              className="text-xs text-iara-400 hover:text-iara-300 transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <HistoricoCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
