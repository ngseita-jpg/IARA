'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Lock, CheckCircle, Loader2 } from 'lucide-react'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Não foi possível redefinir a senha. O link pode ter expirado.')
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Grade de pontos decorativa */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-iara-600/6 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
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
          {done ? (
            <div className="text-center py-4">
              <div className="relative w-14 h-14 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl" />
                <div className="relative w-14 h-14 rounded-full bg-green-900/30 border border-green-700/30 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-[#f1f1f8] mb-2">Senha redefinida!</h2>
              <p className="text-sm text-[#9b9bb5]">Redirecionando para o dashboard…</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-[#f1f1f8] mb-1">Nova senha</h2>
              <p className="text-sm text-[#5a5a7a] mb-7">Escolha uma senha segura para sua conta.</p>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm flex items-center gap-2">
                  <span>⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
                    Nova senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3a3a5a]" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3.5 pl-11 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/15 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3a3a5a]" />
                    <input
                      type="password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repita a senha"
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
                    'Salvar nova senha'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
