'use client'

import { useEffect } from 'react'

/**
 * Registra o service worker (apenas em produção, evita interferir no dev).
 * Roda 1× no mount do layout root. Falha silenciosa se browser não suporta.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Em dev, NEXT_PUBLIC_VERCEL_ENV é "development" ou undefined.
    // Evitamos registrar SW localmente pra não bagunçar HMR.
    const env = process.env.NEXT_PUBLIC_VERCEL_ENV
    if (env && env !== 'production') return

    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .catch(() => null)  // silent — não é critico
    }

    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad, { once: true })

    return () => window.removeEventListener('load', onLoad)
  }, [])

  return null
}
