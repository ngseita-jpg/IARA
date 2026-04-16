import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Sparkles, FileText, Mic, Target, Calendar,
  TrendingUp, User, ArrowRight, Check, ChevronRight,
  Zap, Shield, Star, Layers,
} from 'lucide-react'

// ─── dados estáticos ──────────────────────────────────────────────────────────

const features = [
  {
    icon: FileText,
    title: 'Gerador de Roteiros',
    description: '6 formatos de conteúdo com hook, desenvolvimento e CTA no seu tom de voz. Roteiros que parecem escritos por você.',
    color: 'from-iara-600/20 to-accent-purple/10',
    border: 'border-iara-700/20',
    tag: 'text-iara-400',
  },
  {
    icon: TrendingUp,
    title: 'Análise de Métricas',
    description: 'Instagram, YouTube, TikTok e mais em um lugar. Métricas consolidadas + diagnóstico estratégico personalizado da IA.',
    color: 'from-accent-pink/15 to-iara-600/10',
    border: 'border-accent-pink/20',
    tag: 'text-accent-pink',
  },
  {
    icon: Mic,
    title: 'Análise de Oratória',
    description: 'Grave sua voz e receba score em 5 dimensões: confiança, energia, fluidez, emoção e clareza. Com exercícios práticos.',
    color: 'from-accent-purple/20 to-iara-600/10',
    border: 'border-accent-purple/30',
    tag: 'text-accent-purple',
  },
  {
    icon: Target,
    title: 'Metas de Postagem',
    description: 'Crie metas, acompanhe progresso e ganhe pontos que constroem sua reputação na plataforma. Suba de nível.',
    color: 'from-green-900/20 to-iara-600/10',
    border: 'border-green-800/20',
    tag: 'text-green-400',
  },
  {
    icon: Calendar,
    title: 'Calendário Editorial',
    description: 'Grade semanal integrada às suas metas. Planeje, execute e marque como feito — tudo em um lugar.',
    color: 'from-teal-900/20 to-iara-600/10',
    border: 'border-teal-800/20',
    tag: 'text-teal-400',
  },
  {
    icon: Layers,
    title: 'Gerador de Stories',
    description: 'Sequência de 7 slides com hook, virada e CTA — personalizados para o seu estilo e nicho. Pronto pra postar.',
    color: 'from-accent-pink/15 to-accent-purple/10',
    border: 'border-accent-pink/20',
    tag: 'text-accent-pink',
  },
  {
    icon: User,
    title: 'Perfil Inteligente',
    description: 'Configure seu nicho, tom de voz e estilo. A IA usa seu perfil para personalizar absolutamente tudo.',
    color: 'from-iara-600/15 to-accent-purple/10',
    border: 'border-iara-700/20',
    tag: 'text-iara-400',
  },
]

const steps = [
  {
    num: '01',
    title: 'Configure seu perfil',
    desc: 'Informe seu nicho, tom de voz e plataformas. A Iara aprende quem você é — e fala do seu jeito.',
  },
  {
    num: '02',
    title: 'Grave sua voz',
    desc: 'A análise de oratória cria seu perfil vocal. A partir daí, cada roteiro e sugestão soa como você.',
  },
  {
    num: '03',
    title: 'Crie, publique, cresça',
    desc: 'Roteiros, calendário, métricas e metas em um loop contínuo. Você foca no que importa: criar.',
  },
]

const plans = [
  {
    name: 'Free',
    price: 'R$0',
    period: '',
    desc: 'Para começar a explorar',
    cta: 'Começar grátis',
    ctaStyle: 'border border-iara-700/40 text-iara-300 hover:bg-iara-900/30',
    highlight: false,
    items: [
      '3 roteiros por mês',
      '1 análise de oratória',
      'Calendário editorial',
      'Metas básicas',
      'Perfil do criador',
    ],
  },
  {
    name: 'Lifestyle',
    price: 'R$67',
    priceOriginal: 'R$97',
    period: '/mês',
    desc: 'Para criadores em crescimento',
    cta: 'Assinar agora',
    ctaStyle: 'bg-gradient-to-r from-iara-600 to-accent-purple text-white hover:opacity-90',
    highlight: true,
    badge: 'Lançamento',
    items: [
      '10 roteiros por mês',
      'Análise de métricas (3 redes)',
      'Análises de oratória ilimitadas',
      'Calendário + metas avançadas',
      'Perfil visível para marcas',
      'Candidatura a vagas de recebidos',
    ],
  },
  {
    name: 'Creator',
    price: 'R$147',
    priceOriginal: 'R$217',
    period: '/mês',
    desc: 'Para quem vive de conteúdo',
    cta: 'Assinar agora',
    ctaStyle: 'border border-iara-700/40 text-iara-300 hover:bg-iara-900/30',
    highlight: false,
    badge: 'Lançamento',
    items: [
      'Roteiros ilimitados',
      'Análise de métricas (todas as redes)',
      'Score de oratória avançado',
      'Candidatura a vagas pagas',
      'Badge verificado no perfil',
      'Prioridade no match com marcas',
    ],
  },
]

const testimonials = [
  {
    quote: 'Eu gastava 3 horas por semana pensando em pauta. Agora em 10 minutos tenho roteiro, calendário e estratégia prontos.',
    name: 'Ana Luíza M.',
    role: 'Criadora de lifestyle · 85K seguidores',
    emoji: '✨',
  },
  {
    quote: 'A análise de oratória me mostrou que eu falava rápido demais. Depois dos exercícios meus vídeos subiram 40% em retenção.',
    name: 'Rafael T.',
    role: 'Creator de fitness · 200K seguidores',
    emoji: '🎙️',
  },
  {
    quote: 'O nível de personalização é absurdo. Cada roteiro parece que eu mesmo escrevi — não parece IA.',
    name: 'Juliana P.',
    role: 'Empreendedora digital · 45K seguidores',
    emoji: '🚀',
  },
]

// ─── componentes ──────────────────────────────────────────────────────────────

function LandingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a14]/80 backdrop-blur-md border-b border-iara-900/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center shadow-lg shadow-iara-900/50">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold iara-gradient-text">Iara</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-[#9b9bb5]">
          <a href="#funcionalidades" className="hover:text-[#f1f1f8] transition-colors">Funcionalidades</a>
          <a href="#como-funciona" className="hover:text-[#f1f1f8] transition-colors">Como funciona</a>
          <a href="#planos" className="hover:text-[#f1f1f8] transition-colors">Planos</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#9b9bb5] hover:text-[#f1f1f8] transition-colors hidden sm:block">
            Entrar
          </Link>
          <Link
            href="/register"
            className="iara-btn-primary text-sm px-4 py-2"
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  )
}

// ─── página ───────────────────────────────────────────────────────────────────

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      <LandingNav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 overflow-hidden">
        {/* glow de fundo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-iara-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-accent-purple/8 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* pill badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-iara-700/40 bg-iara-900/30 text-iara-400 text-xs font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Assessoria com IA para criadores brasileiros
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#f1f1f8] leading-[1.1] mb-6">
            Imagine acordar sabendo{' '}
            <span className="iara-gradient-text">exatamente o que criar,</span>
            <br className="hidden sm:block" />
            {' '}postar e conquistar hoje.
          </h1>

          <p className="text-lg text-[#9b9bb5] max-w-2xl mx-auto mb-10 leading-relaxed">
            A Iara é sua assessora de comunicação com IA. Roteiros no seu tom de voz, análise de métricas, oratória e calendário editorial — tudo personalizado para o seu nicho.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="iara-btn-primary text-base px-7 py-3.5 w-full sm:w-auto">
              Começar grátis <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#funcionalidades" className="iara-btn-secondary text-base px-7 py-3.5 w-full sm:w-auto">
              Ver funcionalidades
            </a>
          </div>

          <p className="mt-5 text-xs text-[#5a5a7a]">
            Sem cartão de crédito · Plano gratuito para sempre
          </p>
        </div>

        {/* dashboard mockup */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="relative rounded-2xl border border-iara-700/20 bg-[#13131f] overflow-hidden shadow-2xl shadow-black/60">
            {/* barra de título fake */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#0d0d1a] border-b border-[#1a1a2e]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 h-5 mx-4 rounded bg-[#1a1a2e] flex items-center px-3">
                <span className="text-xs text-[#5a5a7a]">app.iara.ai/dashboard</span>
              </div>
            </div>

            {/* conteúdo mockup */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* sidebar mock */}
              <div className="hidden md:flex flex-col gap-2">
                {['Dashboard', 'Roteiros', 'Métricas', 'Calendário', 'Metas', 'Oratória'].map((item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs ${
                      i === 0
                        ? 'bg-iara-600/20 text-iara-300 border border-iara-600/20'
                        : 'text-[#5a5a7a]'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded ${i === 0 ? 'bg-iara-500' : 'bg-[#1a1a2e]'}`} />
                    {item}
                  </div>
                ))}
              </div>

              {/* conteúdo principal mock */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-5 w-40 rounded bg-gradient-to-r from-iara-700/40 to-accent-purple/20 mb-1.5" />
                    <div className="h-3 w-28 rounded bg-[#1a1a2e]" />
                  </div>
                  <div className="w-28 h-10 rounded-xl bg-iara-600/20 border border-iara-700/20" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Pontos', val: '2.840' },
                    { label: 'Seguidores', val: '127K' },
                    { label: 'Engajamento', val: '4.2%' },
                    { label: 'Score voz', val: '87/100' },
                  ].map((s) => (
                    <div key={s.label} className="bg-[#0d0d1a] rounded-xl p-3 text-center">
                      <p className="text-base font-bold iara-gradient-text">{s.val}</p>
                      <p className="text-[10px] text-[#5a5a7a] mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {features.slice(0, 3).map((f) => {
                    const Icon = f.icon
                    return (
                      <div key={f.title} className={`rounded-xl p-3 bg-gradient-to-br ${f.color} border ${f.border}`}>
                        <Icon className={`w-4 h-4 ${f.tag} mb-1.5`} />
                        <p className="text-[10px] font-medium text-[#c4c4d8]">{f.title}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* sombra/glow abaixo */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-iara-600/10 blur-[40px] rounded-full" />
        </div>
      </section>

      {/* ── FUNCIONALIDADES ───────────────────────────────────────────────── */}
      <section id="funcionalidades" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-iara-400 text-sm font-semibold uppercase tracking-wider mb-3">Tudo que você precisa</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#f1f1f8] mb-4">
              6 módulos. Um único objetivo:{' '}
              <span className="iara-gradient-text">seu crescimento.</span>
            </h2>
            <p className="text-[#9b9bb5] max-w-xl mx-auto">
              Cada módulo foi construído para que a IA conheça você cada vez melhor — e entregue resultados cada vez mais precisos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className={`iara-card p-6 border ${f.border} bg-gradient-to-br ${f.color} hover:scale-[1.02] transition-all duration-300`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0a0a14]/60 flex items-center justify-center mb-4">
                    <Icon className={`w-5 h-5 ${f.tag}`} />
                  </div>
                  <h3 className="font-semibold text-[#f1f1f8] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#9b9bb5] leading-relaxed">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6 bg-[#0d0d1a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-iara-400 text-sm font-semibold uppercase tracking-wider mb-3">Simples assim</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#f1f1f8]">
              Do zero ao seu{' '}
              <span className="iara-gradient-text">assessor pessoal de IA</span>
              {' '}em minutos.
            </h2>
          </div>

          <div className="relative">
            {/* linha conectora */}
            <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-iara-600/40 via-accent-purple/30 to-transparent hidden md:block" />

            <div className="space-y-8">
              {steps.map((step) => (
                <div key={step.num} className="flex gap-6 items-start">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-iara-600/20 to-accent-purple/10 border border-iara-700/30 flex items-center justify-center flex-shrink-0 relative z-10">
                    <span className="text-xl font-bold iara-gradient-text">{step.num}</span>
                  </div>
                  <div className="pt-3">
                    <h3 className="text-lg font-semibold text-[#f1f1f8] mb-1">{step.title}</h3>
                    <p className="text-[#9b9bb5] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-iara-400 text-sm font-semibold uppercase tracking-wider mb-3">Resultados reais</p>
            <h2 className="text-3xl font-bold text-[#f1f1f8]">
              Criadores que já{' '}
              <span className="iara-gradient-text">mudaram a rotina</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="iara-card p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-[#c4c4d8] leading-relaxed mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-iara-600/30 to-accent-purple/20 border border-iara-700/30 flex items-center justify-center text-lg">
                    {t.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#f1f1f8]">{t.name}</p>
                    <p className="text-xs text-[#5a5a7a]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ────────────────────────────────────────────────────────── */}
      <section id="planos" className="py-24 px-4 sm:px-6 bg-[#0d0d1a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-iara-400 text-sm font-semibold uppercase tracking-wider mb-3">Preços</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#f1f1f8] mb-4">
              Comece de graça.{' '}
              <span className="iara-gradient-text">Cresça quando quiser.</span>
            </h2>
            <p className="text-[#9b9bb5]">Todos os planos incluem acesso imediato. Cancele quando quiser.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`iara-card p-6 relative ${
                  plan.highlight
                    ? 'border-iara-600/40 ring-1 ring-iara-600/30 shadow-xl shadow-iara-900/30'
                    : 'border-[#1a1a2e]'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-iara-600 to-accent-purple text-white text-xs font-bold">
                      Mais popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-[#f1f1f8]">{plan.name}</p>
                    {plan.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-iara-900/50 text-iara-400 border border-iara-700/30">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5a5a7a] mb-3">{plan.desc}</p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-3xl font-bold text-[#f1f1f8]">{plan.price}</span>
                    {plan.period && <span className="text-[#9b9bb5] text-sm pb-0.5">{plan.period}</span>}
                    {plan.priceOriginal && (
                      <span className="text-[#5a5a7a] text-sm line-through pb-0.5">{plan.priceOriginal}</span>
                    )}
                  </div>
                </div>

                <Link
                  href="/register"
                  className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-semibold transition-all mb-5 ${plan.ctaStyle}`}
                >
                  {plan.cta} <ChevronRight className="w-4 h-4" />
                </Link>

                <ul className="space-y-2.5">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[#9b9bb5]">
                      <Check className="w-4 h-4 text-iara-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-[#5a5a7a] mt-8">
            Precisa de um plano para marcas ou agências?{' '}
            <Link href="/register" className="text-iara-400 hover:underline">
              Entre em contato
            </Link>
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="iara-card p-10 sm:p-14 text-center border-iara-700/20 relative overflow-hidden">
            {/* glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-iara-600/10 via-transparent to-accent-purple/10 pointer-events-none" />

            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-iara-600/30 to-accent-purple/20 border border-iara-700/30 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-6 h-6 text-iara-400" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-[#f1f1f8] mb-4">
                Sua próxima fase como criador{' '}
                <span className="iara-gradient-text">começa agora.</span>
              </h2>
              <p className="text-[#9b9bb5] mb-8 max-w-md mx-auto">
                Junte-se aos criadores que já têm uma IA trabalhando por eles todos os dias.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/register" className="iara-btn-primary text-base px-8 py-3.5 w-full sm:w-auto">
                  Criar conta grátis <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="text-sm text-[#9b9bb5] hover:text-[#f1f1f8] transition-colors">
                  Já tenho conta →
                </Link>
              </div>

              <div className="flex items-center justify-center gap-6 mt-8 text-xs text-[#5a5a7a]">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Dados seguros</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Sem cartão de crédito</span>
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Acesso imediato</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1a1a2e] py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold iara-gradient-text">Iara</span>
          </div>

          <p className="text-xs text-[#5a5a7a] text-center">
            © {new Date().getFullYear()} Iara. Feito no Brasil 🇧🇷 para criadores brasileiros.
          </p>

          <div className="flex items-center gap-5 text-xs text-[#5a5a7a]">
            <Link href="/login" className="hover:text-[#9b9bb5] transition-colors">Entrar</Link>
            <Link href="/register" className="hover:text-[#9b9bb5] transition-colors">Cadastrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
