'use client'

import { useState } from 'react'
import { Download, Loader2, ChevronDown, Check } from 'lucide-react'
import type { ThumbnailLayout } from '@/app/api/thumbnail/gerar/route'
import { useModalA11y } from '@/hooks/useModalA11y'
import { toast } from '@/lib/toast'

type Formato = 'youtube' | 'instagram_quadrado' | 'story'

const FORMATOS: { id: Formato; label: string; size: string; ratio: string; emoji: string; desc: string }[] = [
  { id: 'youtube',            label: 'YouTube',         size: '1280×720',  ratio: '16:9',  emoji: '▶️',  desc: 'Thumbnail padrão de vídeo' },
  { id: 'instagram_quadrado', label: 'Instagram Feed',  size: '1080×1080', ratio: '1:1',   emoji: '📱', desc: 'Capa de carrossel ou post' },
  { id: 'story',              label: 'Story / Reels',   size: '1080×1920', ratio: '9:16',  emoji: '📲', desc: 'Capa vertical pra stories' },
]

/**
 * Botão de export multi-formato.
 * Renderiza thumbnail em 3 tamanhos diferentes (servidor sempre re-renderiza).
 */
export function ThumbnailExportButton({
  layout,
  imagemBase64,
  tituloVideo,
  variant = 'default',
}: {
  layout: ThumbnailLayout
  imagemBase64: string | null
  tituloVideo: string
  variant?: 'default' | 'compact'
}) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className={
          variant === 'compact'
            ? 'flex items-center gap-2 px-4 min-h-11 rounded-xl bg-accent-purple hover:opacity-90 text-white font-medium text-sm transition-all'
            : 'flex-1 min-w-[180px] flex items-center justify-center gap-2 px-4 min-h-12 rounded-xl bg-gradient-to-r from-accent-purple to-iara-600 hover:opacity-90 text-white font-bold text-sm shadow-lg shadow-purple-900/30 transition-all'
        }
      >
        <Download className="w-4 h-4" />
        Baixar PNG
        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
      </button>

      {aberto && (
        <ExportModal
          layout={layout}
          imagemBase64={imagemBase64}
          tituloVideo={tituloVideo}
          onClose={() => setAberto(false)}
        />
      )}
    </>
  )
}

function ExportModal({
  layout, imagemBase64, tituloVideo, onClose,
}: {
  layout: ThumbnailLayout
  imagemBase64: string | null
  tituloVideo: string
  onClose: () => void
}) {
  const [exportando, setExportando] = useState<Formato | null>(null)
  const [feitos, setFeitos] = useState<Set<Formato>>(new Set())

  useModalA11y(true, onClose)

  async function exportar(formato: Formato) {
    setExportando(formato)
    try {
      const res = await fetch('/api/thumbnail/renderizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout, imagem_base64: imagemBase64, formato }),
      })
      if (!res.ok) throw new Error('Renderer falhou')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const sufixo = formato === 'youtube' ? '' : `-${formato}`
      const baseNome = tituloVideo.slice(0, 30).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '') || 'iara'
      a.download = `thumb-${baseNome}${sufixo}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 2000)

      setFeitos(prev => new Set(prev).add(formato))
      toast.success(`${FORMATOS.find(f => f.id === formato)?.label} baixado`)
    } catch {
      toast.error('Erro ao gerar — tenta de novo')
    } finally {
      setExportando(null)
    }
  }

  async function exportarTodos() {
    for (const f of FORMATOS) {
      await exportar(f.id)
      // Espaço entre downloads pra browser não bloquear
      await new Promise(r => setTimeout(r, 500))
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full sm:max-w-lg max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-iara-700/30 bg-[#0e0e1e] shadow-2xl p-6">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-xl text-[#6b6b8a] hover:text-white hover:bg-[#1a1a2e]"
        >
          <span className="text-2xl leading-none">×</span>
        </button>

        <div className="mb-5">
          <h2 className="text-base font-bold text-white mb-1">Exportar em qual formato?</h2>
          <p className="text-xs text-[#6b6b8a]">Cada formato é renderizado do zero pra qualidade máxima.</p>
        </div>

        <div className="space-y-2 mb-4">
          {FORMATOS.map(f => {
            const isExp = exportando === f.id
            const isDone = feitos.has(f.id)
            return (
              <button
                key={f.id}
                onClick={() => exportar(f.id)}
                disabled={!!exportando}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDone
                    ? 'border-green-700/40 bg-green-950/20'
                    : 'border-[#1a1a2e] bg-[#0a0a14] hover:border-iara-700/40 hover:bg-iara-900/15'
                }`}
              >
                <span className="text-2xl flex-shrink-0">{f.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{f.label}</p>
                  <p className="text-xs text-[#6b6b8a]">{f.desc}</p>
                  <p className="text-[10px] font-mono text-[#5a5a7a] mt-0.5">{f.size} · {f.ratio}</p>
                </div>
                <div className="flex-shrink-0">
                  {isExp
                    ? <Loader2 className="w-5 h-5 text-iara-400 animate-spin" />
                    : isDone
                      ? <Check className="w-5 h-5 text-green-400" />
                      : <Download className="w-4 h-4 text-[#6b6b8a]" />}
                </div>
              </button>
            )
          })}
        </div>

        <div className="pt-3 border-t border-[#1a1a2e]">
          <button
            onClick={exportarTodos}
            disabled={!!exportando}
            className="w-full min-h-11 rounded-xl bg-gradient-to-r from-iara-600 to-accent-purple text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {exportando
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Renderizando...</>
              : <><Download className="w-4 h-4" /> Baixar TODOS de uma vez</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
