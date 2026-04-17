import Link from 'next/link'
import { Sparkles, ArrowLeft, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-iara-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative text-center max-w-md">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 mb-12">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center shadow-lg shadow-iara-900/50">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-bold iara-gradient-text">Iara</span>
        </Link>

        {/* 404 */}
        <div className="mb-6">
          <p className="text-8xl font-black iara-gradient-text leading-none mb-2">404</p>
          <h1 className="text-2xl font-bold text-[#f1f1f8] mb-3">
            Página não encontrada
          </h1>
          <p className="text-[#9b9bb5] text-sm leading-relaxed">
            Parece que essa página se perdeu no feed. Mas não se preocupe —
            seu conteúdo continua aqui.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="iara-btn-primary w-full sm:w-auto">
            <Home className="w-4 h-4" />
            Ir para o Dashboard
          </Link>
          <Link href="/" className="iara-btn-secondary w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4" />
            Página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}
