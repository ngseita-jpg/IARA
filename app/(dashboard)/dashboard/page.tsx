import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  FileText, Sparkles, TrendingUp, ArrowRight,
  User, Calendar, Mic, Target, Layers, BookOpen, Image,
} from 'lucide-react'
import { getBadgeInfo } from '@/lib/badges'

const modules = [
  {
    icon: FileText,
    label: 'Gerador de Roteiros',
    description: 'Roteiros completos com hook, desenvolvimento e CTA no seu estilo. 6 formatos + 4 hooks alternativos.',
    href: '/dashboard/roteiros',
    gradient: 'from-iara-600/20 to-accent-purple/10',
    border: 'border-iara-700/30',
    badge: 'Disponível',
    badgeColor: 'bg-iara-900/50 text-iara-400 border-iara-700/40',
  },
  {
    icon: Mic,
    label: 'Análise de Oratória',
    description: 'Grave sua voz, receba score em 5 dimensões e exercícios personalizados. Sua voz entra no seu perfil.',
    href: '/dashboard/oratorio',
    gradient: 'from-accent-purple/20 to-iara-600/10',
    border: 'border-accent-purple/30',
    badge: 'Disponível',
    badgeColor: 'bg-iara-900/50 text-iara-400 border-iara-700/40',
  },
  {
    icon: Target,
    label: 'Metas de Postagem',
    description: 'Organize sua agenda, crie metas de postagem e ganhe pontos que sobem seu nível de influenciador.',
    href: '/dashboard/metas',
    gradient: 'from-green-900/20 to-iara-600/10',
    border: 'border-green-800/20',
    badge: 'Disponível',
    badgeColor: 'bg-iara-900/50 text-iara-400 border-iara-700/40',
  },
  {
    icon: User,
    label: 'Meu Perfil',
    description: 'Configure seu nicho, tom de voz e estilo. A IA usa seu perfil para personalizar todos os módulos.',
    href: '/dashboard/perfil',
    gradient: 'from-accent-purple/15 to-iara-600/10',
    border: 'border-accent-purple/20',
    badge: 'Disponível',
    badgeColor: 'bg-iara-900/50 text-iara-400 border-iara-700/40',
  },
  {
    icon: Layers,
    label: 'Gerador de Carrossel',
    description: 'Cole um link, texto ou vídeo e a Iara monta o carrossel completo com imagens, texto e paleta. Chat de ajustes incluso.',
    href: '/dashboard/carrossel',
    gradient: 'from-accent-pink/15 to-accent-purple/10',
    border: 'border-accent-pink/20',
    badge: 'Disponível',
    badgeColor: 'bg-iara-900/50 text-iara-400 border-iara-700/40',
  },
  {
    icon: Image,
    label: 'Gerador de Thumbnail',
    description: 'Thumbnails de alto CTR para YouTube e Reels. Sobe a foto, descreve o vídeo — a Iara cria em segundos.',
    href: '/dashboard/thumbnail',
    gradient: 'from-teal-900/20 to-accent-purple/10',
    border: 'border-teal-800/20',
    badge: 'Disponível',
    badgeColor: 'bg-iara-900/50 text-iara-400 border-iara-700/40',
  },
  {
    icon: Layers,
    label: 'Gerador de Stories',
    description: 'Sequência de 7 slides com hook, conteúdo, virada e CTA no seu tom de voz. Pronto pra postar.',
    href: '/dashboard/stories',
    gradient: 'from-accent-pink/15 to-accent-purple/10',
    border: 'border-accent-pink/20',
    badge: 'Disponível',
    badgeColor: 'bg-iara-900/50 text-iara-400 border-iara-700/40',
  },
  {
    icon: Calendar,
    label: 'Calendário Editorial',
    description: 'Grade semanal integrada às suas metas. Marque postagens como feitas e acumule pontos.',
    href: '/dashboard/calendario',
    gradient: 'from-teal-900/20 to-iara-600/10',
    border: 'border-teal-800/20',
    badge: 'Disponível',
    badgeColor: 'bg-iara-900/50 text-iara-400 border-iara-700/40',
  },
  {
    icon: BookOpen,
    label: 'Mídia Kit com IA',
    description: 'A IA monta seu kit profissional com perfil, métricas e voz. Exporta em PDF para enviar para marcas.',
    href: '/dashboard/midia-kit',
    gradient: 'from-amber-900/20 to-iara-600/10',
    border: 'border-amber-800/20',
    badge: 'Disponível',
    badgeColor: 'bg-iara-900/50 text-iara-400 border-iara-700/40',
  },
  {
    icon: TrendingUp,
    label: 'Métricas das Redes',
    description: 'Métricas consolidadas de todas as plataformas + análise estratégica personalizada com IA. O diferencial da Iara.',
    href: '/dashboard/metricas',
    gradient: 'from-iara-600/15 to-accent-pink/10',
    border: 'border-iara-700/20',
    badge: 'Disponível',
    badgeColor: 'bg-iara-900/50 text-iara-400 border-iara-700/40',
  },
]

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'Criador'

  // Buscar pontos e perfil do usuário
  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('pontos, nivel, nicho, voz_score_medio, treinos_voz')
    .eq('user_id', user?.id ?? '')
    .single()

  const pontos = profile?.pontos ?? 0
  const nicho = profile?.nicho ?? undefined
  const badge = getBadgeInfo(pontos, nicho)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-iara-400 text-sm font-medium mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Bem-vindo de volta</span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#f1f1f8]">
              Olá, <span className="iara-gradient-text">{firstName}</span> 👋
            </h1>
            <p className="mt-2 text-[#9b9bb5]">O que vamos criar hoje?</p>
          </div>

          {/* Badge do nível */}
          <Link href="/dashboard/perfil" className="flex items-center gap-3 iara-card px-4 py-3 hover:scale-[1.02] transition-all duration-200">
            <div className={`w-10 h-10 rounded-xl ${badge.cor.bg} border ${badge.cor.border} flex items-center justify-center text-xl`}>
              {badge.cor.emoji}
            </div>
            <div>
              <p className={`text-sm font-bold ${badge.cor.text}`}>{badge.badge}</p>
              <p className="text-xs text-[#5a5a7a]">{badge.pontos} pts</p>
              {badge.nextThreshold && (
                <div className="h-1 w-24 rounded-full bg-[#1a1a2e] mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${badge.cor.bg.replace('/30', '')}`}
                    style={{ width: `${badge.progress}%` }}
                  />
                </div>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Modules grid */}
      <div>
        <h2 className="text-lg font-semibold text-[#f1f1f8] mb-4">Módulos da plataforma</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon
            const isAvailable = mod.href !== '#'

            const card = (
              <div
                className={`iara-card p-6 border ${mod.border} bg-gradient-to-br ${mod.gradient}
                            transition-all duration-300 h-full
                            ${isAvailable ? 'hover:scale-[1.02] hover:shadow-xl hover:shadow-iara-900/30 cursor-pointer' : 'opacity-60'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0a0a14]/60 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-iara-400" />
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${mod.badgeColor}`}>
                    {mod.badge}
                  </span>
                </div>
                <h3 className="font-semibold text-[#f1f1f8] mb-2">{mod.label}</h3>
                <p className="text-sm text-[#9b9bb5] leading-relaxed">{mod.description}</p>
                {isAvailable && (
                  <div className="flex items-center gap-1.5 mt-4 text-iara-400 text-sm font-medium">
                    Acessar <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            )

            return isAvailable ? (
              <Link key={mod.label} href={mod.href} className="block h-full">
                {card}
              </Link>
            ) : (
              <div key={mod.label}>{card}</div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
