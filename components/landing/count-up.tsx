'use client'

import { useRef, useEffect } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'

export function CountUp({
  to, suffix = '', duration = 1.8,
  className = '', prefix = '',
}: {
  to: number; suffix?: string; duration?: number; className?: string; prefix?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!inView || !ref.current) return
    if (reduce) {
      ref.current.textContent = `${prefix}${to.toLocaleString('pt-BR')}${suffix}`
      return
    }
    const controls = animate(0, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: v => {
        if (ref.current) ref.current.textContent = `${prefix}${Math.round(v).toLocaleString('pt-BR')}${suffix}`
      },
    })
    return () => controls.stop()
  }, [inView, to, suffix, duration, reduce, prefix])

  return <span ref={ref} className={`tabular ${className}`}>{prefix}0{suffix}</span>
}
