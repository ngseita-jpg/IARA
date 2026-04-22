'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, CreditCard, Mail, Loader2, ExternalLink, LogOut, ArrowLeft } from 'lucide-react'
import { UpgradeModal } from '@/components/upgrade-modal'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const PLANO_LABEL: Record<string, string> = {
  free: 'Gratuito',
  plus: 'Plus — R$49,90/mês',
  premium: 'Premium — R$89,00/mês',
  profissional: 'Profissional — R$179,90/mês',
}

const PLANO_COLOR: Record<string, string> = {
  free: 'text-[#6b6b8a]',
  plus: 'text-indigo-400',
  premium: 'text-violet-400',
  profissional: 'text-emerald-400',
}

export default function ContaPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email?: string; full_name?: string } | null>(null)
  const [perfil, setPerfil] = useState<{ plano?: string; nome_artistico?: string; stripe_customer_id?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/login'); return }
      setUser({ email: u.email, full_name: u.user_metadata?.full_name })

      const { data: p } = await supabase
        .from('creator_profiles')
        .select('plano, nome_artistico, stripe_customer_id')
        .eq('user_id', u.id)
        .maybeSingle()
      setPerfil(p)
      setLoading(false)
    }
    load()
  }, [router])

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setPortalLoading(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080f' }}>
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    )
  }

  const plano = perfil?.plano ?? 'free'
  const temAssinatura = !!perfil?.stripe_customer_id && plano !== 'free'

  return (
    <div className="min-h-screen px-4 py-8 md:py-12" style={{ background: '#08080f' }}>
      <div className="max-w-lg mx-auto">

        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="p-2 rounded-xl text-[#6b6b8a] hover:text-white hover:bg-[#1a1a2e] transition-colors">
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
          <p className="text-lg font-bold text-white">{perfil?.nome_artistico || user?.full_name || 'Criador'}</p>
          <p className="text-sm text-[#6b6b8a]">{user?.email}</p>
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
              <p className="text-sm font-semibold text-white">{user?.email}</p>
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
                  {PLANO_LABEL[plano] ?? plano}
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
    </div>
  )
}
