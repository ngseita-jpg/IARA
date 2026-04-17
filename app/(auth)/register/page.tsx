'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Este e-mail já está cadastrado.'
        : 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="animate-fade-in">
        <div className="iara-card p-8 text-center glow-purple">
          <div className="w-16 h-16 rounded-full bg-green-900/30 border border-green-700/40 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-[#f1f1f8] mb-2">Conta criada!</h2>
          <p className="text-sm text-[#9b9bb5] mb-6">
            Verifique seu e-mail para confirmar o cadastro. Após confirmar, você pode fazer login.
          </p>
          <Link href="/login" className="iara-btn-primary">
            Ir para o login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
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
        <h2 className="text-xl font-semibold text-[#f1f1f8] mb-1">Criar conta grátis</h2>
        <p className="text-sm text-[#5a5a7a] mb-6">Comece a criar conteúdo incrível com IA.</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="iara-label">Nome</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="iara-input pl-10"
              />
            </div>
          </div>

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
                placeholder="Mínimo 6 caracteres"
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
                Criar conta
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#5a5a7a]">
          Já tem conta?{' '}
          <Link href="/login" className="text-iara-400 hover:text-iara-300 font-medium transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
