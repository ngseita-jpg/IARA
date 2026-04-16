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
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center shadow-xl shadow-iara-900/50 mb-4">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold iara-gradient-text">Iara</h1>
        <p className="text-sm text-[#9b9bb5] mt-1">Assessoria com IA para criadores</p>
      </div>

      {/* Card */}
      <div className="iara-card p-8 glow-purple">
        <h2 className="text-xl font-semibold text-[#f1f1f8] mb-1">Entrar na sua conta</h2>
        <p className="text-sm text-[#5a5a7a] mb-6">Bem-vindo de volta! Insira suas credenciais.</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="iara-label">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="iara-input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="iara-label">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="iara-input pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="iara-btn-primary w-full mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Entrar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#5a5a7a]">
          Não tem conta?{' '}
          <Link href="/register" className="text-iara-400 hover:text-iara-300 font-medium transition-colors">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  )
}
