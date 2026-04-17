'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha incorretos. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-iara-500 to-accent-purple blur-xl opacity-50" />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center shadow-2xl">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold iara-gradient-text tracking-tight">Iara</h1>
        <p className="text-sm text-[#5a5a7a] mt-1.5">Assessoria com IA para criadores</p>
      </div>

      {/* Card */}
      <div className="rounded-3xl border border-[#1a1a2e] bg-[#0f0f1e]/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
        <h2 className="text-xl font-bold text-[#f1f1f8] mb-1">Bem-vindo de volta</h2>
        <p className="text-sm text-[#5a5a7a] mb-7">Entre para continuar criando com IA</p>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm animate-fade-in flex items-center gap-2">
            <span className="text-red-400">⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3a3a5a]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3.5 pl-11 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/15 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3a3a5a]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3.5 pl-11 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/15 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 relative rounded-xl py-3.5 text-sm font-bold text-white overflow-hidden transition-all duration-200 hover:opacity-90 hover:scale-[1.01] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                Entrar na Iara
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#1a1a2e] text-center">
          <p className="text-sm text-[#5a5a7a]">
            Não tem conta?{' '}
            <Link href="/register" className="text-iara-400 hover:text-iara-300 font-semibold transition-colors">
              Criar gratuitamente →
            </Link>
          </p>
        </div>
      </div>

      {/* Social proof */}
      <p className="text-center text-xs text-[#3a3a5a] mt-5">
        Plataforma de IA para criadores de conteúdo 🇧🇷
      </p>
    </div>
  )
}
