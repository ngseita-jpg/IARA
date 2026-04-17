import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  FileText, Sparkles, TrendingUp, ArrowRight,
  User, Calendar, Mic, Target, Layers, BookOpen, Image, Images, Zap,
  ChevronRight,
} from 'lucide-react'
import { getBadgeInfo } from '@/lib/badges'
import { LIMITES, inicioMesAtual } from '@/lib/limites'

const quickAccess = [
  { label: 'Roteiro',     href: '/dashboard/roteiros',   icon: FileText,    color: 'from-iara-600/30 to-iara-600/10',          border: 'border-iara-700/40' },
  { label: 'Carrossel',   href: '/dashboard/carrossel',  icon: Layers,      color: 'from-accent-pink/25 to-accent-pink/5',     border: 'border-accent-pink/30' },
  { label: 'Stories',     href: '/dashboard/stories',    icon: Sparkles,    color: 'from-accent-purple/25 to-accent-purple/5', border: 'border-accent-purple/30' },
  { label: 'Thumbnail',   href: '/dashboard/thumbnail',  icon: Image,       color: 'from-teal-600/20 to-teal-600/5',           border: 'border-teal-700/30' },
  { label: 'Mídia Kit',   href: '/dashboard/midia-kit',  icon: BookOpen,    color: 'from-amber-600/20 to-amber-600/5',         border: 'border-amber-700/30' },
  { label: 'Oratória',    href: '/dashboard/oratorio',   icon: Mic,         color: 'from-green-600/20 to-green-600/5',         border: 'border-green-700/30' },
  { label: 'Métricas',    href: '/dashboard/metricas',   icon: TrendingUp,  color: 'from-iara-600/20 to-accent-pink/5',        border: 'border-iara-700/30' },
  { label: 'Fotos',       href: '/dashboard/fotos',      icon: Images,      color: 'from-iara-600/15 to-teal-600/5',           border: 'border-iara-700/20' },
  { label: 'Metas',       href: '/dashboard/metas',      icon: Target,      color: 'from-green-600/15 to-iara-600/5',          border: 'border-green-700/20' },
  { label: 'Calendário',  href: '/dashboard/calendario', icon: Calendar,    color: 'from-teal-600/15 to-iara-600/5',           border: 'border-teal-700/20' },
  { label: 'Perfil',      href: '/dashboard/perfil',     icon: User,        color: 'from-accent-purple/15 to-iara-600/5',      border: 'border-accent-purple/20' },
]

const modules = [
  { icon: FileText,   label: 'Gerador de Roteiros',    desc: 'Roteiros completos com hook, desenvolvimento e CTA no seu estilo.',        href: '/dashboard/roteiros',   gradient: 'from-iara-600/20 to-accent-purple/10',   border: 'border-iara-700/30' },
  { icon: Layers,     label: 'Gerador de Carrossel',   desc: 'Cole um link ou texto — a Iara monta o carrossel completo com imagens.',   href: '/dashboard/carrossel',  gradient: 'from-accent-pink/15 to-accent-purple/10', border: 'border-accent-pink/20' },
  { icon: Sparkles,   label: 'Gerador de Stories',     desc: 'Sequência de 7 slides com hook, virada e CTA no seu tom de voz.',          href: '/dashboard/stories',    gradient: 'from-accent-purple/20 to-iara-600/10',   border: 'border-accent-purple/30' },
  { icon: Image,      label: 'Gerador de Thumbnail',   desc: 'Thumbnails de alto CTR para YouTube e Reels em segundos.',                 href: '/dashboard/thumbnail',  gradient: 'from-teal-900/20 to-accent-purple/10',   border: 'border-teal-800/20' },
  { icon: BookOpen,   label: 'Mídia Kit com IA',        desc: 'Kit profissional com perfil, métricas e voz. Exporta em PDF.',             href: '/dashboard/midia-kit',  gradient: 'from-amber-900/20 to-iara-600/10',       border: 'border-amber-800/20' },
  { icon: Mic,        label: 'Análise de Oratória',    desc: 'Grave sua voz, receba score em 5 dimensões e exercícios personalizados.',  href: '/dashboard/oratorio',   gradient: 'from-accent-purple/20 to-iara-600/10',   border: 'border-accent-purple/30' },
  { icon: TrendingUp, label: 'Métricas das Redes',     desc: 'Métricas consolidadas de todas as plataformas + análise com IA.',          href: '/dashboard/metricas',   gradient: 'from-iara-600/15 to-accent-pink/10',     border: 'border-iara-700/20' },
  { icon: Images,     label: 'Banco de Fotos',         desc: 'Salve suas fotos para usar nos geradores. Acesso rápido de qualquer módulo.', href: '/dashboard/fotos',   gradient: 'from-iara-600/15 to-teal-900/10',        border: 'border-iara-700/20' },
  { icon: Target,     label: 'Metas de Postagem',      desc: 'Organize sua agenda, crie metas e ganhe pontos que sobem seu nível.',      href: '/dashboard/metas',      gradient: 'from-green-900/20 to-iara-600/10',       border: 'border-green-800/20' },
  { icon: Calendar,   label: 'Calendário Editorial',   desc: 'Grade semanal integrada às suas metas. Marque postagens e acumule pontos.',href: '/dashboard/calendario', gradient: 'from-teal-900/20 to-iara-600/10',        border: 'border-teal-800/20' },
  { icon: User,       label: 'Meu Perfil',             desc: 'Configure seu nicho e tom de voz. A IA usa seu perfil em todos os módulos.', href: '/dashboard/perfil',  gradient: 'from-accent-purple/15 to-iara-600/10',   border: 'border-accent-purple/20' },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'Criador'

  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('pontos, nivel, nicho, voz_score_medio, treinos_voz, nome_artistico')
    .eq('user_id', user?.id ?? '')
    .single()

  const pontos = profile?.pontos ?? 0
  const nicho = profile?.nicho ?? undefined
  const badge = getBadgeInfo(pontos, nicho)
  const nome = profile?.nome_artistico?.split(' ')[0] ?? firstName

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  const perfilIncompleto = !profile?.nicho || !profile?.nome_artistico

  // Uso do mês atual (plano free)
  const mesAtual = inicioMesAtual()
  const [{ count: usoRoteiros }, { count: usoCarrossel }, { count: usoStories }, { count: usoThumbnail }] =
    await Promise.all([
      supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', user?.id ?? '').eq('tipo', 'roteiro').gte('created_at', mesAtual),
      supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', user?.id ?? '').eq('tipo', 'carrossel').gte('created_at', mesAtual),
      supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', user?.id ?? '').eq('tipo', 'stories').gte('created_at', mesAtual),
      supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', user?.id ?? '').eq('tipo', 'thumbnail').gte('created_at', mesAtual),
    ])

  const limites = LIMITES['free']
  const usoMes = [
    { label: 'Roteiros',   usado: usoRoteiros ?? 0,  limite: limites.roteiro!,   cor: 'bg-iara-500' },
    { label: 'Carrosseis', usado: usoCarrossel ?? 0, limite: limites.carrossel!, cor: 'bg-accent-pink' },
    { label: 'Stories',    usado: usoStories ?? 0,   limite: limites.stories!,   cor: 'bg-accent-purple' },
    { label: 'Thumbnails', usado: usoThumbnail ?? 0, limite: limites.thumbnail!, cor: 'bg-teal-500' },
  ]

  return (
    <div className="animate-fade-in">

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
            <h2 className="text-xs font-bold text-[#6b6b8a] uppercase tracking-widest">Uso este mês · Plano Gratuito</h2>
          </div>
          <Link href="/#planos" className="text-[10px] text-iara-400 hover:text-iara-300 transition-colors font-medium">
            Ver planos →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {usoMes.map((item) => {
            const pct = Math.min(100, Math.round((item.usado / item.limite) * 100))
            const esgotado = item.usado >= item.limite
            return (
              <div key={item.label} className={`rounded-2xl p-3.5 bg-[#0f0f1e] border ${esgotado ? 'border-red-800/40' : 'border-[#1a1a2e]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-[#9b9bb5]">{item.label}</span>
                  <span className={`text-[11px] font-bold ${esgotado ? 'text-red-400' : 'text-[#6b6b8a]'}`}>
                    {item.usado}/{item.limite}
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
            return (
              <Link key={mod.label} href={mod.href} className="block group">
                <div className={`h-full rounded-2xl p-5 border ${mod.border} bg-gradient-to-br ${mod.gradient} hover:scale-[1.01] hover:shadow-xl hover:shadow-black/30 active:scale-[0.99] transition-all duration-150`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0a0a14]/60 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-iara-400" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#3a3a5a] group-hover:text-iara-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="font-semibold text-[#f1f1f8] text-sm mb-1">{mod.label}</h3>
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
