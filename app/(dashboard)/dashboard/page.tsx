import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  FileText, TrendingUp, Sparkles, ArrowRight,
  User, Calendar, Mic, Layers, BookOpen, Image, Images, Zap,
  ChevronRight, Smartphone, Lightbulb, Briefcase, Scissors, Compass, Palette, Sun,
} from 'lucide-react'
import { UpgradeBanners } from '@/components/upgrade-banners'
import { IaraInsightsCard } from '@/components/iara-insights-card'
import { getBadgeInfo } from '@/lib/badges'
import { LIMITES, inicioMesAtual } from '@/lib/limites'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Seu painel Iara — acesse todos os módulos de IA para criadores.',
}

type ModuleEntry = {
  icon: typeof FileText
  label: string
  desc: string
  href: string
  accent: string
  highlight?: boolean
  emBreve?: boolean
}

const modules: ModuleEntry[] = [
  { icon: Lightbulb,  label: 'Faísca Criativa',     desc: 'Chat com IA que extrai o melhor de você e cospe ideias com hook pronto.',     href: '/dashboard/temas',      accent: 'from-amber-400 to-orange-600 shadow-amber-500/30', highlight: true },
  { icon: Layers,     label: 'Carrossel',           desc: 'Cole link, suba fotos e a Iara monta tudo. Editor canvas pra ajustar.',       href: '/dashboard/carrossel',  accent: 'from-indigo-500 to-violet-700 shadow-indigo-500/30' },
  { icon: FileText,   label: 'Roteiros',            desc: 'Hook, miolo e CTA no seu tom de voz — pronto pra gravar.',                    href: '/dashboard/roteiros',   accent: 'from-pink-500 to-rose-700 shadow-pink-500/30' },
  { icon: Smartphone, label: 'Stories',             desc: 'Sequência de 7 slides com hook, virada e CTA na sua voz.',                    href: '/dashboard/stories',    accent: 'from-fuchsia-500 to-purple-800 shadow-fuchsia-500/30' },
  { icon: Image,      label: 'Thumbnail',           desc: 'Capas de alto CTR para YouTube e Reels em segundos.',                          href: '/dashboard/thumbnail',  accent: 'from-teal-400 to-cyan-700 shadow-teal-500/30' },
  { icon: Mic,        label: 'Oratória',            desc: 'Grave sua voz, receba score em 5 dimensões e exercícios.',                     href: '/dashboard/oratorio',   accent: 'from-violet-500 to-indigo-800 shadow-violet-500/30' },
  { icon: TrendingUp, label: 'Métricas',            desc: 'Análise consolidada das suas redes com IA.',                                   href: '/dashboard/metricas',   accent: 'from-emerald-400 to-teal-700 shadow-emerald-500/30' },
  { icon: Compass,    label: 'Bússola',             desc: 'Direcionamento de carreira em marcos de 3 meses, missões semanais.',           href: '/dashboard/bussola',    accent: 'from-orange-400 to-red-700 shadow-orange-500/30' },
  { icon: Palette,    label: 'Brand Kit',           desc: 'Sua identidade visual extraída por IA — gera tudo alinhado.',                  href: '/dashboard/brand-kit',  accent: 'from-rose-400 to-pink-700 shadow-rose-500/30' },
  { icon: Sun,        label: 'Post do Dia',         desc: 'NOVO — toca um botão e a Iara entrega carrossel pronto (texto + imagens IA + legenda).', href: '/dashboard/post-do-dia', accent: 'from-amber-400 to-orange-600 shadow-amber-500/30', highlight: true },
  { icon: BookOpen,   label: 'Mídia Kit',           desc: 'Kit profissional com perfil, métricas e voz. Exporta em PDF.',                 href: '/dashboard/midia-kit',  accent: 'from-amber-500 to-yellow-700 shadow-amber-500/30' },
  { icon: Calendar,   label: 'Conteúdos da semana', desc: '7 dias de conteúdo com gancho, script e horário ideal.',                       href: '/dashboard/calendario', accent: 'from-cyan-400 to-blue-700 shadow-cyan-500/30' },
  { icon: Images,     label: 'Banco de Fotos',      desc: 'Salve suas fotos pra reusar nos geradores.',                                    href: '/dashboard/fotos',      accent: 'from-indigo-400 to-blue-800 shadow-indigo-500/30' },
  { icon: User,       label: 'Persona IA',          desc: 'Configure nicho, tom e plataformas — usa em todos os módulos.',               href: '/dashboard/persona',    accent: 'from-purple-400 to-fuchsia-700 shadow-purple-500/30' },
  { icon: Briefcase,  label: 'Oportunidades',       desc: 'Campanhas abertas por marcas — candidate-se e feche parcerias.',               href: '/dashboard/vagas',      accent: 'from-yellow-400 to-amber-700 shadow-yellow-500/30' },
  { icon: Scissors,   label: 'Cortes do YouTube',   desc: 'Em construção — vai pegar vídeo longo e devolver cortes pra Reels/Shorts.',    href: '/dashboard/cortes',     accent: 'from-red-400 to-rose-800 shadow-red-500/30', emBreve: true },
]

const TIPO_ACCENT: Record<string, string> = {
  carrossel: 'from-indigo-600 via-violet-600 to-pink-600',
  roteiro:   'from-pink-500 via-rose-600 to-amber-600',
  stories:   'from-fuchsia-600 via-purple-700 to-indigo-800',
  thumbnail: 'from-teal-600 via-cyan-700 to-indigo-800',
  temas:     'from-amber-500 via-orange-600 to-rose-700',
  midia_kit: 'from-amber-500 via-yellow-700 to-orange-800',
}

const TIPO_HREF: Record<string, string> = {
  carrossel: '/dashboard/carrossel',
  roteiro:   '/dashboard/roteiros',
  stories:   '/dashboard/stories',
  thumbnail: '/dashboard/thumbnail',
  temas:     '/dashboard/temas',
  midia_kit: '/dashboard/midia-kit',
}

const TIPO_LABEL: Record<string, string> = {
  carrossel: 'Carrossel',
  roteiro:   'Roteiro',
  stories:   'Stories',
  thumbnail: 'Thumbnail',
  temas:     'Tema',
  midia_kit: 'Mídia Kit',
}

function tempoRelativo(iso: string): string {
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min} min atrás`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h atrás`
  const dias = Math.floor(h / 24)
  if (dias < 7) return `${dias} dia${dias > 1 ? 's' : ''} atrás`
  return `${Math.floor(dias / 7)} sem atrás`
}

// Devolve 'YYYY-MM-DD' no fuso de São Paulo. Vercel roda em UTC, sem isso o
// "dia" do streak fica deslocado pra brasileiros.
function dataBR(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}

// Conta dias seguidos com conteúdo a partir de hoje. Aceita streak começando
// ontem (criador que ainda não postou hoje não perde imediatamente).
function calcularStreak(datasAtivas: Set<string>): number {
  const hoje = new Date()
  let cursor = new Date(hoje)
  let streak = 0
  let permitiuPularHoje = false

  for (let i = 0; i < 365; i++) {
    const k = dataBR(cursor)
    if (datasAtivas.has(k)) {
      streak++
    } else if (i === 0 && !permitiuPularHoje) {
      // ainda hoje, sem post — tolera 1 dia de gap (só na 1ª iteração)
      permitiuPularHoje = true
    } else {
      break
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}

function incentivoStreak(streak: number, criouAlgumDia: boolean): { titulo: string, frase: string } {
  if (streak === 0 && !criouAlgumDia) return { titulo: 'Bora começar', frase: 'Um post hoje vira hábito amanhã.' }
  if (streak === 0)                   return { titulo: 'Volta hoje',   frase: 'Um conteúdo agora reinicia o ritmo.' }
  if (streak === 1)                   return { titulo: 'Primeiro dia', frase: 'Posta amanhã pra começar a contar de verdade.' }
  if (streak <= 3)                    return { titulo: 'Pegando ritmo', frase: 'Mantém. Os 3 primeiros são os mais difíceis.' }
  if (streak <= 6)                    return { titulo: 'No flow',      frase: 'Falta pouco pra primeira semana inteira.' }
  if (streak === 7)                   return { titulo: 'Uma semana 🔥', frase: 'Já virou rotina. Não para agora.' }
  if (streak <= 13)                   return { titulo: 'Voando',       frase: 'Toda semana tem post. Algoritmo agradece.' }
  if (streak === 14)                  return { titulo: 'Duas semanas', frase: 'Audiência já espera por você.' }
  if (streak <= 29)                   return { titulo: 'Imparável',    frase: 'Mais consistente que a maioria dos criadores.' }
  if (streak === 30)                  return { titulo: 'UM MÊS 🚀',    frase: 'Top 1% de consistência. Olha só.' }
  if (streak < 60)                    return { titulo: 'Lendário',     frase: `${streak} dias seguidos. Isso é carreira.` }
  return                                       { titulo: 'Nível Iara',  frase: `${streak} dias. Você é referência.` }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'Criador'
  const uid = user?.id ?? ''

  const admin = createAdminClient()
  const [{ data: profile }, { data: planoRow }] = await Promise.all([
    admin
      .from('creator_profiles')
      .select('pontos, nivel, nicho, voz_score_medio, treinos_voz, nome_artistico')
      .eq('user_id', uid)
      .maybeSingle(),
    admin
      .from('creator_profiles')
      .select('plano')
      .eq('user_id', uid)
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

  const mesAtual = inicioMesAtual()
  // Streak: olhamos 30 dias atrás (cobre streaks longos sem vir do início dos tempos)
  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: usoRoteiros },
    { count: usoCarrossel },
    { count: usoStories },
    { count: usoThumbnail },
    { count: usoOratorio },
    { count: usoMidiaKit },
    { count: usoTemas },
    { data: ultimosConteudos },
    { data: criacoes30d },
    { count: criouAlgumDiaCount },
  ] = await Promise.all([
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'roteiro').gte('created_at', mesAtual),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'carrossel').gte('created_at', mesAtual),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'stories').gte('created_at', mesAtual),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'thumbnail').gte('created_at', mesAtual),
    supabase.from('voice_analyses').select('*', { count: 'exact', head: true }).eq('user_id', uid).gte('created_at', mesAtual),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'midia_kit').gte('created_at', mesAtual),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'temas').gte('created_at', mesAtual),
    supabase.from('content_history').select('id, tipo, titulo, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(3),
    supabase.from('content_history').select('created_at').eq('user_id', uid).gte('created_at', trintaDiasAtras),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid),
  ])

  // Streak — extrai datas únicas (BR timezone) das criações dos últimos 30 dias
  const datasAtivas = new Set<string>(
    (criacoes30d ?? []).map(r => dataBR(new Date(String(r.created_at))))
  )
  const streak = calcularStreak(datasAtivas)
  const criouAlgumDia = (criouAlgumDiaCount ?? 0) > 0
  const incentivo = incentivoStreak(streak, criouAlgumDia)

  // Pra dot grid 30 dias: pra cada um dos últimos 30 dias, true/false se teve atividade
  const grid30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - (29 - i))
    return datasAtivas.has(dataBR(d))
  })

  const usoTotalMes =
    (usoRoteiros ?? 0) + (usoCarrossel ?? 0) + (usoStories ?? 0) + (usoThumbnail ?? 0) +
    (usoOratorio ?? 0) + (usoMidiaKit ?? 0) + (usoTemas ?? 0)
  const isPrimeiraVez = usoTotalMes === 0

  const limites = LIMITES[planoAtual] ?? LIMITES['free']
  const isIlimitado = planoAtual === 'profissional'
  const usoMes = [
    { label: 'Temas IA',   usado: usoTemas ?? 0,     limite: limites.temas },
    { label: 'Roteiros',   usado: usoRoteiros ?? 0,  limite: limites.roteiro },
    { label: 'Carrosseis', usado: usoCarrossel ?? 0, limite: limites.carrossel },
    { label: 'Stories',    usado: usoStories ?? 0,   limite: limites.stories },
    { label: 'Thumbnails', usado: usoThumbnail ?? 0, limite: limites.thumbnail },
    { label: 'Oratória',   usado: usoOratorio ?? 0,  limite: limites.oratorio },
    { label: 'Mídia Kit',  usado: usoMidiaKit ?? 0,  limite: limites.midia_kit },
  ]

  const cotaTotal = usoMes.reduce((acc, i) => acc + (i.limite ?? 0), 0)
  const cotaUsada = usoMes.reduce((acc, i) => acc + (i.limite ? Math.min(i.usado, i.limite) : 0), 0)
  const cotaPct = cotaTotal > 0 ? Math.round((cotaUsada / cotaTotal) * 100) : 0

  const isOwner = isAdmin(user?.email)
  const recentes = ultimosConteudos ?? []

  return (
    <div className="cosmic-shell animate-fade-in">

      {/* ── Banner admin ── */}
      {isOwner && (
        <Link href="/admin/cupons" className="block mb-4">
          <div className="cosmic-glass rounded-xl px-4 py-2.5 hover:border-iara-500/40 transition-all flex items-center justify-between">
            <p className="text-xs font-semibold text-iara-300">Área Admin — Cupons de desconto</p>
            <ChevronRight className="w-4 h-4 text-iara-400" />
          </div>
        </Link>
      )}

      {/* ── Banner primeira vez ── */}
      {isPrimeiraVez && (
        <div className="cosmic-glass-strong rounded-2xl p-5 sm:p-6 mb-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-iara-500/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-12 w-48 h-48 rounded-full bg-accent-pink/20 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-iara-600/30 border border-iara-500/40 text-[10px] font-bold text-iara-200 tracking-wider uppercase mb-3">
              <Sparkles className="w-3 h-3" />
              Bem-vindo, {nome}!
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-[#f1f1f8] leading-tight mb-2">
              Seu primeiro carrossel{' '}
              <span className="font-editorial font-normal" style={{ color: '#E2C068' }}>em 2 minutos</span>
            </h2>
            <p className="text-sm text-[#c1c1d8] mb-4 max-w-xl">
              Cole um link do YouTube, suba algumas fotos e a Iara monta tudo pra você. Você pode editar tudo no Editor Canvas depois.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/carrossel"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-iara-900/40 transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }}
              >
                <Sparkles className="w-4 h-4" />
                Criar primeiro carrossel
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/temas"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#c1c1d8] cosmic-glass hover:border-iara-700/50 transition-all"
              >
                <Lightbulb className="w-4 h-4 text-iara-400" />
                Ou comece pelas ideias
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Banner perfil incompleto ── */}
      {perfilIncompleto && !isPrimeiraVez && (
        <Link href="/dashboard/perfil" className="block mb-6">
          <div className="cosmic-glass rounded-2xl p-4 hover:border-iara-500/40 transition-all duration-200 group">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-iara-600/20 border border-iara-700/30 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-iara-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#f1f1f8] truncate">Complete seu perfil</p>
                  <p className="text-xs text-[#6b6b8a] truncate">A Iara precisa te conhecer pra personalizar tudo</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-iara-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </div>
          </div>
        </Link>
      )}

      {/* ─────────────── HERO ─────────────── */}
      <section className="relative mb-10 sm:mb-14">
        <div className="absolute -top-8 left-2 sm:left-10 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-iara-500/20 blur-3xl pointer-events-none cosmic-float" />
        <div className="absolute -top-4 right-2 sm:right-20 w-40 sm:w-48 h-40 sm:h-48 rounded-full bg-accent-pink/20 blur-3xl pointer-events-none cosmic-float" style={{ animationDelay: '-3s' }} />

        <div className="relative">
          <div className="inline-flex items-center gap-2 cosmic-glass rounded-full px-3 py-1 mb-4 sm:mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 cosmic-glow-pulse" />
            <p className="text-[10px] tracking-[0.22em] uppercase font-semibold text-zinc-300">
              {usoTotalMes > 0
                ? `você criou ${usoTotalMes} conteúdo${usoTotalMes > 1 ? 's' : ''} este mês`
                : 'pronto pra começar'}
            </p>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] mb-1 sm:mb-2 text-[#f1f1f8] tracking-tight">
            {saudacao},
          </h1>
          <h1 className="font-editorial text-5xl sm:text-7xl lg:text-8xl leading-[0.9] mb-5 cosmic-text-gradient pr-1">
            {nome}.
          </h1>

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <p className="text-sm sm:text-base lg:text-lg text-[#9b9bb5] max-w-xl leading-relaxed">
              {usoTotalMes >= 10
                ? <>Você está em ritmo <span className="text-white font-semibold">acelerado</span> esse mês. <span className="font-editorial text-amber-300">Bora manter.</span></>
                : usoTotalMes > 0
                  ? <>O ritmo tá <span className="font-editorial text-amber-300">tomando forma</span>. Que tal mais um hoje?</>
                  : <>O que vamos criar <span className="font-editorial text-amber-300">hoje</span>?</>}
            </p>
            <Link
              href="/dashboard/perfil"
              className="ml-auto cosmic-glass cosmic-card rounded-2xl px-3 py-2 flex items-center gap-3 group flex-shrink-0"
            >
              <div className={`w-9 h-9 rounded-xl ${badge.cor.bg} border ${badge.cor.border} flex items-center justify-center text-xl flex-shrink-0`}>
                {badge.cor.emoji}
              </div>
              <div className="hidden sm:block">
                <p className={`text-xs font-bold ${badge.cor.text}`}>{badge.badge}</p>
                <p className="text-[10px] text-[#6b6b8a]">{badge.pontos} pts</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────── STATS ORBITS ─────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-12">

        <div className="cosmic-glass-strong cosmic-card rounded-3xl p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-iara-500/30 blur-3xl pointer-events-none" />
          <p className="text-[10px] tracking-[0.18em] uppercase text-iara-300 font-semibold mb-3">conteúdos · este mês</p>
          <p className="text-5xl sm:text-6xl font-bold leading-none mb-3 bg-gradient-to-br from-white to-iara-300 bg-clip-text text-transparent tabular">
            {usoTotalMes}
          </p>
          <div className="flex items-end gap-1 h-10 mt-2">
            {[ usoTemas, usoRoteiros, usoCarrossel, usoStories, usoThumbnail, usoOratorio, usoMidiaKit ].map((n, i) => {
              const v = n ?? 0
              const max = Math.max(1, usoTotalMes)
              const pct = (v / max) * 100
              return (
                <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-iara-500/40 to-iara-400" style={{ height: `${Math.max(8, pct)}%` }} />
              )
            })}
          </div>
        </div>

        <div className="cosmic-glass-strong cosmic-card rounded-3xl p-5 sm:p-6 relative overflow-hidden">
          <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none ${streak >= 7 ? 'bg-orange-500/35' : 'bg-accent-pink/25'}`} />
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] tracking-[0.18em] uppercase text-pink-300 font-semibold">streak · dias seguidos</p>
            {streak >= 3 && <span className="text-base">{streak >= 30 ? '🚀' : streak >= 14 ? '⚡' : streak >= 7 ? '🔥' : '✨'}</span>}
          </div>
          <div className="flex items-end gap-2 mb-3">
            <p className={`text-5xl sm:text-6xl font-bold leading-none bg-clip-text text-transparent tabular ${streak >= 7 ? 'bg-gradient-to-br from-white to-orange-300' : 'bg-gradient-to-br from-white to-pink-300'}`}>
              {streak}
            </p>
            <p className="text-sm text-[#6b6b8a] mb-2">{streak === 1 ? 'dia' : 'dias'}</p>
          </div>

          {/* Dot grid últimos 30 dias */}
          <div className="grid gap-[3px] mb-3" style={{ gridTemplateColumns: 'repeat(15, 1fr)' }}>
            {grid30.map((ativo, i) => {
              const intensidade = ativo
                ? i < 7  ? 'bg-iara-600/40'
                : i < 14 ? 'bg-iara-500/60'
                : i < 21 ? 'bg-violet-400/80'
                : i < 27 ? 'bg-pink-400'
                :          'bg-pink-400 cosmic-glow-pulse'
                : 'bg-white/5'
              return <span key={i} className={`aspect-square rounded-sm ${intensidade}`} />
            })}
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className={`text-[11px] font-semibold ${streak >= 7 ? 'text-orange-300' : 'text-pink-300'}`}>{incentivo.titulo}</p>
            <p className="text-[10px] text-[#9b9bb5] truncate text-right">{incentivo.frase}</p>
          </div>
        </div>

        {!isIlimitado ? (
          <div className="cosmic-glass-strong cosmic-card rounded-3xl p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/25 blur-3xl pointer-events-none" />
            <p className="text-[10px] tracking-[0.18em] uppercase text-amber-300 font-semibold mb-3">cota · plano {PLANO_LABEL[planoAtual]}</p>
            <div className="flex items-end gap-3 mb-3">
              <p className="text-5xl sm:text-6xl font-bold leading-none bg-gradient-to-br from-white to-amber-300 bg-clip-text text-transparent tabular">{cotaPct}%</p>
            </div>
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${cotaPct >= 90 ? 'bg-rose-500' : cotaPct >= 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
                  style={{ width: `${cotaPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-[#9b9bb5]">{cotaUsada}/{cotaTotal} usados</p>
                <Link href="/conta" className="text-[10px] text-iara-400 hover:text-iara-300 font-semibold">gerenciar →</Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="cosmic-glass-strong cosmic-card rounded-3xl p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-400/30 blur-3xl pointer-events-none" />
            <p className="text-[10px] tracking-[0.18em] uppercase text-emerald-300 font-semibold mb-3">plano profissional</p>
            <p className="text-3xl sm:text-4xl font-bold leading-tight mb-3 bg-gradient-to-br from-white to-emerald-300 bg-clip-text text-transparent">
              Ilimitado<span className="font-editorial">.</span>
            </p>
            <p className="text-[12px] text-[#9b9bb5] leading-relaxed">Crie sem se preocupar com cota. Você está no topo.</p>
          </div>
        )}

      </section>

      {/* ─────────────── CONTINUE + FAÍSCA ─────────────── */}
      <section className={`grid gap-4 mb-8 sm:mb-12 ${recentes.length > 0 ? 'lg:grid-cols-[1.6fr_1fr]' : 'grid-cols-1'}`}>

        {recentes.length > 0 && (
          <div className="cosmic-glass-strong rounded-3xl p-5 sm:p-7 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] tracking-[0.18em] uppercase font-semibold text-zinc-400 mb-1">Em órbita</p>
                  <h2 className="text-lg sm:text-xl font-bold text-[#f1f1f8]">Continue de onde parou</h2>
                </div>
                <Link href="/dashboard/historico" className="text-[12px] text-pink-300 hover:text-pink-200 font-medium flex-shrink-0">
                  Galeria →
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {recentes.map((c) => {
                  const tipo = String(c.tipo)
                  const accent = TIPO_ACCENT[tipo] ?? 'from-iara-600 to-violet-700'
                  const href = TIPO_HREF[tipo] ?? '/dashboard/historico'
                  const tipoLabel = TIPO_LABEL[tipo] ?? tipo
                  return (
                    <Link key={String(c.id)} href={href} className="cosmic-card block rounded-xl sm:rounded-2xl overflow-hidden cosmic-glass">
                      <div className={`aspect-[3/4] bg-gradient-to-br ${accent} p-2.5 sm:p-3 flex flex-col justify-end relative`}>
                        <p className="font-bold text-[11px] sm:text-xs leading-tight text-white line-clamp-3">{c.titulo}</p>
                        <p className="text-[9px] sm:text-[10px] text-white/70 mt-1 uppercase tracking-wider">{tipoLabel}</p>
                      </div>
                      <div className="p-2 sm:p-2.5 bg-white/[0.03]">
                        <p className="text-[9px] sm:text-[10px] text-zinc-500">{tempoRelativo(String(c.created_at))}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <Link href="/dashboard/temas" className="cosmic-glass-strong cosmic-card rounded-3xl p-5 sm:p-6 relative overflow-hidden flex flex-col group">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-accent-pink/15 blur-3xl pointer-events-none" />

          <div className="relative flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <Sparkles className="w-5 h-5 text-amber-300 relative z-10" />
                <div className="absolute inset-0 bg-amber-400/60 blur-md cosmic-glow-pulse" />
              </div>
              <p className="text-[10px] tracking-[0.18em] uppercase font-semibold text-amber-300">Faísca Criativa</p>
            </div>

            <h3 className="font-bold text-2xl sm:text-3xl leading-tight mb-3 text-[#f1f1f8]">
              Achei <span className="font-editorial text-amber-300">5 ideias</span> esperando você hoje.
            </h3>

            <p className="text-sm text-[#9b9bb5] leading-relaxed mb-5">
              Geradas a partir do seu nicho, do seu tom e do que está em alta agora. Hook pronto, ângulo definido — só dar play.
            </p>
          </div>

          <div className="relative inline-flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-pink-900/40 transition-all group-hover:scale-[1.01]"
               style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }}>
            <span>Ver as ideias</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>

      </section>

      {/* ── Iara Insights ── */}
      <IaraInsightsCard />

      {/* ─────────────── USO DETALHADO ─────────────── */}
      {!isIlimitado && (
        <section className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Zap className="w-3.5 h-3.5 text-iara-400 flex-shrink-0" />
              <h2 className="text-xs font-bold text-[#9b9bb5] uppercase tracking-widest truncate">
                Uso detalhado · Plano {PLANO_LABEL[planoAtual]}
              </h2>
            </div>
            <Link
              href="/conta"
              className="cosmic-glass rounded-lg px-3 min-h-9 flex items-center gap-1.5 text-iara-300 text-xs font-semibold hover:border-iara-500/40 transition-all flex-shrink-0"
            >
              Conta
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-2.5">
            {usoMes.map((item) => {
              const limite = item.limite ?? 0
              const pct = limite > 0 ? Math.min(100, Math.round((item.usado / limite) * 100)) : 0
              const esgotado = limite > 0 && item.usado >= limite
              return (
                <div key={item.label} className={`cosmic-glass rounded-2xl p-3 ${esgotado ? '!border-rose-700/40' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] sm:text-[11px] font-medium text-[#9b9bb5] truncate">{item.label}</span>
                    <span className={`text-[10px] sm:text-[11px] font-bold tabular ${esgotado ? 'text-rose-400' : 'text-[#6b6b8a]'}`}>
                      {item.usado}/{item.limite ?? '∞'}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${esgotado ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-iara-500 to-accent-purple'}`}
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
        </section>
      )}

      {/* ─────────────── MÓDULOS — CONSTELAÇÃO ─────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-5 sm:mb-6 gap-3">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.18em] uppercase font-semibold text-zinc-400 mb-1">Constelação</p>
            <h2 className="text-xl sm:text-2xl font-bold text-[#f1f1f8] truncate">Por onde criar agora</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {modules.map((mod) => {
            const Icon = mod.icon
            return (
              <Link
                key={mod.label}
                href={mod.href}
                className={`cosmic-glass cosmic-card rounded-2xl p-4 sm:p-5 group relative overflow-hidden ${mod.emBreve ? 'opacity-70' : ''}`}
              >
                {mod.highlight && !mod.emBreve && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 rounded-bl-xl text-[9px] font-bold text-amber-300 bg-amber-900/40 border-b border-l border-amber-700/40">
                    DESTAQUE
                  </div>
                )}
                {mod.emBreve && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 rounded-bl-xl text-[9px] font-black text-[#0a0a14] bg-gradient-to-r from-amber-500 to-orange-500 tracking-widest uppercase">
                    Em breve
                  </div>
                )}
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${mod.accent} flex items-center justify-center mb-3 sm:mb-4 shadow-lg`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="font-bold text-sm sm:text-base leading-tight mb-1 text-[#f1f1f8]">{mod.label}</p>
                <p className="text-[11px] sm:text-[12px] text-zinc-400 leading-snug line-clamp-2">{mod.desc}</p>
              </Link>
            )
          })}
        </div>
      </section>

    </div>
  )
}
