'use client'

import { useState, useEffect } from 'react'
import { Images, X, Check, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type Foto = {
  id: string
  nome: string
  signed_url: string | null
  tamanho_kb: number
}

interface Props {
  multiple?: boolean
  maxSelect?: number
  onConfirm: (dataUrls: string[]) => void
  onClose: () => void
}

export function BancoFotosPicker({ multiple = false, maxSelect = 8, onConfirm, onClose }: Props) {
  const [fotos, setFotos] = useState<Foto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [convertendo, setConvertendo] = useState(false)

  useEffect(() => {
    fetch('/api/fotos')
      .then(r => r.json())
      .then(d => setFotos(d.photos ?? []))
      .catch(() => setErro('Erro ao carregar fotos'))
      .finally(() => setCarregando(false))
  }, [])

  function toggle(id: string) {
    setSelecionadas(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (!multiple) next.clear()
        if (next.size < maxSelect) next.add(id)
      }
      return next
    })
  }

  async function urlToDataUrl(url: string): Promise<string> {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  async function handleConfirm() {
    const selected = fotos.filter(f => selecionadas.has(f.id) && f.signed_url)
    if (!selected.length) return
    setConvertendo(true)
    try {
      const dataUrls = await Promise.all(selected.map(f => urlToDataUrl(f.signed_url!)))
      onConfirm(dataUrls)
    } catch {
      setErro('Erro ao carregar imagens. Tente novamente.')
    } finally {
      setConvertendo(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-[#0d0d1a] border border-[#1e1e3a] rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e3a]">
          <div className="flex items-center gap-2">
            <Images className="w-5 h-5 text-iara-400" />
            <h2 className="text-base font-semibold text-[#f1f1f8]">Banco de Fotos</h2>
            {multiple && (
              <span className="text-xs text-[#6b6b8a]">
                — selecione até {maxSelect} {selecionadas.size > 0 && `(${selecionadas.size} selecionada${selecionadas.size > 1 ? 's' : ''})`}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#6b6b8a] hover:text-[#f1f1f8] hover:bg-[#1a1a2e] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {carregando ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-iara-400 animate-spin" />
            </div>
          ) : erro ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-900/20 border border-red-700/30 text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{erro}</span>
            </div>
          ) : fotos.length === 0 ? (
            <div className="text-center py-16">
              <Images className="w-12 h-12 mx-auto mb-3 text-[#2a2a4a]" />
              <p className="text-sm text-[#6b6b8a] mb-4">Seu banco está vazio.</p>
              <Link
                href="/dashboard/fotos"
                onClick={onClose}
                className="text-sm text-iara-400 hover:text-iara-300 underline underline-offset-2"
              >
                Adicionar fotos ao banco →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {fotos.map(foto => {
                const sel = selecionadas.has(foto.id)
                return (
                  <button
                    key={foto.id}
                    onClick={() => toggle(foto.id)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      sel
                        ? 'border-iara-500 ring-2 ring-iara-500/30'
                        : 'border-[#1e1e3a] hover:border-iara-700'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={foto.signed_url ?? ''}
                      alt={foto.nome}
                      className="w-full h-full object-cover"
                    />
                    {sel && (
                      <div className="absolute inset-0 bg-iara-600/30 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-iara-500 flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {fotos.length > 0 && (
          <div className="px-6 py-4 border-t border-[#1e1e3a] flex items-center justify-between gap-3">
            <Link
              href="/dashboard/fotos"
              onClick={onClose}
              className="text-xs text-[#6b6b8a] hover:text-iara-400 transition-colors"
            >
              Gerenciar banco →
            </Link>
            <button
              onClick={handleConfirm}
              disabled={selecionadas.size === 0 || convertendo}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-iara-600 hover:bg-iara-500 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {convertendo
                ? <><Loader2 className="w-4 h-4 animate-spin" />Carregando...</>
                : <>Usar {selecionadas.size > 0 ? `${selecionadas.size} foto${selecionadas.size > 1 ? 's' : ''}` : 'foto'}</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
