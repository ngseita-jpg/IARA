'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Move, MousePointer2 } from 'lucide-react'
import type { ThumbnailLayout } from '@/app/api/thumbnail/gerar/route'
import { toast } from '@/lib/toast'

const ANCORAS_CONFIG: { id: ThumbnailLayout['texto_ancora']; row: 0|1|2; col: 0|1|2 }[] = [
  { id: 'topo_esq', row: 0, col: 0 }, { id: 'topo_centro', row: 0, col: 1 }, { id: 'topo_dir', row: 0, col: 2 },
  { id: 'meio_esq', row: 1, col: 0 }, { id: 'meio_centro', row: 1, col: 1 }, { id: 'meio_dir', row: 1, col: 2 },
  { id: 'base_esq', row: 2, col: 0 }, { id: 'base_centro', row: 2, col: 1 }, { id: 'base_dir', row: 2, col: 2 },
]

/**
 * Overlay opcional sobre o preview da thumbnail.
 * Quando ativado, mostra zonas das 9 âncoras (3×3 grid) e permite arrastar
 * o bloco de texto pra outra zona — snap automático na âncora mais próxima.
 *
 * Pra evitar reescrever todo o renderer (que usa âncoras discretas, não x/y livres),
 * o drag-and-drop apenas decide qual das 9 âncoras é a mais próxima do drop point.
 */
export function ThumbnailDragOverlay({
  ativo,
  ancoraAtual,
  onAncoraMudar,
  disabled,
}: {
  ativo: boolean
  ancoraAtual: ThumbnailLayout['texto_ancora']
  onAncoraMudar: (nova: ThumbnailLayout['texto_ancora']) => void
  disabled?: boolean
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [arrastando, setArrastando] = useState(false)
  const [zonaHover, setZonaHover] = useState<ThumbnailLayout['texto_ancora'] | null>(null)
  const arrastandoRef = useRef(false)

  const calcZona = useCallback((clientX: number, clientY: number): ThumbnailLayout['texto_ancora'] | null => {
    const el = overlayRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const xRel = (clientX - rect.left) / rect.width
    const yRel = (clientY - rect.top)  / rect.height

    if (xRel < 0 || xRel > 1 || yRel < 0 || yRel > 1) return null

    const row = (yRel < 0.33 ? 0 : yRel < 0.66 ? 1 : 2) as 0|1|2
    const col = (xRel < 0.33 ? 0 : xRel < 0.66 ? 1 : 2) as 0|1|2
    return ANCORAS_CONFIG.find(a => a.row === row && a.col === col)?.id ?? null
  }, [])

  const finalizar = useCallback((clientX: number, clientY: number) => {
    const zona = calcZona(clientX, clientY)
    if (zona && zona !== ancoraAtual) {
      onAncoraMudar(zona)
      toast.success(`Texto movido pra: ${zona.replace('_', ' ')}`)
    }
    arrastandoRef.current = false
    setArrastando(false)
    setZonaHover(null)
  }, [ancoraAtual, calcZona, onAncoraMudar])

  // Mouse drag (desktop)
  useEffect(() => {
    if (!ativo) return
    function onMove(e: MouseEvent) {
      if (!arrastandoRef.current) return
      setZonaHover(calcZona(e.clientX, e.clientY))
    }
    function onUp(e: MouseEvent) {
      if (!arrastandoRef.current) return
      finalizar(e.clientX, e.clientY)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [ativo, calcZona, finalizar])

  // Touch drag (mobile)
  useEffect(() => {
    if (!ativo) return
    function onMove(e: TouchEvent) {
      if (!arrastandoRef.current) return
      e.preventDefault()
      const t = e.touches[0]
      if (t) setZonaHover(calcZona(t.clientX, t.clientY))
    }
    function onEnd(e: TouchEvent) {
      if (!arrastandoRef.current) return
      const t = e.changedTouches[0]
      if (t) finalizar(t.clientX, t.clientY)
    }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [ativo, calcZona, finalizar])

  if (!ativo) return null

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-10 cursor-move touch-none select-none"
      onMouseDown={(e) => {
        if (disabled) return
        arrastandoRef.current = true
        setArrastando(true)
        setZonaHover(calcZona(e.clientX, e.clientY))
      }}
      onTouchStart={(e) => {
        if (disabled) return
        arrastandoRef.current = true
        setArrastando(true)
        const t = e.touches[0]
        if (t) setZonaHover(calcZona(t.clientX, t.clientY))
      }}
    >
      {/* Grid 3×3 visual com destaque da âncora atual e zona hover */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
        {ANCORAS_CONFIG.map(a => {
          const ehAtual = a.id === ancoraAtual
          const ehHover = a.id === zonaHover && arrastando
          return (
            <div
              key={a.id}
              className={`border border-dashed transition-all ${
                ehHover ? 'border-iara-400 bg-iara-500/30' :
                ehAtual ? 'border-iara-500/60 bg-iara-500/10' :
                'border-white/15'
              }`}
            />
          )
        })}
      </div>

      {/* Hint de instruções */}
      {!arrastando && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/80 text-white text-[10px] font-semibold backdrop-blur-sm flex items-center gap-1.5 pointer-events-none">
          <MousePointer2 className="w-3 h-3" />
          Toque e arraste pra mover o bloco de texto
        </div>
      )}

      {arrastando && zonaHover && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-iara-600 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm flex items-center gap-1.5 pointer-events-none">
          <Move className="w-3 h-3" />
          {zonaHover.replace('_', ' ')}
        </div>
      )}
    </div>
  )
}
