import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  FileText, TrendingUp, Sparkles, ArrowRight,
  User, Calendar, Mic, Target, Layers, BookOpen, Image, Images, Zap,
  ChevronRight, Smartphone, Lightbulb, Briefcase,
} from 'lucide-react'
import { UpgradeBanners } from '@/components/upgrade-banners'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Seu painel Iara — acesse todos os módulos de IA para criadores.',
}
import { getBadgeInfo } from '@/lib/badges'
import { LIMITES, inicioMesAtual } from '@/lib/limites'

const quickAccess = [
  { label: 'Temas IA',    href: '/dashboard/temas',      icon: Lightbulb,   color: 'from-iara-600/35 to-accent-purple/20',     border: 'border-iara-600/50' },
  { label: 'Roteiro',     href: '/dashboard/roteiros',   icon: FileText,    color: 'from-iara-600/30 to-iara-600/10',          border: 'border-iara-700/40' },
  { label: 'Carrossel',   href: '/dashboard/carrossel',  icon: Layers,      color: 'from-accent-pink/25 to-accent-pink/5',     border: 'border-accent-pink/30' },
  { label: 'Stories',     href: '/dashboard/stories',    icon: Smartphone,  color: 'from-accent-purple/25 to-accent-purple/5', border: 'border-accent-purple/30' },
  { label: 'Thumbnail',   href: '/dashboard/thumbnail',  icon: Image,       color: 'from-teal-600/20 to-teal-600/5',           border: 'border-teal-700/30' },
  { label: 'Mídia Kit',   href: '/dashboard/midia-kit',  icon: BookOpen,    color: 'from-amber-600/20 to-amber-600/5',         border: 'border-amber-700/30' },
  { label: 'Oratória',    href: '/dashboard/oratorio',   icon: Mic,         color: 'from-green-600/20 to-green-600/5',         border: 'border-green-700/30' },
  { label: 'Métricas',    href: '/dashboard/metricas',   icon: TrendingUp,  color: 'from-iara-600/20 to-accent-pink/5',        border: 'border-iara-700/30' },
  { label: 'Fotos',       href: '/dashboard/fotos',      icon: Images,      color: 'from-iara-600/15 to-teal-600/5',           border: 'border-iara-700/20' },
  { label: 'Metas',       href: '/dashboard/metas',      icon: Target,      color: 'from-green-600/15 to-iara-600/5',          border: 'border-green-700/20' },
  { label: 'Calendário',  href: '/dashboard/calendario', icon: Calendar,    color: 'from-teal-600/15 to-iara-600/5',           border: 'border-teal-700/20' },
  { label: 'Persona IA',    href: '/dashboard/persona',  icon: User,        color: 'from-accent-purple/15 to-iara-600/5',      border: 'border-accent-purple/20' },
  { label: 'Oportunidades', href: '/dashboard/vagas',   icon: Briefcase,   color: 'from-amber-600/15 to-iara-600/5',          border: 'border-amber-700/20' },
]

const modules = [
  { icon: Lightbulb,  label: 'Faísca Criativa',        desc: 'Chat com IA que extrai o melhor de você e gera ideias de temas incríveis com hook e ângulo prontos.',  href: '/dashboard/temas',      gradient: 'from-iara-600/25 to-accent-purple/15',   border: 'border-iara-600/40', highlight: true },
  { icon: FileText,   label: 'Gerador de Roteiros',    desc: 'Roteiros completos com hook, desenvolvimento e CTA no seu estilo.',        href: '/dashboard/roteiros',   gradient: 'from-iara-600/20 to-accent-purple/10',   border: 'border-iara-700/30' },
  { icon: Layers,     label: 'Gerador de Carrossel',   desc: 'Cole um link ou texto — a Iara monta o carrossel completo com imagens.',   href: '/dashboard/carrossel',  gradient: 'from-accent-pink/15 to-accent-purple/10', border: 'border-accent-pink/20' },
  { icon: Smartphone, label: 'Gerador de Stories',     desc: 'Sequência de 7 slides com hook, virada e CTA no seu tom de voz.',          href: '/dashboard/stories',    gradient: 'from-accent-purple/20 to-iara-600/10',   border: 'border-accent-purple/30' },
  { icon: Image,      label: 'Gerador de Thumbnail',   desc: 'Thumbnails de alto CTR para YouTube e Reels em segundos.',                 href: '/dashboard/thumbnail',  gradient: 'from-teal-900/20 to-accent-purple/10',   border: 'border-teal-800/20' },
  { icon: BookOpen,   label: 'Mídia Kit com IA',       desc: 'Kit profissional com perfil, métricas e voz. Exporta em PDF.',             href: '/dashboard/midia-kit',  gradient: 'from-amber-900/20 to-iara-600/10',       border: 'border-amber-800/20' },
  { icon: Mic,        label: 'Análise de Oratória',    desc: 'Grave sua voz, receba score em 5 dimensões e exercícios personalizados.',  href: '/dashboard/oratorio',   gradient: 'from-accent-purple/20 to-iara-600/10',   border: 'border-accent-purple/30' },
  { icon: TrendingUp, label: 'Métricas das Redes',     desc: 'Métricas consolidadas de todas as plataformas + análise com IA.',          href: '/dashboard/metricas',   gradient: 'from-iara-600/15 to-accent-pink/10',     border: 'border-iara-700/20' },
  { icon: Images,     label: 'Banco de Fotos',         desc: 'Salve suas fotos para usar nos geradores. Acesso rápido de qualquer módulo.', href: '/dashboard/fotos',   gradient: 'from-iara-600/15 to-teal-900/10',        border: 'border-iara-700/20' },
  { icon: Target,     label: 'Metas de Postagem',      desc: 'Organize sua agenda, crie metas e ganhe pontos que sobem seu nível.',      href: '/dashboard/metas',      gradient: 'from-green-900/20 to-iara-600/10',       border: 'border-green-800/20' },
  { icon: Calendar,   label: 'Calendário Editorial',   desc: 'Grade semanal integrada às suas metas. Marque postagens e acumule pontos.',href: '/dashboard/calendario', gradient: 'from-teal-900/20 to-iara-600/10',        border: 'border-teal-800/20' },
  { icon: User,       label: 'Persona IA',             desc: 'Configure seu nicho, tom de voz e plataformas. A IA usa seu perfil em todos os módulos.', href: '/dashboard/persona', gradient: 'from-accent-purple/15 to-iara-600/10', border: 'border-accent-purple/20' },
  { icon: Briefcase,  label: 'Oportunidades',          desc: 'Campanhas abertas por marcas — candidate-se e feche parcerias direto na plataforma.', href: '/dashboard/vagas', gradient: 'from-amber-900/20 to-iara-600/10', border: 'border-amber-800/20' },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'Criador'

  // Separamos a query de plano do resto do perfil:
  // se a coluna plano não existir no banco, só a segunda query falha,
  // e o perfil (nome, pontos etc.) continua funcionando.
  const [{ data: profile }, { data: planoRow }] = await Promise.all([
    supabase
      .from('creator_profiles')
      .select('pontos, nivel, nicho, voz_score_medio, treinos_voz, nome_artistico')
      .eq('user_id', user?.id ?? '')
      .maybeSingle(),
    supabase
      .from('creator_profiles')
      .select('plano, stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user?.id ?? '')
      .maybeSingle(),
  ])

  const pontos = profile?.pontos ?? 0
  const nicho = profile?.nicho ?? undefined
  const badge = getBadgeInfo(pontos, nicho)
  const nome = profile?.nome_artistico?.split(' ')[0] ?? firstName

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  const perfilIncompleto = !profile?.nicho || !profile?.nome_artistico

  const planoAtual = ((planoRow?.plano ?? 'free') as import('@/lib/limites').Plano)

  const PLANO_LABEL: Record<string, string> = {
    free: 'Gratuito',
    plus: 'Plus',
    premium: 'Premium',
    profissional: 'Profissional',
  }

  // Uso do mês atual
  const mesAtual = inicioMesAtual()
  const uid = user?.id ?? ''
  const [
    { count: usoRoteiros },
    { count: usoCarrossel },
    { count: usoStories },
    { count: usoThumbnail },
    { count: usoOratorio },
    { count: usoMidiaKit },
    { count: usoTemas },
  ] = await Promise.all([
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'roteiro').gte('created_at', mesAtual),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'carrossel').gte('created_at', mesAtual),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'stories').gte('created_at', mesAtual),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'thumbnail').gte('created_at', mesAtual),
    supabase.from('voice_analyses').select('*', { count: 'exact', head: true }).eq('user_id', uid).gte('created_at', mesAtual),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'midia_kit').gte('created_at', mesAtual),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'temas').gte('created_at', mesAtual),
  ])

  const limites = LIMITES[planoAtual] ?? LIMITES['free']
  const isIlimitado = planoAtual === 'profissional'
  const usoMes = [
    { label: 'Temas IA',   usado: usoTemas ?? 0,     limite: limites.temas,     cor: 'bg-iara-400' },
    { label: 'Roteiros',   usado: usoRoteiros ?? 0,  limite: limites.roteiro,   cor: 'bg-iara-500' },
    { label: 'Carrosseis', usado: usoCarrossel ?? 0, limite: limites.carrossel, cor: 'bg-accent-pink' },
    { label: 'Stories',    usado: usoStories ?? 0,   limite: limites.stories,   cor: 'bg-accent-purple' },
    { label: 'Thumbnails', usado: usoThumbnail ?? 0, limite: limites.thumbnail, cor: 'bg-teal-500' },
    { label: 'Oratória',   usado: usoOratorio ?? 0,  limite: limites.oratorio,  cor: 'bg-green-500' },
    { label: 'Mídia Kit',  usado: usoMidiaKit ?? 0,  limite: limites.midia_kit, cor: 'bg-amber-500' },
  ]

  const isOwner = user?.email === 'ngseita@gmail.com'

  return (
    <div className="animate-fade-in">

      {/* ── Banner admin ── */}
      {isOwner && (
        <Link href="/admin/cupons" className="block mb-4">
          <div className="rounded-xl border border-indigo-800/30 bg-indigo-950/20 px-4 py-2.5 hover:border-indigo-600/50 transition-all flex items-center justify-between">
            <p className="text-xs font-semibold text-indigo-400">Área Admin — Cupons de desconto</p>
            <ChevronRight className="w-4 h-4 text-indigo-400" />
          </div>
        </Link>
      )}

      {/* ── Banner perfil incompleto ── */}
      {perfilIncompleto && (
        <Link href="/dashboard/perfil" className="block mb-6">
          <div className="rounded-2xl border border-iara-700/40 bg-gradient-to-r from-iara-900/40 to-accent-purple/10 p-4 hover:border-iara-600/60 transition-all duration-200 group">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-iara-600/20 border border-iara-700/30 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-iara-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#f1f1f8]">Complete seu perfil</p>
                  <p className="text-xs text-[#6b6b8a]">A Iara precisa te conhecer para personalizar todos os módulos</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-iara-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </div>
          </div>
        </Link>
      )}

      {/* ── Welcome ── */}
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-[#5a5a7a] text-sm mb-1">{saudacao} 👋</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#f1f1f8] leading-tight">
              Olá, <span className="iara-gradient-text">{nome}</span>
            </h1>
            <p className="mt-2 text-[#6b6b8a] text-sm">O que vamos criar hoje?</p>
          </div>

          <Link href="/dashboard/perfil" className="flex items-center gap-3 rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] px-4 py-3 hover:border-iara-700/40 transition-all duration-200 group">
            <div className={`w-10 h-10 rounded-xl ${badge.cor.bg} border ${badge.cor.border} flex items-center justify-center text-xl`}>
              {badge.cor.emoji}
            </div>
            <div>
              <p className={`text-sm font-bold ${badge.cor.text}`}>{badge.badge}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-20 rounded-full bg-[#1a1a2e] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-iara-500 to-accent-purple"
                    style={{ width: `${badge.progress ?? 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#5a5a7a]">{badge.pontos} pts</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Acesso rápido ── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-3.5 h-3.5 text-iara-400" />
          <h2 className="text-xs font-bold text-[#6b6b8a] uppercase tracking-widest">Acesso rápido</h2>
        </div>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
          {quickAccess.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-none flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br ${item.color} border ${item.border} hover:scale-[1.04] active:scale-[0.97] transition-all duration-150 group`}
                style={{ width: '4.75rem' }}
              >
                <div className="w-9 h-9 rounded-xl bg-[#0a0a14]/60 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-iara-400 group-hover:text-iara-300 transition-colors" />
                </div>
                <span className="text-[10px] font-medium text-[#9b9bb5] group-hover:text-[#f1f1f8] transition-colors text-center leading-tight w-full">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Uso do mês ── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-iara-400" />
            <h2 className="text-xs font-bold text-[#6b6b8a] uppercase tracking-widest">Uso este mês · Plano {PLANO_LABEL[planoAtual] ?? planoAtual}</h2>
          </div>
          <Link href="/conta" className="text-[10px] text-iara-400 hover:text-iara-300 transition-colors font-medium">
            Minha conta →
          </Link>
        </div>

        {isIlimitado ? (
          <div className="rounded-2xl border border-emerald-800/30 bg-gradient-to-r from-emerald-950/30 to-[#0f0f1e] p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-900/30 border border-emerald-800/25 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#f1f1f8]">Acesso ilimitado ativo</p>
              <p className="text-xs text-[#6b6b8a]">Sem restrições de uso — gere o quanto quiser</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {usoMes.map((item) => {
                const limite = item.limite ?? 0
                const pct = limite > 0 ? Math.min(100, Math.round((item.usado / limite) * 100)) : 0
                const esgotado = limite > 0 && item.usado >= limite
                return (
                  <div key={item.label} className={`rounded-2xl p-3.5 bg-[#0f0f1e] border ${esgotado ? 'border-red-800/40' : 'border-[#1a1a2e]'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-medium text-[#9b9bb5]">{item.label}</span>
                      <span className={`text-[11px] font-bold ${esgotado ? 'text-red-400' : 'text-[#6b6b8a]'}`}>
                        {item.usado}/{item.limite ?? '∞'}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${esgotado ? 'bg-red-500' : item.cor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <UpgradeBanners
              quaseNoLimite={!usoMes.some(i => i.limite !== null && i.usado >= i.limite) && usoMes.some(i => i.limite !== null && i.usado / i.limite >= 0.8)}
              limiteAtingido={usoMes.some(i => i.limite !== null && i.usado >= i.limite)}
              plano={planoAtual}
            />
          </>
        )}
      </div>

      {/* ── Todos os módulos ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-iara-400" />
          <h2 className="text-xs font-bold text-[#6b6b8a] uppercase tracking-widest">Todos os módulos</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((mod) => {
            const Icon = mod.icon
            const isHighlight = (mod as { highlight?: boolean }).highlight
            return (
              <Link key={mod.label} href={mod.href} className={`block group ${isHighlight ? 'md:col-span-2 lg:col-span-1' : ''}`}>
                <div className={`h-full rounded-2xl p-5 border ${mod.border} bg-gradient-to-br ${mod.gradient} hover:scale-[1.01] hover:shadow-xl hover:shadow-black/30 active:scale-[0.99] transition-all duration-150 ${isHighlight ? 'relative overflow-hidden' : ''}`}>
                  {isHighlight && (
                    <div className="absolute top-0 right-0 px-2.5 py-1 rounded-bl-xl text-[10px] font-bold text-iara-300 bg-iara-900/60 border-b border-l border-iara-700/40">
                      NOVO
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl bg-[#0a0a14]/60 flex items-center justify-center ${isHighlight ? 'shadow-lg shadow-iara-900/40' : ''}`}>
                      <Icon className={`w-4 h-4 ${isHighlight ? 'text-iara-300' : 'text-iara-400'}`} />
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#3a3a5a] group-hover:text-iara-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className={`font-semibold text-sm mb-1 ${isHighlight ? 'text-[#f1f1f8] font-bold' : 'text-[#f1f1f8]'}`}>{mod.label}</h3>
                  <p className="text-xs text-[#5a5a7a] leading-relaxed">{mod.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
