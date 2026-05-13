'use client'

import { ArrowUp, ArrowDown, Copy, Trash2 } from 'lucide-react'

export type LongPressAction = 'forward' | 'backward' | 'duplicate' | 'delete'

interface Props {
  position: { x: number; y: number }   // viewport-relative px
  onAction: (action: LongPressAction) => void
  onClose: () => void
}

const MENU_W = 220
const ITEM_H = 44   // touch-friendly WCAG AAA
const MENU_H_APROX = ITEM_H * 4 + 8

/**
 * Menu de contexto aberto via long-press numa layer (mobile only).
 *
 * Posiciona-se próximo ao toque, com clamp pra não vazar viewport.
 * Cobre TODA a tela com backdrop transparente — toque fora fecha.
 *
 * Atualmente expõe ações que a toolbar contextual NÃO tem:
 *  - Trazer pra frente (z-index up)
 *  - Mandar pra trás (z-index down)
 *  - Duplicar (atalho)
 *  - Deletar (atalho)
 */
export function LongPressMenu({ position, onAction, onClose }: Props) {
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 360
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 640

  // Posição preferida: à direita e abaixo do toque, com offset pra não cobrir
  let left = position.x + 12
  let top = position.y + 12
  // Clamp horizontal
  if (left + MENU_W > viewportW - 8) left = position.x - MENU_W - 12
  if (left < 8) left = 8
  // Clamp vertical
  if (top + MENU_H_APROX > viewportH - 8) top = position.y - MENU_H_APROX - 12
  if (top < 64) top = 64

  return (
    <div
      className="fixed inset-0 z-[110] lg:hidden"
      onClick={onClose}
      onPointerDown={onClose}
      style={{ touchAction: 'manipulation' }}
    >
      <div
        className="absolute flex flex-col p-1 rounded-2xl bg-[#0f0f1e]/98 backdrop-blur-md border border-iara-700/40 shadow-2xl shadow-iara-900/60"
        style={{ left, top, width: MENU_W }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Item icon={<ArrowUp className="w-4 h-4" />} label="Trazer pra frente" onClick={() => onAction('forward')} />
        <Item icon={<ArrowDown className="w-4 h-4" />} label="Mandar pra trás" onClick={() => onAction('backward')} />
        <Divider />
        <Item icon={<Copy className="w-4 h-4" />} label="Duplicar" onClick={() => onAction('duplicate')} />
        <Item
          icon={<Trash2 className="w-4 h-4 text-red-400" />}
          label="Deletar"
          labelClass="text-red-400"
          onClick={() => onAction('delete')}
        />
      </div>
    </div>
  )
}

function Item({
  icon, label, labelClass, onClick,
}: {
  icon: React.ReactNode
  label: string
  labelClass?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 px-3 rounded-xl text-sm text-[#c1c1d8] hover:bg-white/5 active:bg-white/10 transition text-left"
      style={{ height: ITEM_H }}
    >
      <span className="text-[#9b9bb5]">{icon}</span>
      <span className={`flex-1 ${labelClass ?? ''}`}>{label}</span>
    </button>
  )
}

function Divider() {
  return <div className="h-px bg-[#1a1a2e] my-1 mx-2" />
}
