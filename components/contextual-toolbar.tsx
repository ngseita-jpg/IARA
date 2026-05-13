'use client'

import { Bold, Italic, Minus, Plus, Copy, Trash2, MoreHorizontal } from 'lucide-react'
import type { Layer } from '@/lib/carrossel-canvas-types'

export type ContextualAction =
  | 'bold' | 'italic' | 'sizeDown' | 'sizeUp'
  | 'duplicate' | 'delete' | 'more'

interface Props {
  layer: Layer
  /** Bounds do layer na TELA, em px (top/left absoluto, viewport-relative). */
  bounds: { top: number; left: number; width: number; height: number }
  onAction: (action: ContextualAction) => void
}

const TOOLBAR_W = 312
const TOOLBAR_H = 48
const GAP = 10

/**
 * Toolbar contextual que flutua acima da layer selecionada. Mobile-first,
 * inspirado em Figma/Canva. Atalhos rápidos pras ações mais comuns;
 * o botão "mais" abre o Inspector completo que já existe.
 *
 * Posicionamento:
 *  - 10px acima do bounding box. Se não couber no topo (header da tela
 *    cobriria), inverte e fica abaixo.
 *  - Horizontalmente centralizado no layer. Se vazar a viewport, clampa
 *    pras bordas com 8px de margem.
 *
 * Tipos suportados na V1:
 *  - text: B, I, size-, size+, dup, del, more
 *  - photo/shape: dup, del, more (formatação específica fica no Inspector)
 */
export function ContextualToolbar({ layer, bounds, onAction }: Props) {
  // Calcula posicionamento — preferência acima, fallback abaixo
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 360
  const desiredTop = bounds.top - TOOLBAR_H - GAP
  const top = desiredTop < 64 ? bounds.top + bounds.height + GAP : desiredTop
  const idealLeft = bounds.left + bounds.width / 2 - TOOLBAR_W / 2
  const left = Math.max(8, Math.min(viewportW - TOOLBAR_W - 8, idealLeft))

  const isText = layer.type === 'text'

  return (
    <div
      className="fixed z-[90] flex items-center gap-1 px-2 py-1 rounded-2xl bg-[#0f0f1e]/95 backdrop-blur-md border border-iara-700/40 shadow-2xl shadow-iara-900/60 select-none lg:hidden"
      style={{
        top,
        left,
        width: TOOLBAR_W,
        height: TOOLBAR_H,
        touchAction: 'manipulation',
      }}
      // Bloqueia o click/pointer de propagar pro canvas (que desseleciona layer)
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {isText && (
        <>
          <Btn icon={<Bold className="w-4 h-4" />} label="Negrito" onClick={() => onAction('bold')} />
          <Btn icon={<Italic className="w-4 h-4" />} label="Itálico" onClick={() => onAction('italic')} />
          <Div />
          <Btn icon={<Minus className="w-4 h-4" />} label="Menor" onClick={() => onAction('sizeDown')} />
          <Btn icon={<Plus className="w-4 h-4" />} label="Maior" onClick={() => onAction('sizeUp')} />
          <Div />
        </>
      )}

      <Btn icon={<Copy className="w-4 h-4" />} label="Duplicar" onClick={() => onAction('duplicate')} />
      <Btn icon={<Trash2 className="w-4 h-4 text-red-400" />} label="Deletar" onClick={() => onAction('delete')} />
      <Div />
      <Btn
        icon={<MoreHorizontal className="w-4 h-4" />}
        label="Mais"
        onClick={() => onAction('more')}
        accent
      />
    </div>
  )
}

function Btn({
  icon, label, onClick, accent,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  accent?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex items-center justify-center w-9 h-9 rounded-xl transition active:scale-90 ${
        accent
          ? 'text-iara-300 bg-iara-600/15 hover:bg-iara-600/25'
          : 'text-[#c1c1d8] hover:bg-white/5'
      }`}
    >
      {icon}
    </button>
  )
}

function Div() {
  return <div className="w-px h-5 bg-[#2a2a4a] mx-0.5" />
}
