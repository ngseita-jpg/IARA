'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-red-900/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-900/20 border border-red-800/30 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-7 h-7 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-[#f1f1f8] mb-3">
          Algo deu errado
        </h1>
        <p className="text-[#9b9bb5] text-sm leading-relaxed mb-8">
          Ocorreu um erro inesperado. Tente novamente — se o problema persistir, entre em contato.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={reset} className="iara-btn-primary w-full sm:w-auto">
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
          <Link href="/dashboard" className="iara-btn-secondary w-full sm:w-auto">
            <Home className="w-4 h-4" />
            Ir para o Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
