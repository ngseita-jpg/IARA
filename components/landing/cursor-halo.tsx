'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/**
 * Cursor halo premium. Apenas em desktop (hover: hover).
 * Esconde cursor nativo só quando mouse real está presente.
 * Cresce sobre elementos clicáveis (a, button, [data-cursor="hover"]).
 */
export function CursorHalo() {
  const [enabled, setEnabled] = useState(false)
  const [hovering, setHovering] = useState(false)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 500, damping: 32, mass: 0.5 })
  const sy = useSpring(y, { stiffness: 500, damping: 32, mass: 0.5 })

  useEffect(() => {
    // Só ativa em desktop com mouse fino e sem reduced-motion
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!mq.matches || reduce.matches) return
    setEnabled(true)
    document.documentElement.classList.add('cursor-halo-on')

    const move = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    const over = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const interactive = target.closest('a, button, [data-cursor="hover"], input, textarea, label')
      setHovering(!!interactive)
    }
    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('mouseover', over, { passive: true })
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
      document.documentElement.classList.remove('cursor-halo-on')
    }
  }, [x, y])

  if (!enabled) return null

  return (
    <>
      {/* Halo externo — difference blend, sutil */}
      <motion.div
        aria-hidden
        style={{
          translateX: sx,
          translateY: sy,
          x: '-50%',
          y: '-50%',
          mixBlendMode: 'difference',
        }}
        animate={{
          width: hovering ? 56 : 22,
          height: hovering ? 56 : 22,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full bg-white"
      />
      {/* Dot central — sempre preciso, sem spring (dá precisão "ponta da caneta") */}
      <motion.div
        aria-hidden
        style={{
          translateX: x,
          translateY: y,
          x: '-50%',
          y: '-50%',
        }}
        animate={{ scale: hovering ? 0 : 1 }}
        transition={{ duration: 0.18 }}
        className="fixed top-0 left-0 pointer-events-none z-[9999] w-1 h-1 rounded-full bg-iara-400"
      />
    </>
  )
}
