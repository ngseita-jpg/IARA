'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[dashboard error]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-[#f1f1f8] mb-1">Algo deu errado</h2>
      <p className="text-sm text-[#6b6b8a] mb-6 max-w-xs">
        Ocorreu um erro inesperado. Tente novamente ou volte ao painel principal.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-iara-600 hover:bg-iara-500 text-white text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
        <a
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#13131f] border border-[#1a1a2e] hover:border-[#2a2a3e] text-[#a1a1c2] text-sm font-medium transition-colors"
        >
          Ir ao painel
        </a>
      </div>
    </div>
  )
}
