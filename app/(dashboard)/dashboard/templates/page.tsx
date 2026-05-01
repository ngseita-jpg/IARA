'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Save, FileText, Layers, Image, Smartphone, Lightbulb, BookOpen,
  Trash2, Loader2, Plus, Clock, Hash, Bookmark,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/lib/toast'

type Template = {
  id: string
  modulo: string
  nome: string
  descricao: string | null
  parametros: Record<string, unknown>
  uso_count: number
  ultimo_uso: string | null
  created_at: string
}

const MODULO_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; rota: string }> = {
  roteiro:   { label: 'Roteiro',    icon: FileText,   color: 'text-iara-400',     bg: 'bg-iara-900/30',    rota: '/dashboard/roteiros' },
  carrossel: { label: 'Carrossel',  icon: Layers,     color: 'text-accent-pink',  bg: 'bg-pink-950/30',    rota: '/dashboard/carrossel' },
  thumbnail: { label: 'Thumbnail',  icon: Image,      color: 'text-teal-400',     bg: 'bg-teal-950/30',    rota: '/dashboard/thumbnail' },
  stories:   { label: 'Stories',    icon: Smartphone, color: 'text-accent-purple', bg: 'bg-purple-950/30', rota: '/dashboard/stories' },
  temas:     { label: 'Faísca',     icon: Lightbulb,  color: 'text-iara-300',     bg: 'bg-iara-900/40',    rota: '/dashboard/temas' },
  midia_kit: { label: 'Mídia Kit',  icon: BookOpen,   color: 'text-amber-400',    bg: 'bg-amber-950/30',   rota: '/dashboard/midia-kit' },
}

function formatDate(iso: string | null) {
  if (!iso) return 'nunca usado'
  const d = new Date(iso)
  const diffH = (Date.now() - d.getTime()) / 3600000
  if (diffH < 1) return 'agora'
  if (diffH < 24) return `${Math.floor(diffH)}h atrás`
  if (diffH < 48) return 'ontem'
  return d.toLocaleDateString('pt-BR')
}

export default function TemplatesPage() {
  const [items, setItems] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroModulo, setFiltroModulo] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtroModulo) params.set('modulo', filtroModulo)
    const res = await fetch(`/api/templates?${params}`)
    if (res.ok) {
      const data = await res.json()
      setItems(data.items ?? [])
    }
    setLoading(false)
  }, [filtroModulo])

  useEffect(() => { carregar() }, [carregar])

  async function deletar(id: string) {
    if (!confirm('Apagar esse template?')) return
    const res = await fetch(`/api/templates?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems(prev => prev.filter(t => t.id !== id))
      toast.success('Template removido')
    } else {
      toast.error('Erro ao remover')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-iara-900/40 border border-iara-700/30 flex items-center justify-center">
            <Bookmark className="w-4 h-4 text-iara-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#f1f1f8]">Meus Templates</h1>
        </div>
        <p className="text-sm text-[#6b6b8a]">
          Configurações salvas pra reusar — quando achar uma combinação que funciona, salva como template e aplica nos próximos.
        </p>
      </div>

      {/* Filtros por módulo */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-6 -mx-1 px-1">
        <button
          onClick={() => setFiltroModulo('')}
          className={`flex items-center gap-1.5 px-3 min-h-9 rounded-xl text-xs font-medium border flex-none transition-all ${
            !filtroModulo
              ? 'bg-iara-900/40 border-iara-700/50 text-iara-300'
              : 'border-[#1a1a2e] text-[#6b6b8a] hover:text-[#9b9bb5]'
          }`}
        >
          <Hash className="w-3.5 h-3.5" /> Tudo
        </button>
        {Object.entries(MODULO_META).map(([key, meta]) => {
          const Icon = meta.icon
          const active = filtroModulo === key
          return (
            <button
              key={key}
              onClick={() => setFiltroModulo(key)}
              className={`flex items-center gap-1.5 px-3 min-h-9 rounded-xl text-xs font-medium border flex-none transition-all ${
                active
                  ? 'bg-iara-900/40 border-iara-700/50 text-iara-300'
                  : 'border-[#1a1a2e] text-[#6b6b8a] hover:text-[#9b9bb5]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-iara-400' : meta.color}`} />
              {meta.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-iara-400 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0f0f1e] border border-[#1a1a2e] flex items-center justify-center">
            <Save className="w-7 h-7 text-[#3a3a5a]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#9b9bb5] mb-1">Você ainda não tem templates</p>
            <p className="text-xs text-[#5a5a7a] max-w-md">
              Quando estiver gerando conteúdo num módulo (roteiro, carrossel, etc), procure o botão{' '}
              <span className="text-iara-400">&ldquo;Salvar como template&rdquo;</span> pra guardar a configuração e reusar depois.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 justify-center max-w-md">
            {Object.values(MODULO_META).slice(0, 4).map(m => {
              const Icon = m.icon
              return (
                <Link
                  key={m.rota}
                  href={m.rota}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${m.bg} border-[#1a1a2e] ${m.color} hover:scale-105 transition-transform`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {m.label}
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map(t => {
            const meta = MODULO_META[t.modulo]
            if (!meta) return null
            const Icon = meta.icon
            return (
              <div
                key={t.id}
                className="rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] p-4 hover:border-iara-700/40 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl ${meta.bg} border border-[#1a1a2e] flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>
                      {meta.label}
                    </p>
                    <p className="text-sm font-bold text-white truncate">{t.nome}</p>
                  </div>
                </div>
                {t.descricao && (
                  <p className="text-xs text-[#9b9bb5] mb-3 leading-relaxed line-clamp-2">{t.descricao}</p>
                )}
                <div className="flex items-center justify-between text-[10px] text-[#5a5a7a] mb-3 pt-3 border-t border-[#1a1a2e]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(t.ultimo_uso)}
                  </span>
                  <span>{t.uso_count} {t.uso_count === 1 ? 'uso' : 'usos'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`${meta.rota}?template=${t.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 min-h-9 rounded-lg bg-iara-900/30 border border-iara-700/30 text-iara-300 text-xs font-medium hover:bg-iara-900/50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Usar
                  </Link>
                  <button
                    onClick={() => deletar(t.id)}
                    aria-label="Apagar template"
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#1a1a2e] text-[#5a5a7a] hover:border-red-800/40 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
