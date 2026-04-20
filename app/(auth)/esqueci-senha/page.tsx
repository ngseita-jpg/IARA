'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Redefinir senha | Iara Hub'
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    })

    if (error) {
      setError('Não foi possível enviar o e-mail. Tente novamente.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
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
      </div>

      <div className="rounded-3xl border border-[#1a1a2e] bg-[#0f0f1e]/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
        {sent ? (
          <div className="text-center py-4">
            <div className="relative w-14 h-14 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl" />
              <div className="relative w-14 h-14 rounded-full bg-green-900/30 border border-green-700/30 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#f1f1f8] mb-2">E-mail enviado!</h2>
            <p className="text-sm text-[#9b9bb5] leading-relaxed mb-6">
              Verifique sua caixa de entrada em <span className="text-iara-400">{email}</span> e clique no link para redefinir sua senha.
            </p>
            <Link href="/login" className="text-sm text-iara-400 hover:text-iara-300 transition-colors">
              ← Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-[#f1f1f8] mb-1">Esqueceu a senha?</h2>
            <p className="text-sm text-[#5a5a7a] mb-7">
              Digite seu e-mail e enviaremos um link para redefinir sua senha.
            </p>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 relative rounded-xl py-3.5 text-sm font-bold text-white overflow-hidden transition-all duration-200 hover:opacity-90 hover:scale-[1.01] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Enviar link de redefinição'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#1a1a2e] text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-[#5a5a7a] hover:text-iara-400 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
