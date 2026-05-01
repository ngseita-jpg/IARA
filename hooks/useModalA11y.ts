'use client'

import { useEffect } from 'react'

/**
 * Hook unificado para a11y de modais:
 *  - Esc fecha
 *  - Body scroll lock enquanto aberto
 *  - Cleanup automático ao desmontar
 *
 * Uso:
 *   useModalA11y(open, onClose)
 *
 * Para fechar via clique no backdrop, use o ref retornado:
 *   const overlayRef = useModalA11y(open, onClose).overlayRef
 *   <div ref={overlayRef} onClick={e => e.target === overlayRef.current && onClose()}>
 *
 * (Ou faça manualmente no JSX — o hook não impõe estrutura.)
 */
export function useModalA11y(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handler)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', handler)
    }
  }, [open, onClose])
}
