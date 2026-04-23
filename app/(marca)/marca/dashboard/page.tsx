import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Users, Building2, Sparkles, ArrowRight, Zap,
  TrendingUp, Search, Briefcase, ChevronRight, MessageSquare,
} from 'lucide-react'

// Desativa cache — sempre busca plano atualizado (importante após upgrade via Stripe)
export const dynamic = 'force-dynamic'

export default async function MarcaDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'Parceiro'

  // Admin client bypassa RLS + sempre lê direto do banco (sem cache)
  const admin = createAdminClient()
  const { data: brand } = await admin
    .from('brand_profiles')
    .select('nome_empresa, segmento, porte, plano')
    .eq('user_id', user?.id ?? '')
    .maybeSingle()

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const nomeExibir = brand?.nome_empresa?.split(' ')[0] ?? firstName

  const { count: totalCriadores } = await supabase
    .from('creator_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('onboarding_completo', true)

  const brandProfile = await supabase
    .from('brand_profiles')
    .select('id')
    .eq('user_id', user?.id ?? '')
    .single()

  const { count: totalVagas } = brandProfile.data
    ? await supabase
        .from('vagas')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', brandProfile.data.id)
        .eq('status', 'aberta')
    : { count: 0 }

  const novosModulos = [
    {
      label: 'Chat Estratégico',
      desc: 'Consultoria de marketing em tempo real com a IA Iara',
      href: '/marca/dashboard/chat',
      icon: MessageSquare,
      gradient: 'from-[#C9A84C]/12 to-[#a855f7]/8',
      border: 'border-[#C9A84C]/25',
    },
    {
      label: 'Relatório de ROI',
      desc: 'Métricas reais das suas campanhas com análise de IA',
      href: '/marca/dashboard/roi',
      icon: Sparkles,
      gradient: 'from-[#a855f7]/12 to-[#ec4899]/8',
      border: 'border-[#a855f7]/25',
    },
  ]

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div className="mb-8">
        <p className="text-[#5a5a7a] text-sm mb-1">{saudacao} 👋</p>
        <h1 className="text-3xl md:text-4xl font-bold text-[#f1f1f8] leading-tight">
          Olá, <span className="marca-gradient-text">{nomeExibir}</span>
        </h1>
        {brand?.nome_empresa && nomeExibir !== brand.nome_empresa && (
          <p className="mt-1 text-[#5a5a7a] text-sm">{brand.nome_empresa}</p>
        )}
        <p className="mt-2 text-[#6b6b8a] text-sm">Bem-vindo à sua área de marcas na Iara</p>
      </div>

      {/* Destaque — Campanha IA */}
      <Link href="/marca/dashboard/campanha" className="block group mb-8">
        <div className="relative overflow-hidden rounded-2xl border border-[#C9A84C]/25 p-6 hover:border-[#C9A84C]/50 transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(168,85,247,0.08) 100%)' }}>
          {/* Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #a855f7)' }}>
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-[#f1f1f8]">Gerador de Campanhas IA</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border text-[#E2C068] border-[#C9A84C]/40"
                    style={{ background: 'rgba(201,168,76,0.1)' }}>
                    Exclusivo
                  </span>
                </div>
                <p className="text-sm text-[#9b9bb5] max-w-lg leading-relaxed">
                  Descreva seu produto e objetivo — a IA gera estratégia completa, briefing pronto para o criador, 3 conceitos de conteúdo com hooks e KPIs de ROI. O que agências cobram semanas e R$50k, em 2 minutos.
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#C9A84C] group-hover:translate-x-1 transition-transform flex-shrink-0 mt-1" />
          </div>
        </div>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[#E2C068]" />
            <span className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider">Criadores</span>
          </div>
          <p className="text-2xl font-bold text-[#f1f1f8]">{totalCriadores ?? 0}</p>
          <p className="text-xs text-[#5a5a7a] mt-0.5">disponíveis na plataforma</p>
        </div>
        <Link href="/marca/dashboard/vagas" className="rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] p-4 hover:border-[#C9A84C]/20 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-accent-purple" />
            <span className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider">Vagas abertas</span>
          </div>
          <p className="text-2xl font-bold text-[#f1f1f8]">{totalVagas ?? 0}</p>
          <p className="text-xs text-[#5a5a7a] mt-0.5">suas vagas ativas</p>
        </Link>
        <div className="col-span-2 md:col-span-1 rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#E2C068]" />
            <span className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider">Plano</span>
          </div>
          <p className="text-2xl font-bold text-[#f1f1f8] capitalize">{brand?.plano ?? 'Free'}</p>
          <Link href="/empresas#planos" className="text-xs text-[#C9A84C] hover:text-[#E2C068] transition-colors mt-0.5 block">
            Ver planos →
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-3.5 h-3.5 text-[#E2C068]" />
          <h2 className="text-xs font-bold text-[#6b6b8a] uppercase tracking-widest">Acesso rápido</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            {
              label: 'Vagas de Campanha',
              desc: 'Publique vagas e gerencie candidaturas de criadores alinhados',
              href: '/marca/dashboard/vagas',
              icon: Briefcase,
              gradient: 'from-[#C9A84C]/12 to-accent-purple/8',
              border: 'border-[#C9A84C]/25',
            },
            {
              label: 'Buscar Criadores',
              desc: 'Encontre criadores por nicho, plataforma e nível de engajamento',
              href: '/marca/dashboard/criadores',
              icon: Search,
              gradient: 'from-[#C9A84C]/10 to-accent-purple/5',
              border: 'border-[#C9A84C]/20',
            },
            {
              label: 'Minha Empresa',
              desc: 'Edite o perfil da sua empresa e preferências de campanha',
              href: '/marca/dashboard/perfil',
              icon: Building2,
              gradient: 'from-accent-purple/10 to-[#C9A84C]/5',
              border: 'border-accent-purple/20',
            },
          ].map(action => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href} className="block group">
                <div className={`h-full rounded-2xl p-5 border ${action.border} bg-gradient-to-br ${action.gradient} hover:scale-[1.01] hover:shadow-xl hover:shadow-black/30 active:scale-[0.99] transition-all duration-150`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0a0a14]/60 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#E2C068]" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#3a3a5a] group-hover:text-[#E2C068] group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="font-semibold text-[#f1f1f8] text-sm mb-1">{action.label}</h3>
                  <p className="text-xs text-[#5a5a7a] leading-relaxed">{action.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Novos módulos */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#E2C068]" />
          <h2 className="text-xs font-bold text-[#6b6b8a] uppercase tracking-widest">Ferramentas IA</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {novosModulos.map(mod => {
            const Icon = mod.icon
            return (
              <Link key={mod.href} href={mod.href} className="block group">
                <div className={`h-full rounded-2xl p-5 border ${mod.border} bg-gradient-to-br ${mod.gradient} hover:scale-[1.01] hover:shadow-xl hover:shadow-black/30 active:scale-[0.99] transition-all duration-150`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #C9A84C, #a855f7)' }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#3a3a5a] group-hover:text-[#E2C068] group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="font-semibold text-[#f1f1f8] text-sm mb-1">{mod.label}</h3>
                  <p className="text-xs text-[#5a5a7a] leading-relaxed">{mod.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* CTA upgrade if free */}
      {(!brand?.plano || brand.plano === 'free') && (
        <div className="mt-8">
          <Link href="/empresas#planos" className="group flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border border-[#C9A84C]/20 hover:border-[#C9A84C]/40 transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(168,85,247,0.06) 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(168,85,247,0.15))' }}>
                <Sparkles className="w-5 h-5 text-[#E2C068]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#f1f1f8]">Desbloqueie o potencial completo da Iara</p>
                <p className="text-xs text-[#6b6b8a]">Acesse IA estratégica, relatórios de ROI e match com criadores a partir de R$ 197/mês</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#C9A84C] group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </Link>
        </div>
      )}
    </div>
  )
}
