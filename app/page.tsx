import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Sparkles, FileText, Mic, Target, Calendar,
  TrendingUp, User, ArrowRight, Check, ChevronRight,
  Zap, Shield, Star, Layers, Image, Images, BookOpen,
} from 'lucide-react'
import { PricingSection } from '@/components/pricing-section'

const modules = [
  {
    icon: FileText,
    title: 'Gerador de Roteiros',
    desc: 'Roteiros completos com hook, desenvolvimento e CTA em 6 formatos. No seu tom de voz, para o seu nicho.',
    color: 'from-iara-600/20 to-accent-purple/10',
    border: 'border-iara-700/20',
    tag: 'text-iara-400',
  },
  {
    icon: Layers,
    title: 'Gerador de Carrossel',
    desc: 'Cole um link ou vídeo do YouTube — a Iara monta slides completos com paleta, layout e chat de ajustes.',
    color: 'from-accent-pink/15 to-accent-purple/10',
    border: 'border-accent-pink/20',
    tag: 'text-accent-pink',
  },
  {
    icon: Image,
    title: 'Gerador de Thumbnail',
    desc: 'Thumbnails de alto CTR renderizadas em PNG 1280×720. Estratégia de composição explicada pela IA.',
    color: 'from-accent-purple/20 to-iara-600/10',
    border: 'border-accent-purple/30',
    tag: 'text-accent-purple',
  },
  {
    icon: Layers,
    title: 'Gerador de Stories',
    desc: 'Sequência de 7 slides com hook, virada e CTA personalizados para o seu estilo. Pronto para postar.',
    color: 'from-accent-pink/15 to-iara-600/10',
    border: 'border-accent-pink/20',
    tag: 'text-accent-pink',
  },
  {
    icon: Mic,
    title: 'Análise de Oratória',
    desc: 'Grave sua voz e receba score em 5 dimensões: confiança, energia, fluidez, emoção e clareza.',
    color: 'from-accent-purple/20 to-iara-600/10',
    border: 'border-accent-purple/30',
    tag: 'text-accent-purple',
  },
  {
    icon: BookOpen,
    title: 'Mídia Kit com IA',
    desc: 'Kit profissional gerado automaticamente com perfil, métricas e voz. Exporta em PDF para marcas.',
    color: 'from-amber-900/20 to-iara-600/10',
    border: 'border-amber-800/20',
    tag: 'text-amber-400',
  },
  {
    icon: TrendingUp,
    title: 'Métricas das Redes',
    desc: 'Instagram, YouTube, TikTok em um lugar. Dados consolidados com diagnóstico estratégico da IA.',
    color: 'from-iara-600/15 to-accent-pink/10',
    border: 'border-iara-700/20',
    tag: 'text-iara-400',
  },
  {
    icon: Target,
    title: 'Metas de Postagem',
    desc: 'Sistema de gamificação com metas, pontos e níveis. Do Iniciante ao Lenda — cada post conta.',
    color: 'from-green-900/20 to-iara-600/10',
    border: 'border-green-800/20',
    tag: 'text-green-400',
  },
  {
    icon: Calendar,
    title: 'Calendário Editorial',
    desc: 'Grade semanal integrada às suas metas. Planeje, execute e marque como feito — tudo em um lugar.',
    color: 'from-teal-900/20 to-iara-600/10',
    border: 'border-teal-800/20',
    tag: 'text-teal-400',
  },
  {
    icon: Images,
    title: 'Banco de Fotos',
    desc: 'Salve suas fotos favoritas para usar nos geradores. Armazenamento privado e seguro.',
    color: 'from-iara-600/15 to-teal-900/10',
    border: 'border-iara-700/20',
    tag: 'text-iara-400',
  },
]

const steps = [
  {
    num: '01',
    title: 'Configure seu perfil',
    desc: 'Informe nicho, tom de voz e plataformas. A Iara aprende quem você é e fala do seu jeito.',
  },
  {
    num: '02',
    title: 'Use os módulos',
    desc: 'Roteiros, carrosseis, thumbnails, stories, métricas e muito mais — tudo personalizado para você.',
  },
  {
    num: '03',
    title: 'Crie, publique, cresça',
    desc: 'Histórico salvo, metas gamificadas, calendário integrado. Você foca no que importa: criar.',
  },
]

const testimonials = [
  {
    quote: 'Eu gastava 3 horas por semana pensando em pauta. Agora em 10 minutos tenho roteiro, carrossel e calendário prontos.',
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

const stats = [
  { value: '10', label: 'Módulos integrados', suffix: '' },
  { value: '500K', label: 'Criadores no Brasil', suffix: '+' },
  { value: 'R$10B', label: 'Mercado de influência/ano', suffix: '' },
  { value: '3h', label: 'Economizadas por semana', suffix: '' },
]

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
          <a href="#modulos" className="hover:text-[#f1f1f8] transition-colors">Módulos</a>
          <a href="#como-funciona" className="hover:text-[#f1f1f8] transition-colors">Como funciona</a>
          <a href="#planos" className="hover:text-[#f1f1f8] transition-colors">Planos</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#9b9bb5] hover:text-[#f1f1f8] transition-colors hidden sm:block">
            Entrar
          </Link>
          <Link href="/register" className="iara-btn-primary text-sm px-4 py-2">
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  )
}

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      <LandingNav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-iara-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-accent-purple/8 rounded-full blur-[80px]" />
          <div className="absolute top-1/3 right-1/4 w-[200px] h-[200px] bg-accent-pink/6 rounded-full blur-[60px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
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
            A Iara é sua assessora de comunicação com IA. 10 módulos integrados que aprendem seu estilo e trabalham por você todos os dias.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="iara-btn-primary text-base px-7 py-3.5 w-full sm:w-auto">
              Começar grátis <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#modulos" className="iara-btn-secondary text-base px-7 py-3.5 w-full sm:w-auto">
              Ver os 10 módulos
            </a>
          </div>

          <p className="mt-5 text-xs text-[#5a5a7a]">
            Sem cartão de crédito · Plano gratuito para sempre · Cancele quando quiser
          </p>
        </div>

        {/* Mockup */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="relative rounded-2xl border border-iara-700/20 bg-[#13131f] overflow-hidden shadow-2xl shadow-black/60">
            <div className="flex items-center gap-2 px-4 py-3 bg-[#0d0d1a] border-b border-[#1a1a2e]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 h-5 mx-4 rounded bg-[#1a1a2e] flex items-center px-3">
                <span className="text-xs text-[#5a5a7a]">iarahubapp.com.br/dashboard</span>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="hidden md:flex flex-col gap-2">
                {['Dashboard', 'Roteiros', 'Carrossel', 'Thumbnail', 'Métricas', 'Oratória'].map((item, i) => (
                  <div key={item} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs ${i === 0 ? 'bg-iara-600/20 text-iara-300 border border-iara-600/20' : 'text-[#5a5a7a]'}`}>
                    <div className={`w-3 h-3 rounded ${i === 0 ? 'bg-iara-500' : 'bg-[#1a1a2e]'}`} />
                    {item}
                  </div>
                ))}
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-5 w-40 rounded bg-gradient-to-r from-iara-700/40 to-accent-purple/20 mb-1.5" />
                    <div className="h-3 w-28 rounded bg-[#1a1a2e]" />
                  </div>
                  <div className="w-28 h-10 rounded-xl bg-iara-600/20 border border-iara-700/20" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: 'Pontos', val: '2.840' }, { label: 'Seguidores', val: '127K' }, { label: 'Engajamento', val: '4.2%' }, { label: 'Score voz', val: '87/100' }].map((s) => (
                    <div key={s.label} className="bg-[#0d0d1a] rounded-xl p-3 text-center">
                      <p className="text-base font-bold iara-gradient-text">{s.val}</p>
                      <p className="text-[10px] text-[#5a5a7a] mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {modules.slice(0, 3).map((m) => {
                    const Icon = m.icon
                    return (
                      <div key={m.title} className={`rounded-xl p-3 bg-gradient-to-br ${m.color} border ${m.border}`}>
                        <Icon className={`w-4 h-4 ${m.tag} mb-1.5`} />
                        <p className="text-[10px] font-medium text-[#c4c4d8]">{m.title}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-iara-600/10 blur-[40px] rounded-full" />
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 border-y border-[#1a1a2e]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl sm:text-4xl font-bold iara-gradient-text mb-1">
                {s.value}{s.suffix}
              </p>
              <p className="text-sm text-[#6b6b8a]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MÓDULOS ──────────────────────────────────────────────────────── */}
      <section id="modulos" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-iara-400 text-sm font-semibold uppercase tracking-wider mb-3">Tudo que você precisa</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#f1f1f8] mb-4">
              10 módulos. Um único objetivo:{' '}
              <span className="iara-gradient-text">seu crescimento.</span>
            </h2>
            <p className="text-[#9b9bb5] max-w-xl mx-auto">
              Cada módulo aprende com seu perfil e entrega resultados cada vez mais precisos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {modules.map((m) => {
              const Icon = m.icon
              return (
                <div
                  key={m.title}
                  className={`iara-card p-5 border ${m.border} bg-gradient-to-br ${m.color} hover:scale-[1.02] transition-all duration-300`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#0a0a14]/60 flex items-center justify-center mb-3">
                    <Icon className={`w-4 h-4 ${m.tag}`} />
                  </div>
                  <h3 className="font-semibold text-[#f1f1f8] text-sm mb-1.5">{m.title}</h3>
                  <p className="text-xs text-[#9b9bb5] leading-relaxed">{m.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────────────────── */}
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

      {/* ── DEPOIMENTOS ──────────────────────────────────────────────────── */}
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

      {/* ── PLANOS ───────────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="iara-card p-10 sm:p-14 text-center border-iara-700/20 relative overflow-hidden">
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
              <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-[#5a5a7a]">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Dados seguros (LGPD)</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Sem cartão de crédito</span>
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Acesso imediato</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
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
            <Link href="/privacidade" className="hover:text-[#9b9bb5] transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-[#9b9bb5] transition-colors">Termos</Link>
            <Link href="/login" className="hover:text-[#9b9bb5] transition-colors">Entrar</Link>
            <Link href="/register" className="hover:text-[#9b9bb5] transition-colors">Cadastrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
