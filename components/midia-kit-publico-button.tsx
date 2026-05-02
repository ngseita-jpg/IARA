'use client'

import { useState, useEffect } from 'react'
import { Globe, X, Loader2, Check, Copy, ExternalLink } from 'lucide-react'
import { toast } from '@/lib/toast'
import { useModalA11y } from '@/hooks/useModalA11y'

/**
 * Botão "Link público" do mídia kit.
 * Abre modal pra escolher handle (uma vez) + ativar/desativar visibilidade pública.
 *
 * Backend: /api/midia-kit/publico
 * URL pública gerada: https://iarahubapp.com.br/m/[handle]
 */
export function MidiaKitPublicoButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-iara-700/40 text-iara-300 text-sm font-semibold hover:bg-iara-900/30 transition-all"
      >
        <Globe className="w-4 h-4" />
        Link público
      </button>

      {open && <Modal onClose={() => setOpen(false)} />}
    </>
  )
}

function Modal({ onClose }: { onClose: () => void }) {
  const [handle, setHandle] = useState('')
  const [publico, setPublico] = useState(false)
  const [handleSalvo, setHandleSalvo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useModalA11y(true, onClose)

  useEffect(() => {
    fetch('/api/midia-kit/publico')
      .then(r => r.json())
      .then(data => {
        if (data.handle) {
          setHandle(data.handle)
          setHandleSalvo(data.handle)
        }
        setPublico(!!data.publico)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function salvar() {
    setErro(null)
    const handleLimpo = handle.toLowerCase().trim()
    if (handleLimpo && !/^[a-z0-9][a-z0-9_-]{2,29}$/.test(handleLimpo)) {
      setErro('Use 3-30 caracteres: letras, números, _ ou -. Começa com letra ou número.')
      return
    }
    setSalvando(true)
    try {
      const res = await fetch('/api/midia-kit/publico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: handleLimpo || null, publico }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao salvar')
        setSalvando(false)
        return
      }
      setHandleSalvo(handleLimpo || null)
      toast.success(publico ? 'Mídia kit publicado' : 'Configuração salva')
    } catch {
      setErro('Erro de conexão')
    } finally {
      setSalvando(false)
    }
  }

  function copiar() {
    if (!handleSalvo) return
    const url = `https://iarahubapp.com.br/m/${handleSalvo}`
    navigator.clipboard.writeText(url)
    setCopiado(true)
    toast.success('Link copiado')
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full sm:max-w-md max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-iara-700/30 bg-[#0e0e1e] shadow-2xl p-6">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-xl text-[#6b6b8a] hover:text-white hover:bg-[#1a1a2e]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-iara-900/30 border border-iara-700/40 flex items-center justify-center">
            <Globe className="w-5 h-5 text-iara-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Mídia Kit público</h2>
            <p className="text-xs text-[#6b6b8a]">Link compartilhável que marcas podem ver</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-iara-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#6b6b8a] mb-1.5">
                Seu handle (URL)
              </label>
              <div className="flex items-stretch gap-0">
                <span className="px-3 inline-flex items-center rounded-l-xl border border-r-0 border-[#1a1a2e] bg-[#0a0a14] text-[#6b6b8a] text-xs font-mono">
                  iarahubapp.com.br/m/
                </span>
                <input
                  type="text"
                  value={handle}
                  onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30))}
                  placeholder="seu-nome"
                  autoFocus={!handleSalvo}
                  className="flex-1 rounded-r-xl border border-[#1a1a2e] bg-[#0a0a14] px-3 py-3 text-sm text-white placeholder:text-[#3a3a5a] focus:border-iara-700/60 focus:outline-none font-mono"
                />
              </div>
              <p className="text-[10px] text-[#5a5a7a] mt-1">
                3-30 caracteres: letras, números, _ ou -
              </p>
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl border border-[#1a1a2e] bg-[#0a0a14] cursor-pointer">
              <div className="flex-1 mr-3">
                <p className="text-sm font-semibold text-white">Tornar público</p>
                <p className="text-xs text-[#6b6b8a]">Qualquer um com o link consegue ver</p>
              </div>
              <input
                type="checkbox"
                checked={publico}
                onChange={e => setPublico(e.target.checked)}
                className="sr-only peer"
              />
              <span className="inline-block w-11 h-6 rounded-full bg-[#1a1a2e] peer-checked:bg-iara-600 relative transition-colors flex-shrink-0">
                <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </span>
            </label>

            {erro && (
              <div className="px-3 py-2 rounded-xl bg-red-900/20 border border-red-800/40 text-red-300 text-xs">
                ⚠ {erro}
              </div>
            )}

            {handleSalvo && publico && (
              <div className="p-3 rounded-xl border border-iara-700/30 bg-iara-900/15">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-iara-400 mb-2">Seu link público</p>
                <div className="flex items-stretch gap-2">
                  <code className="flex-1 px-3 py-2 rounded-lg bg-[#08080f] border border-[#1a1a2e] text-xs text-white font-mono truncate">
                    iarahubapp.com.br/m/{handleSalvo}
                  </code>
                  <button
                    onClick={copiar}
                    aria-label="Copiar link"
                    className="w-11 flex items-center justify-center rounded-lg border border-iara-700/40 text-iara-300 hover:bg-iara-900/30"
                  >
                    {copiado ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`/m/${handleSalvo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Abrir link"
                    className="w-11 flex items-center justify-center rounded-lg border border-iara-700/40 text-iara-300 hover:bg-iara-900/30"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onClose}
                disabled={salvando}
                className="flex-1 min-h-11 rounded-xl border border-[#1a1a2e] text-sm text-[#9b9bb5] hover:bg-[#1a1a2e] disabled:opacity-50"
              >
                Fechar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="flex-1 min-h-11 rounded-xl bg-gradient-to-r from-iara-600 to-accent-purple text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
