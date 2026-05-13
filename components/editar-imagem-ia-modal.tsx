'use client'

import { useState } from 'react'
import { X, Sparkles, Loader2, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react'

interface Props {
  open: boolean
  imageDataUrl: string | null  // data:image/png;base64,... (foto atual)
  onClose: () => void
  onApply: (newDataUrl: string) => void
}

const SUGESTOES: Array<{ label: string; prompt: string; emoji: string }> = [
  { emoji: '✂️', label: 'Remover fundo', prompt: 'Remova completamente o fundo, deixe o assunto principal isolado em fundo branco sólido' },
  { emoji: '🎨', label: 'Estilo cartoon', prompt: 'Transforme em ilustração estilo cartoon vibrante e estilizada, mantendo as proporções' },
  { emoji: '⚫', label: 'Preto e branco', prompt: 'Converta para preto e branco de alta qualidade, com forte contraste e tons dramáticos' },
  { emoji: '🌫️', label: 'Desfocar fundo', prompt: 'Deixe o fundo bem desfocado (efeito bokeh profundo), mantendo o assunto principal nítido' },
  { emoji: '☀️', label: 'Mais iluminado', prompt: 'Deixe a imagem mais iluminada e vibrante, com cores mais saturadas e luz natural quente' },
  { emoji: '🏞️', label: 'Céu azul', prompt: 'Substitua o céu por um céu azul ensolarado com poucas nuvens fofas, manter resto da imagem igual' },
]

export function EditarImagemIAModal({ open, imageDataUrl, onClose, onApply }: Props) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<string | null>(null)

  if (!open || !imageDataUrl) return null

  async function editar(promptUsado: string) {
    if (!imageDataUrl) return
    setLoading(true)
    setErro(null)
    setResultado(null)
    try {
      // Converte data URL pra Blob pra mandar como FormData
      const respBlob = await fetch(imageDataUrl)
      const blob = await respBlob.blob()
      const fd = new FormData()
      fd.append('image', blob, 'input.png')
      fd.append('prompt', promptUsado)

      // Timeout client-side de 75s (gpt-image-1 pode demorar até 60s em medium)
      const ctrl = new AbortController()
      const tId = setTimeout(() => ctrl.abort(), 75_000)
      const res = await fetch('/api/imagem/editar', { method: 'POST', body: fd, signal: ctrl.signal })
      clearTimeout(tId)

      const ct = res.headers.get('content-type') ?? ''
      if (!ct.includes('application/json')) {
        if (res.status === 504 || res.status === 408) throw new Error('A IA demorou demais. Tenta um prompt mais simples.')
        if (res.status >= 500) throw new Error(`Servidor com problema (HTTP ${res.status})`)
        throw new Error(`Erro inesperado (HTTP ${res.status})`)
      }

      const data = await res.json()
      if (!res.ok) {
        console.error('[editar-imagem-ia] erro:', data)
        throw new Error(data.detalhe ? `${data.error} — ${data.detalhe}` : data.error)
      }
      setResultado(data.imageBase64)
    } catch (e) {
      console.error('[editar-imagem-ia] falhou:', e)
      const msg = e instanceof Error
        ? (e.name === 'AbortError' ? 'A IA demorou demais (>75s). Tenta de novo.' : e.message)
        : 'Erro inesperado'
      setErro(msg)
    } finally {
      setLoading(false)
    }
  }

  function aplicar() {
    if (!resultado) return
    onApply(resultado)
    resetar()
  }

  function resetar() {
    setPrompt('')
    setResultado(null)
    setErro(null)
    setLoading(false)
  }

  function fechar() {
    if (loading) return
    resetar()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={fechar}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0f0f1e] border border-iara-700/40 shadow-2xl shadow-iara-900/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[#1a1a2e] bg-[#0f0f1e]/95 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-iara-500 to-accent-pink flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#f1f1f8]">Editar com IA</h2>
              <p className="text-[10px] text-[#6b6b8a]">Descreva o que quer mudar — leva ~10-30s</p>
            </div>
          </div>
          <button
            onClick={fechar}
            disabled={loading}
            className="p-2 rounded-lg text-[#9b9bb5] hover:text-[#f1f1f8] hover:bg-white/5 disabled:opacity-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Preview antes / depois */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#6b6b8a] mb-2">Original</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageDataUrl} alt="Original" className="w-full aspect-square object-cover rounded-xl border border-[#1a1a2e]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-pink-300 mb-2">Editado</p>
              <div className="w-full aspect-square rounded-xl border border-iara-700/40 bg-[#08080f] flex items-center justify-center overflow-hidden relative">
                {loading && (
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-iara-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-[#9b9bb5]">IA pensando...</p>
                  </div>
                )}
                {!loading && resultado && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resultado} alt="Editado" className="w-full h-full object-cover" />
                )}
                {!loading && !resultado && !erro && (
                  <p className="text-xs text-[#5a5a7a] px-4 text-center">Preview vai aparecer aqui</p>
                )}
                {erro && (
                  <div className="text-center px-4">
                    <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-xs text-red-400 leading-snug">{erro}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sugestões rápidas */}
          {!resultado && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#6b6b8a] mb-2">Sugestões rápidas</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUGESTOES.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => { setPrompt(s.prompt); editar(s.prompt) }}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#0a0a14] border border-[#1a1a2e] hover:border-iara-600/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-left"
                  >
                    <span className="text-lg">{s.emoji}</span>
                    <span className="text-xs font-medium text-[#c1c1d8]">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prompt custom */}
          {!resultado && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-[#6b6b8a] mb-2">
                Ou escreva o que quer mudar
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Ex: "Coloque a pessoa de terno preto" · "Adicione neon roxo no fundo"'
                disabled={loading}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-[#1a1a2e] bg-[#0a0a14] text-sm text-[#f1f1f8] placeholder:text-[#5a5a7a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/20 transition-all resize-none"
              />
              <button
                onClick={() => editar(prompt)}
                disabled={loading || prompt.trim().length < 5}
                className="mt-3 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-iara-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01]"
                style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'IA processando...' : 'Editar foto'}
              </button>
            </div>
          )}

          {/* Ações após resultado */}
          {resultado && !loading && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setResultado(null); setErro(null); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-[#c1c1d8] border border-[#1a1a2e] bg-[#0f0f20] hover:border-iara-700/50 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar outro
              </button>
              <button
                onClick={aplicar}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-iara-900/40 transition-all hover:scale-[1.01]"
                style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }}
              >
                Aplicar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Footer info */}
          <p className="text-[10px] text-[#5a5a7a] text-center pt-2">
            Editor IA via GPT-Image. Resultados podem variar — se não gostou, tenta outro prompt ou clica em &ldquo;Tentar outro&rdquo;.
          </p>

        </div>
      </div>
    </div>
  )
}
