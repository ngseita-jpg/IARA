'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, CreditCard, Mail, Loader2, ExternalLink, LogOut, ArrowLeft, Lock, Eye, EyeOff, Check, AlertCircle, RefreshCw } from 'lucide-react'
import { UpgradeModal } from '@/components/upgrade-modal'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { labelPlano } from '@/lib/stripe'
import { toast } from '@/lib/toast'
import { useModalA11y } from '@/hooks/useModalA11y'

const PLANO_COLOR: Record<string, string> = {
  free:         'text-[#6b6b8a]',
  trial:        'text-amber-400',
  plus:         'text-indigo-400',
  premium:      'text-violet-400',
  profissional: 'text-emerald-400',
  agencia:      'text-pink-400',
}

type Perfil = {
  email: string | null
  full_name: string | null
  plano: string
  nome_artistico: string | null
  stripe_customer_id: string | null
}

export default function ContaPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [erroCarregar, setErroCarregar] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [senhaOpen, setSenhaOpen] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErroCarregar(null)
    try {
      const r = await fetch('/api/perfil/conta', { cache: 'no-store' })
      if (r.status === 401) {
        router.push('/login')
        return
      }
      if (!r.ok) {
        const body = await r.json().catch(() => ({}))
        throw new Error(body.error || `Erro ${r.status} ao carregar conta`)
      }
      const data = await r.json()
      if (!data || typeof data !== 'object') {
        throw new Error('Resposta inválida do servidor')
      }
      setPerfil(data)
    } catch (e) {
      setErroCarregar(e instanceof Error ? e.message : 'Erro ao carregar conta')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        toast.error(data.error || 'Não foi possível abrir o portal. Tente em alguns segundos.')
        return
      }
      window.location.href = data.url
    } catch {
      toast.error('Falha de conexão. Verifique sua internet.')
    } finally {
      setPortalLoading(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = 'iara_auto_login=; path=/; max-age=0; samesite=lax'
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080f' }}>
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (erroCarregar) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background: '#08080f',
          paddingTop:    'calc(env(safe-area-inset-top, 0px) + 2rem)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)',
        }}
      >
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-950/30 border border-red-900/40 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-white mb-2">Não consegui carregar sua conta</h1>
          <p className="text-sm text-[#9b9bb5] mb-6">{erroCarregar}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={carregar}
              className="w-full min-h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar de novo
            </button>
            <Link
              href="/dashboard"
              className="w-full min-h-11 rounded-xl border border-[#1a1a2e] text-sm text-[#9b9bb5] hover:bg-[#1a1a2e] flex items-center justify-center"
            >
              Voltar pro dashboard
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full min-h-11 rounded-xl text-xs text-[#6b6b8a] hover:text-red-400"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    )
  }

  const plano = perfil?.plano ?? 'free'
  const temAssinatura = !!perfil?.stripe_customer_id && plano !== 'free'

  return (
    <div
      className="min-h-screen px-4 md:py-12"
      style={{
        background: '#08080f',
        // Safe area pra status bar e home indicator no PWA standalone
        paddingTop:    'calc(env(safe-area-inset-top, 0px) + 2rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)',
      }}
    >
      <div className="max-w-lg mx-auto">

        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard"
            aria-label="Voltar pro dashboard"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-[#6b6b8a] hover:text-white hover:bg-[#1a1a2e] transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">Minha Conta</h1>
            <p className="text-xs text-[#6b6b8a]">Dados e assinatura</p>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mb-3">
            <User className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-bold text-white">{perfil?.nome_artistico || perfil?.full_name || 'Criador'}</p>
          <p className="text-sm text-[#6b6b8a]">{perfil?.email}</p>
        </div>

        {/* Cards */}
        <div className="space-y-3">

          {/* Email */}
          <div className="rounded-2xl border border-[#1a1a2e] bg-[#13131f] p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-[#6b6b8a]" />
            </div>
            <div>
              <p className="text-xs text-[#6b6b8a] mb-0.5">Email cadastrado</p>
              <p className="text-sm font-semibold text-white">{perfil?.email}</p>
            </div>
          </div>

          {/* Plano */}
          <div className="rounded-2xl border border-[#1a1a2e] bg-[#13131f] p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-[#6b6b8a]" />
              </div>
              <div>
                <p className="text-xs text-[#6b6b8a] mb-0.5">Plano atual</p>
                <p className={`text-sm font-bold ${PLANO_COLOR[plano] ?? 'text-white'}`}>
                  {labelPlano(plano)}
                </p>
              </div>
            </div>
            {temAssinatura ? (
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-400 border border-indigo-800/40 hover:bg-indigo-950/30 transition-colors cursor-pointer disabled:opacity-50"
              >
                {portalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                Gerenciar
              </button>
            ) : (
              <button
                onClick={() => setUpgradeOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-400 border border-indigo-800/40 hover:bg-indigo-950/30 transition-colors cursor-pointer"
              >
                Fazer upgrade
              </button>
            )}
          </div>

          {/* Mudar senha */}
          <button
            onClick={() => setSenhaOpen(true)}
            className="w-full rounded-2xl border border-[#1a1a2e] bg-[#13131f] p-4 flex items-center justify-between hover:border-indigo-800/40 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-[#6b6b8a] group-hover:text-indigo-400 transition-colors" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Mudar senha</p>
                <p className="text-xs text-[#6b6b8a]">Atualizar sua senha de acesso</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-[#3a3a5a] group-hover:text-indigo-400 transition-colors" />
          </button>

          {/* Persona link */}
          <Link
            href="/dashboard/persona"
            className="rounded-2xl border border-[#1a1a2e] bg-[#13131f] p-4 flex items-center justify-between hover:border-indigo-800/40 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/20 to-violet-600/10 border border-indigo-800/30 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Minha Persona IA</p>
                <p className="text-xs text-[#6b6b8a]">Nicho, tom de voz, plataformas e mais</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-[#3a3a5a] group-hover:text-indigo-400 transition-colors" />
          </Link>

          {/* Sair */}
          <button
            onClick={handleSignOut}
            className="w-full rounded-2xl border border-[#1a1a2e] bg-[#13131f] p-4 flex items-center gap-4 hover:border-red-900/40 hover:bg-red-950/10 transition-colors group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4 text-[#6b6b8a] group-hover:text-red-400 transition-colors" />
            </div>
            <p className="text-sm font-semibold text-[#9b9bb5] group-hover:text-red-400 transition-colors">Sair da conta</p>
          </button>

        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      {senhaOpen && perfil?.email && (
        <MudarSenhaModal
          email={perfil.email}
          onClose={() => setSenhaOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Modal de mudar senha (re-auth + update via Supabase auth) ────────────────
function MudarSenhaModal({ email, onClose }: { email: string; onClose: () => void }) {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showAtual, setShowAtual] = useState(false)
  const [showNova, setShowNova] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  useModalA11y(true, onClose)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (novaSenha.length < 6) {
      setErro('Nova senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }
    if (novaSenha === senhaAtual) {
      setErro('A nova senha precisa ser diferente da atual.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      // 1. Re-autenticar com senha atual (proteção contra session hijack)
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password: senhaAtual })
      if (signErr) {
        setErro('Senha atual incorreta.')
        setLoading(false)
        return
      }
      // 2. Atualizar pra nova senha
      const { error: updErr } = await supabase.auth.updateUser({ password: novaSenha })
      if (updErr) {
        setErro('Erro ao atualizar senha. Tente novamente.')
        setLoading(false)
        return
      }
      // 3. Audit (best-effort)
      void fetch('/api/audit/evento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evento: 'senha_alterada', meta: { via: 'conta' } }),
      }).catch(() => null)

      setSucesso(true)
      toast.success('Senha alterada com sucesso')
      setTimeout(() => onClose(), 1500)
    } catch {
      setErro('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full sm:max-w-md max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#1a1a2e] bg-[#0e0e1e] shadow-2xl p-6">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-xl text-[#6b6b8a] hover:text-[#f1f1f8] hover:bg-[#1a1a2e]"
        >
          <span className="text-2xl leading-none">×</span>
        </button>

        <div className="mb-5">
          <h2 className="text-lg font-bold text-white mb-1">Mudar senha</h2>
          <p className="text-xs text-[#6b6b8a]">Confirme a senha atual antes de definir a nova.</p>
        </div>

        {sucesso ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-900/30 border border-green-700/40 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">Senha atualizada!</p>
            <p className="text-xs text-[#6b6b8a]">Você continua logado nessa sessão.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#6b6b8a] mb-1.5">Senha atual</label>
              <div className="relative">
                <input
                  type={showAtual ? 'text' : 'password'}
                  value={senhaAtual}
                  onChange={e => setSenhaAtual(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 pr-11 text-sm text-white focus:border-indigo-700/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowAtual(v => !v)}
                  aria-label={showAtual ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#6b6b8a] hover:text-white"
                >
                  {showAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#6b6b8a] mb-1.5">Nova senha</label>
              <div className="relative">
                <input
                  type={showNova ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 pr-11 text-sm text-white placeholder:text-[#3a3a5a] focus:border-indigo-700/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNova(v => !v)}
                  aria-label={showNova ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#6b6b8a] hover:text-white"
                >
                  {showNova ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#6b6b8a] mb-1.5">Confirmar nova senha</label>
              <input
                type={showNova ? 'text' : 'password'}
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-white focus:border-indigo-700/60 focus:outline-none"
              />
            </div>

            {erro && (
              <div className="px-3 py-2 rounded-xl bg-red-900/20 border border-red-800/40 text-red-300 text-xs">
                ⚠ {erro}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 min-h-11 rounded-xl border border-[#1a1a2e] text-sm text-[#9b9bb5] hover:bg-[#1a1a2e] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !senhaAtual || !novaSenha}
                className="flex-1 min-h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar senha'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
