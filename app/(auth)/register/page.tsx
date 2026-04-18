'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, CheckCircle, Building2 } from 'lucide-react'

type TipoConta = 'criador' | 'marca'

export default function RegisterPage() {
  const router = useRouter()
  const [tipoConta, setTipoConta] = useState<TipoConta>('criador')
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

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          tipo_conta: tipoConta,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
      <div className="animate-fade-in text-center">
        <div className="rounded-3xl border border-[#1a1a2e] bg-[#0f0f1e]/80 backdrop-blur-xl p-10 shadow-2xl shadow-black/40">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full bg-green-500/30 blur-xl" />
            <div className="relative w-16 h-16 rounded-full bg-green-900/40 border border-green-700/40 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-[#f1f1f8] mb-2">Conta criada!</h2>
          <p className="text-sm text-[#5a5a7a] mb-7 leading-relaxed">
            Verifique seu e-mail para confirmar o cadastro.<br />
            Após confirmar, você já pode entrar.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl py-3 px-6 text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}
          >
            Ir para o login <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
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
        <p className="text-sm text-[#5a5a7a] mt-1.5">Assessoria com IA para criadores e marcas</p>
      </div>

      {/* Card */}
      <div className="rounded-3xl border border-[#1a1a2e] bg-[#0f0f1e]/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
        <h2 className="text-xl font-bold text-[#f1f1f8] mb-1">Criar conta grátis</h2>
        <p className="text-sm text-[#5a5a7a] mb-6">Comece agora — é de graça</p>

        {/* Tipo de conta */}
        <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-[#0a0a14] rounded-2xl border border-[#1a1a2e]">
          <button
            type="button"
            onClick={() => setTipoConta('criador')}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tipoConta === 'criador'
                ? 'bg-gradient-to-br from-iara-600 to-accent-purple text-white shadow-lg'
                : 'text-[#5a5a7a] hover:text-[#9b9bb5]'
            }`}
          >
            <User className="w-4 h-4" />
            Sou criador
          </button>
          <button
            type="button"
            onClick={() => setTipoConta('marca')}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tipoConta === 'marca'
                ? 'bg-gradient-to-br from-iara-600 to-accent-purple text-white shadow-lg'
                : 'text-[#5a5a7a] hover:text-[#9b9bb5]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Sou uma marca
          </button>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm flex items-center gap-2">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {[
            {
              label: tipoConta === 'marca' ? 'Nome do responsável' : 'Nome',
              type: 'text',
              value: name,
              onChange: setName,
              placeholder: tipoConta === 'marca' ? 'Seu nome completo' : 'Seu nome',
              icon: User,
            },
            { label: 'E-mail', type: 'email', value: email, onChange: setEmail, placeholder: 'seu@email.com', icon: Mail },
            { label: 'Senha', type: 'password', value: password, onChange: setPassword, placeholder: 'Mínimo 6 caracteres', icon: Lock },
          ].map(({ label, type, value, onChange, placeholder, icon: Icon }) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
                {label}
              </label>
              <div className="relative">
                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3a3a5a]" />
                <input
                  type={type}
                  required
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3.5 pl-11 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/15 transition-all"
                />
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.01] disabled:opacity-50 disabled:scale-100"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                {tipoConta === 'marca' ? 'Criar conta da minha empresa' : 'Criar minha conta'}
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#1a1a2e] text-center">
          <p className="text-sm text-[#5a5a7a]">
            Já tem conta?{' '}
            <Link href="/login" className="text-iara-400 hover:text-iara-300 font-semibold transition-colors">
              Entrar →
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-[#3a3a5a] mt-5">
        Gratuito para sempre no plano básico 🇧🇷
      </p>
    </div>
  )
}
