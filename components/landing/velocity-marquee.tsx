'use client'

import { useEffect, useRef } from 'react'
import {
  motion, useScroll, useVelocity, useSpring, useTransform,
  useMotionValue, useAnimationFrame, useReducedMotion,
} from 'framer-motion'

/**
 * Marquee que acelera com a velocidade do scroll (assinatura de estúdio).
 * Texto se move continuamente à base, e o scroll inteiro do usuário multiplica a velocidade.
 */
export function VelocityMarquee({
  items,
  baseVelocity = 60,
  className = '',
}: {
  items: string[]
  baseVelocity?: number
  className?: string
}) {
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 })
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false })
  const reduce = useReducedMotion()

  const directionFactor = useRef(1)
  useAnimationFrame((_, delta) => {
    if (reduce) return
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000)
    if (velocityFactor.get() < 0) directionFactor.current = -1
    else if (velocityFactor.get() > 0) directionFactor.current = 1
    moveBy += directionFactor.current * moveBy * velocityFactor.get()
    baseX.set(baseX.get() + moveBy)
  })

  const x = useTransform(baseX, v => `${wrap(-100, 0, v)}%`)

  return (
    <div className={`relative overflow-hidden py-6 border-y border-white/5 ${className}`}>
      <motion.div style={{ x }} className="flex whitespace-nowrap">
        {[...items, ...items, ...items, ...items].map((item, i) => (
          <span
            key={i}
            className="font-display text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-[#3a3a5a] mx-8 flex items-center gap-8 shrink-0"
          >
            {item}
            <span className="inline-block w-1 h-1 rounded-full bg-iara-600/60" />
          </span>
        ))}
      </motion.div>
    </div>
  )
}

function wrap(min: number, max: number, value: number) {
  const range = max - min
  return ((((value - min) % range) + range) % range) + min
}

// Auto-cleanup listener no unmount
export function useCleanup(cb: () => void) {
  useEffect(() => cb, [cb])
}
