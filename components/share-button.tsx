'use client'

import { useState } from 'react'
import { Share2, Check, Loader2 } from 'lucide-react'
import { shareText } from '@/lib/share'
import { toast } from '@/lib/toast'

/**
 * Botão de compartilhar que tenta Web Share API (mobile)
 * com fallback pra clipboard. Mostra feedback visual.
 */
export function ShareButton({
  title,
  text,
  url,
  variant = 'default',
  className = '',
  label = 'Compartilhar',
}: {
  title?: string
  text: string
  url?: string
  variant?: 'default' | 'subtle' | 'icon'
  className?: string
  label?: string
}) {
  const [estado, setEstado] = useState<'idle' | 'sharing' | 'done' | 'copied'>('idle')

  async function handleShare() {
    setEstado('sharing')
    const result = await shareText({ title, text, url })
    if (result === 'shared') {
      setEstado('done')
      toast.success('Compartilhado')
      setTimeout(() => setEstado('idle'), 2000)
    } else if (result === 'copied') {
      setEstado('copied')
      toast.success('Copiado pra área de transferência')
      setTimeout(() => setEstado('idle'), 2000)
    } else {
      setEstado('idle')
      toast.error('Erro ao compartilhar')
    }
  }

  const baseStyle = variant === 'icon'
    ? 'w-11 h-11 flex items-center justify-center rounded-xl'
    : variant === 'subtle'
      ? 'flex items-center gap-1.5 px-3 min-h-9 rounded-lg text-xs font-medium border border-[#1a1a2e] text-[#6b6b8a] hover:border-iara-700/40 hover:text-iara-400'
      : 'flex items-center gap-2 px-4 min-h-11 rounded-xl text-sm font-semibold border border-iara-700/40 text-iara-300 hover:bg-iara-900/30'

  const Icon = estado === 'sharing' ? Loader2 : (estado === 'done' || estado === 'copied' ? Check : Share2)
  const showLabel = variant !== 'icon'

  return (
    <button
      onClick={handleShare}
      disabled={estado === 'sharing'}
      aria-label={label}
      className={`${baseStyle} ${className} transition-all disabled:opacity-50`}
    >
      <Icon className={`${variant === 'icon' ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${estado === 'sharing' ? 'animate-spin' : ''} ${estado === 'done' || estado === 'copied' ? 'text-green-400' : ''}`} />
      {showLabel && (
        <span>
          {estado === 'done' ? 'Compartilhado' : estado === 'copied' ? 'Copiado' : label}
        </span>
      )}
    </button>
  )
}
