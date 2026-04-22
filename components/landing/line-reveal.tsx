'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ReactNode } from 'react'

type Line = { content: ReactNode; delay?: number }

/**
 * Revela linhas em sequência usando overflow-hidden wrapper + translateY.
 * Mais premium que fade-up genérico.
 */
export function LineReveal({
  lines,
  className,
  as: Tag = 'h1',
}: {
  lines: Line[]
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div'
}) {
  const reduce = useReducedMotion()

  const MotionTag = motion[Tag] as typeof motion.h1
  return (
    <MotionTag className={className}>
      {lines.map((line, i) => (
        <span key={i} className="line-wrap">
          <motion.span
            className="line-inner"
            initial={reduce ? undefined : { y: '105%' }}
            animate={reduce ? undefined : { y: 0 }}
            transition={{
              duration: 0.9,
              delay: (line.delay ?? 0) + i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {line.content}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  )
}
