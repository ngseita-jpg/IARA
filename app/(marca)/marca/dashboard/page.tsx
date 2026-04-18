import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Users, Building2, Sparkles, ArrowRight, Zap,
  TrendingUp, Search, Briefcase, ChevronRight,
} from 'lucide-react'

export default async function MarcaDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'Parceiro'

  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('nome_empresa, segmento, porte, plano, nichos_interesse, plataformas_foco')
    .eq('user_id', user?.id ?? '')
    .single()

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const nomeExibir = brand?.nome_empresa?.split(' ')[0] ?? firstName

  // Count total creators available
  const { count: totalCriadores } = await supabase
    .from('creator_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('onboarding_completo', true)

  const actions = [
    {
      label: 'Buscar Criadores',
      desc: 'Encontre criadores por nicho, plataforma e engajamento',
      href: '/marca/dashboard/criadores',
      icon: Search,
      gradient: 'from-iara-600/20 to-accent-purple/10',
      border: 'border-iara-700/30',
    },
    {
      label: 'Minha Empresa',
      desc: 'Edite o perfil da sua empresa e preferências de campanha',
      href: '/marca/dashboard/perfil',
      icon: Building2,
      gradient: 'from-accent-purple/15 to-iara-600/10',
      border: 'border-accent-purple/20',
    },
  ]

  const upcoming = [
    { label: 'Vagas de Campanha', desc: 'Publique vagas e receba candidaturas de criadores', icon: Briefcase },
    { label: 'IA para Campanhas', desc: 'Gere briefings, calendários e relatórios de ROI', icon: Sparkles },
    { label: 'Chat Estratégico', desc: 'Consultoria de marketing diretamente com a IA Iara', icon: TrendingUp },
  ]

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div className="mb-8">
        <p className="text-[#5a5a7a] text-sm mb-1">{saudacao} 👋</p>
        <h1 className="text-3xl md:text-4xl font-bold text-[#f1f1f8] leading-tight">
          Olá, <span className="iara-gradient-text">{nomeExibir}</span>
        </h1>
        {brand?.nome_empresa && nomeExibir !== brand.nome_empresa && (
          <p className="mt-1 text-[#5a5a7a] text-sm">{brand.nome_empresa}</p>
        )}
        <p className="mt-2 text-[#6b6b8a] text-sm">Bem-vindo à sua área de marcas na Iara</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-iara-400" />
            <span className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider">Criadores</span>
          </div>
          <p className="text-2xl font-bold text-[#f1f1f8]">{totalCriadores ?? 0}</p>
          <p className="text-xs text-[#5a5a7a] mt-0.5">disponíveis na plataforma</p>
        </div>
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-accent-purple" />
            <span className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider">Vagas</span>
          </div>
          <p className="text-2xl font-bold text-[#f1f1f8]">—</p>
          <p className="text-xs text-[#5a5a7a] mt-0.5">em breve disponível</p>
        </div>
        <div className="col-span-2 md:col-span-1 rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider">Plano</span>
          </div>
          <p className="text-2xl font-bold text-[#f1f1f8] capitalize">{brand?.plano ?? 'Free'}</p>
          <Link href="/#planos" className="text-xs text-iara-400 hover:text-iara-300 transition-colors mt-0.5 block">
            Ver planos →
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-3.5 h-3.5 text-iara-400" />
          <h2 className="text-xs font-bold text-[#6b6b8a] uppercase tracking-widest">O que deseja fazer?</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {actions.map(action => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href} className="block group">
                <div className={`h-full rounded-2xl p-5 border ${action.border} bg-gradient-to-br ${action.gradient} hover:scale-[1.01] hover:shadow-xl hover:shadow-black/30 active:scale-[0.99] transition-all duration-150`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0a0a14]/60 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-iara-400" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#3a3a5a] group-hover:text-iara-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="font-semibold text-[#f1f1f8] text-sm mb-1">{action.label}</h3>
                  <p className="text-xs text-[#5a5a7a] leading-relaxed">{action.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Coming soon */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-iara-400" />
          <h2 className="text-xs font-bold text-[#6b6b8a] uppercase tracking-widest">Em breve</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {upcoming.map(item => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="rounded-2xl p-5 border border-[#1a1a2e] bg-[#0f0f1e] opacity-60"
              >
                <div className="w-9 h-9 rounded-xl bg-[#0a0a14] border border-[#1a1a2e] flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-[#3a3a5a]" />
                </div>
                <h3 className="font-semibold text-[#6b6b8a] text-sm mb-1">{item.label}</h3>
                <p className="text-xs text-[#3a3a5a] leading-relaxed">{item.desc}</p>
                <span className="inline-block mt-3 text-[9px] font-bold text-accent-purple/50 uppercase tracking-widest border border-accent-purple/20 rounded-full px-2 py-0.5">
                  Em breve
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA upgrade if free */}
      {(!brand?.plano || brand.plano === 'free') && (
        <div className="mt-8">
          <Link href="/#planos" className="group flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-iara-900/40 to-accent-purple/10 border border-iara-700/30 hover:border-iara-600/50 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-iara-600/30 to-accent-purple/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-iara-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#f1f1f8]">Desbloqueie o potencial completo da Iara</p>
                <p className="text-xs text-[#6b6b8a]">Acesse vagas, IA estratégica e relatórios de ROI a partir de R$397/mês</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-iara-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </Link>
        </div>
      )}
    </div>
  )
}
