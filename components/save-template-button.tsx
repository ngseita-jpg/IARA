'use client'

import { useState } from 'react'
import { Bookmark, Loader2, X, Check } from 'lucide-react'
import { toast } from '@/lib/toast'
import { useModalA11y } from '@/hooks/useModalA11y'

/**
 * Botão "Salvar como template" reutilizável.
 *
 * Uso:
 *   <SaveTemplateButton
 *     modulo="roteiro"
 *     parametros={{ formato, duracao, tema, ... }}
 *     defaultNome="Reels educativo gastronomia"
 *   />
 *
 * Quando clicado, abre modal pra dar nome + descrição. Salva via /api/templates.
 */
export function SaveTemplateButton({
  modulo,
  parametros,
  defaultNome = '',
  variant = 'default',
  className = '',
}: {
  modulo: 'roteiro' | 'carrossel' | 'stories' | 'thumbnail' | 'temas' | 'midia_kit'
  parametros: Record<string, unknown>
  defaultNome?: string
  variant?: 'default' | 'subtle' | 'icon'
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Salvar como template"
        className={`
          ${variant === 'icon'
            ? 'w-11 h-11 flex items-center justify-center rounded-xl'
            : variant === 'subtle'
              ? 'flex items-center gap-1.5 px-3 min-h-9 rounded-lg text-xs font-medium border border-[#1a1a2e] text-[#6b6b8a] hover:border-amber-700/40 hover:text-amber-400'
              : 'flex items-center gap-2 px-4 min-h-11 rounded-xl text-sm font-semibold border border-amber-700/40 text-amber-300 hover:bg-amber-900/20'
          }
          ${className} transition-all
        `}
      >
        <Bookmark className={variant === 'icon' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        {variant !== 'icon' && <span>Salvar template</span>}
      </button>

      {open && (
        <SaveTemplateModal
          modulo={modulo}
          parametros={parametros}
          defaultNome={defaultNome}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function SaveTemplateModal({
  modulo, parametros, defaultNome, onClose,
}: {
  modulo: string
  parametros: Record<string, unknown>
  defaultNome: string
  onClose: () => void
}) {
  const [nome, setNome] = useState(defaultNome)
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useModalA11y(true, onClose)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (nome.trim().length < 3) {
      toast.error('Nome precisa ter pelo menos 3 caracteres')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modulo,
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          parametros,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao salvar template')
        setLoading(false)
        return
      }
      setSalvo(true)
      toast.success('Template salvo')
      setTimeout(() => onClose(), 1200)
    } catch {
      toast.error('Erro de conexão')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full sm:max-w-md max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-amber-700/30 bg-[#0e0e1e] shadow-2xl p-6">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-xl text-[#6b6b8a] hover:text-white hover:bg-[#1a1a2e]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-700/40 flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Salvar como template</h2>
            <p className="text-xs text-[#6b6b8a]">Reusa essa configuração depois</p>
          </div>
        </div>

        {salvo ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-900/30 border border-green-700/40 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">Template salvo!</p>
            <p className="text-xs text-[#6b6b8a]">Acesse em <strong className="text-amber-400">Meus Templates</strong>.</p>
          </div>
        ) : (
          <form onSubmit={salvar} className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#6b6b8a] mb-1.5">Nome *</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value.slice(0, 100))}
                required
                autoFocus
                placeholder="ex: Reels educativo p/ dentistas"
                className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-white placeholder:text-[#3a3a5a] focus:border-amber-700/60 focus:outline-none"
              />
              <p className="text-[10px] text-[#5a5a7a] mt-1">{nome.length}/100</p>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#6b6b8a] mb-1.5">Descrição (opcional)</label>
              <textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value.slice(0, 300))}
                rows={2}
                placeholder="O que esse template faz bem? Pra que tipo de conteúdo?"
                className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-white placeholder:text-[#3a3a5a] focus:border-amber-700/60 focus:outline-none resize-none"
              />
              <p className="text-[10px] text-[#5a5a7a] mt-1">{descricao.length}/300</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 min-h-11 rounded-xl border border-[#1a1a2e] text-sm text-[#9b9bb5] hover:bg-[#1a1a2e] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !nome.trim()}
                className="flex-1 min-h-11 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Bookmark className="w-4 h-4" /> Salvar</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
