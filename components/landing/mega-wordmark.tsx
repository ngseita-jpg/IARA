'use client'

import { useRef, useState } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

/**
 * Wordmark gigante do rodapé. O fill pinta conforme o usuário
 * chega nos últimos 15% do scroll. Assinatura de estúdio premium.
 */
export function MegaWordmark() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end end'],
  })
  const reduce = useReducedMotion()
  const fillWidth = useTransform(scrollYProgress, [0, 1], reduce ? ['100%', '100%'] : ['0%', '100%'])
  const [easterEgg, setEasterEgg] = useState(false)

  return (
    <div
      ref={ref}
      className="relative px-4 sm:px-8 pb-6 overflow-hidden select-none"
      onMouseEnter={() => setEasterEgg(true)}
      onMouseLeave={() => setEasterEgg(false)}
    >
      <div className="relative mx-auto max-w-[1600px]">
        {/* Layer com stroke (fundo) */}
        <h2 className="mega-wordmark text-[clamp(96px,24vw,360px)]">
          IARA
        </h2>
        {/* Layer com fill animado — mesmo texto, clip-path revela progressivamente */}
        <motion.h2
          aria-hidden
          className="mega-wordmark mega-wordmark-fill text-[clamp(96px,24vw,360px)] absolute top-0 left-0"
          style={{ clipPath: useTransform(fillWidth, v => `inset(0 ${100 - parseFloat(v)}% 0 0)`) }}
        >
          IARA
        </motion.h2>

        {/* Easter egg — sparkle sutil aparece no hover prolongado */}
        {easterEgg && !reduce && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="absolute top-[20%] right-[8%] text-iara-400 text-2xl"
          >
            ✦
          </motion.span>
        )}
      </div>
    </div>
  )
}
