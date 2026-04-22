'use client'

import { ReactNode } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

/**
 * Color wash do fundo atrelado ao scroll — respira com o usuário.
 * Stops escolhidos pra manter sempre dark e dentro do DNA da marca.
 */
export function ScrollWash({ children }: { children: ReactNode }) {
  const { scrollYProgress } = useScroll()
  const reduce = useReducedMotion()
  const bg = useTransform(
    scrollYProgress,
    [0, 0.25, 0.55, 0.8, 1],
    reduce
      ? ['#08080f', '#08080f', '#08080f', '#08080f', '#08080f']
      : ['#08080f', '#0a0818', '#0e081c', '#0a0614', '#08080f']
  )
  return (
    <motion.div style={{ backgroundColor: bg }} className="min-h-screen">
      {children}
    </motion.div>
  )
}
