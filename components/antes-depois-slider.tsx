'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

/**
 * Slider antes/depois com clip-path (igual sites de reforma).
 * Touch + mouse + drag pelo handle central.
 * Desabilita scroll-y do parent enquanto arrasta no mobile.
 */
export function AntesDepoisSlider({
  antesPng,
  depoisPng,
  alt = 'Comparação antes e depois',
}: {
  antesPng: string
  depoisPng: string
  alt?: string
}) {
  const [pct, setPct] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const arrastandoRef = useRef(false)

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left
    const novo = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setPct(novo)
  }, [])

  // Desktop drag
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!arrastandoRef.current) return
      updateFromClientX(e.clientX)
    }
    function onUp() { arrastandoRef.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [updateFromClientX])

  // Touch drag (mobile)
  useEffect(() => {
    function onTouchMove(e: TouchEvent) {
      if (!arrastandoRef.current) return
      e.preventDefault()  // bloqueia scroll-y do parent
      const t = e.touches[0]
      if (t) updateFromClientX(t.clientX)
    }
    function onTouchEnd() { arrastandoRef.current = false }
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [updateFromClientX])

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#1a1a2e] select-none touch-none"
        onMouseDown={(e) => { arrastandoRef.current = true; updateFromClientX(e.clientX) }}
        onTouchStart={(e) => { arrastandoRef.current = true; const t = e.touches[0]; if (t) updateFromClientX(t.clientX) }}
      >
        {/* Depois (full bg) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={depoisPng} alt={alt} className="absolute inset-0 w-full h-full object-cover" draggable={false} />

        {/* Antes (overlay com clip-path baseado em pct) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `polygon(0 0, ${pct}% 0, ${pct}% 100%, 0 100%)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={antesPng} alt={alt + ' — antes'} className="w-full h-full object-cover" draggable={false} />
        </div>

        {/* Labels */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 text-white text-[11px] font-bold tracking-wider uppercase backdrop-blur-sm">
          Antes
        </div>
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-iara-600/90 text-white text-[11px] font-bold tracking-wider uppercase backdrop-blur-sm">
          Depois
        </div>

        {/* Linha divisória + handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)] pointer-events-none"
          style={{ left: `calc(${pct}% - 2px)` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border-2 border-iara-500 shadow-2xl flex items-center justify-center cursor-ew-resize active:scale-110 transition-transform"
          style={{ left: `calc(${pct}% - 22px)` }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-iara-600">
            <path d="M9 6L3 12L9 18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 6L21 12L15 18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <p className="text-center text-[10px] text-[#5a5a7a] mt-2">
        Arraste pra comparar · {Math.round(pct)}% antes / {Math.round(100 - pct)}% depois
      </p>
    </div>
  )
}
