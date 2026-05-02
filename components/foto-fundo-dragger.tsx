'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

/**
 * Editor visual + sliders pra reposicionar a foto de fundo da thumbnail
 * de forma livre (qualquer X/Y de 0 a 100%).
 *
 * - Mostra preview da foto em miniatura (aspect 16:9 do canvas)
 * - Overlay com crosshair que indica o ponto de foco atual (object-position)
 * - Drag interativo: arrasta o crosshair no preview pra mudar foco
 * - Sliders X/Y pra fine-tune (debounced quando arrasta o slider)
 * - Touch + mouse + touch-action none + select-none
 *
 * Salva em formato CSS object-position: "X% Y%"
 */
export function FotoFundoDragger({
  fotoSrc,
  valor,
  onChange,
  disabled,
}: {
  fotoSrc: string | null     // base64 ou URL da foto
  valor: string              // "X% Y%" ou keyword "center"|"top"|...
  onChange: (novo: string) => void
  disabled?: boolean
}) {
  // Parseia valor inicial — converte keywords pra %
  const { x: x0, y: y0 } = parseObjectPosition(valor)
  const [x, setX] = useState(x0)
  const [y, setY] = useState(y0)
  const containerRef = useRef<HTMLDivElement>(null)
  const arrastandoRef = useRef(false)

  // Quando valor externo muda (undo, etc), sincroniza
  useEffect(() => {
    const p = parseObjectPosition(valor)
    setX(p.x)
    setY(p.y)
  }, [valor])

  // Aplica mudança ao parent (debounced via animationFrame pra fluidez)
  const rafRef = useRef<number | null>(null)
  const aplicar = useCallback((nx: number, ny: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      onChange(`${Math.round(nx)}% ${Math.round(ny)}%`)
    })
  }, [onChange])

  const updateFromClient = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const nx = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    const ny = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100))
    setX(nx)
    setY(ny)
    aplicar(nx, ny)
  }, [aplicar])

  // Mouse drag (desktop)
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!arrastandoRef.current) return
      updateFromClient(e.clientX, e.clientY)
    }
    function onUp() { arrastandoRef.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [updateFromClient])

  // Touch drag (mobile)
  useEffect(() => {
    function onMove(e: TouchEvent) {
      if (!arrastandoRef.current) return
      e.preventDefault()
      const t = e.touches[0]
      if (t) updateFromClient(t.clientX, t.clientY)
    }
    function onEnd() { arrastandoRef.current = false }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [updateFromClient])

  return (
    <div className="space-y-3">
      {/* Preview da foto com crosshair arrastável */}
      {fotoSrc ? (
        <div
          ref={containerRef}
          onMouseDown={(e) => {
            if (disabled) return
            arrastandoRef.current = true
            updateFromClient(e.clientX, e.clientY)
          }}
          onTouchStart={(e) => {
            if (disabled) return
            arrastandoRef.current = true
            const t = e.touches[0]
            if (t) updateFromClient(t.clientX, t.clientY)
          }}
          className="relative aspect-video rounded-xl overflow-hidden border border-[#1a1a2e] cursor-crosshair touch-none select-none bg-[#0a0a14]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotoSrc}
            alt="Foto de fundo"
            className="w-full h-full object-cover pointer-events-none"
            style={{ objectPosition: `${x}% ${y}%` }}
            draggable={false}
          />
          {/* Overlay escuro pra contraste do crosshair */}
          <div className="absolute inset-0 bg-black/15 pointer-events-none" />

          {/* Crosshair (linhas) */}
          <div
            className="absolute top-0 bottom-0 w-px bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.5)] pointer-events-none"
            style={{ left: `${x}%` }}
          />
          <div
            className="absolute left-0 right-0 h-px bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.5)] pointer-events-none"
            style={{ top: `${y}%` }}
          />

          {/* Bolinha alvo no centro */}
          <div
            className="absolute w-9 h-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-3 border-white shadow-2xl pointer-events-none"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              backgroundColor: 'rgba(99,102,241,0.7)',
              borderWidth: '3px',
            }}
          >
            {/* Centro da bolinha */}
            <div className="absolute inset-2 rounded-full bg-white" />
          </div>

          {/* Coords */}
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/80 text-white text-[10px] font-mono pointer-events-none">
            {Math.round(x)}% / {Math.round(y)}%
          </div>

          {!arrastandoRef.current && (
            <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/80 text-white text-[10px] font-semibold pointer-events-none">
              Toque pra mover o foco
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video rounded-xl bg-[#0a0a14] border border-dashed border-[#1a1a2e] flex items-center justify-center text-xs text-[#5a5a7a]">
          Sem preview da foto
        </div>
      )}

      {/* Sliders pra fine-tune */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#9b9bb5]">Horizontal</span>
            <span className="text-xs font-mono text-iara-400 tabular-nums">{Math.round(x)}%</span>
          </div>
          <input
            type="range"
            min={0} max={100} step={1}
            value={x}
            onChange={e => { const v = Number(e.target.value); setX(v); aplicar(v, y) }}
            disabled={disabled}
            className="w-full accent-iara-500 disabled:opacity-50"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#9b9bb5]">Vertical</span>
            <span className="text-xs font-mono text-iara-400 tabular-nums">{Math.round(y)}%</span>
          </div>
          <input
            type="range"
            min={0} max={100} step={1}
            value={y}
            onChange={e => { const v = Number(e.target.value); setY(v); aplicar(x, v) }}
            disabled={disabled}
            className="w-full accent-iara-500 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Atalhos pros 9 pontos comuns (regra dos terços + centro) */}
      <div>
        <p className="text-[10px] text-[#6b6b8a] mb-1.5">Atalhos rápidos:</p>
        <div className="grid grid-cols-3 gap-1 max-w-[160px]">
          {[
            { x: 0,   y: 0,   label: '↖' },
            { x: 50,  y: 0,   label: '↑' },
            { x: 100, y: 0,   label: '↗' },
            { x: 0,   y: 50,  label: '←' },
            { x: 50,  y: 50,  label: '◎' },
            { x: 100, y: 50,  label: '→' },
            { x: 0,   y: 100, label: '↙' },
            { x: 50,  y: 100, label: '↓' },
            { x: 100, y: 100, label: '↘' },
          ].map((p, i) => {
            const ativo = Math.abs(x - p.x) < 2 && Math.abs(y - p.y) < 2
            return (
              <button
                key={i}
                onClick={() => { setX(p.x); setY(p.y); aplicar(p.x, p.y) }}
                disabled={disabled}
                aria-label={`${p.x}% ${p.y}%`}
                className={`aspect-square min-h-9 rounded-md border text-base transition-all disabled:opacity-50 ${
                  ativo
                    ? 'border-iara-500 bg-iara-900/30 text-iara-300'
                    : 'border-[#1a1a2e] bg-[#0f0f1e] text-[#5a5a7a] hover:border-iara-700/40'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Helper: parsea object-position string em {x, y} percentuais ───────────────
function parseObjectPosition(valor: string | undefined): { x: number; y: number } {
  if (!valor) return { x: 50, y: 50 }
  const v = valor.trim().toLowerCase()

  // Keywords (single ou X+Y)
  const KEYS_X: Record<string, number> = { left: 0, center: 50, right: 100 }
  const KEYS_Y: Record<string, number> = { top: 0, center: 50, bottom: 100 }

  // Single keyword (center, top, etc)
  if (v in KEYS_X && v in KEYS_Y) {
    if (v === 'top') return { x: 50, y: 0 }
    if (v === 'bottom') return { x: 50, y: 100 }
    if (v === 'left') return { x: 0, y: 50 }
    if (v === 'right') return { x: 100, y: 50 }
    return { x: 50, y: 50 } // center
  }

  // 2 partes: "X Y" — pode ser keyword ou %
  const parts = v.split(/\s+/)
  if (parts.length === 2) {
    const px = parts[0]
    const py = parts[1]
    const x = px in KEYS_X ? KEYS_X[px] : parsePercent(px) ?? 50
    const y = py in KEYS_Y ? KEYS_Y[py] : parsePercent(py) ?? 50
    return { x, y }
  }

  // 1 percentual? assume X (Y=50)
  const px = parsePercent(v)
  if (px !== null) return { x: px, y: 50 }

  return { x: 50, y: 50 }
}

function parsePercent(s: string): number | null {
  const m = s.match(/^(\d+(?:\.\d+)?)%?$/)
  if (!m) return null
  const n = Number(m[1])
  if (Number.isNaN(n)) return null
  return Math.max(0, Math.min(100, n))
}
