'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { IaraLogo } from '@/components/iara-logo'
import {
  Sparkles, FileText, Mic, Target, Calendar,
  TrendingUp, ArrowRight, Check, Zap, Shield,
  Star, Layers, Image, Images, BookOpen, Smartphone,
  Clock, Brain, DollarSign, Users, ChevronDown,
  Flame, X, BarChart3, Gift, Lightbulb,
} from 'lucide-react'
import { PricingSection } from '@/components/pricing-section'

/* ─────────────────────────── hooks ────────────────────────────────── */

function useScrollY() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return scrollY
}

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function useCounter(end: number, started: boolean, duration = 2000) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!started) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(ease * end))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [started, end, duration])
  return val
}

/* ─────────────────────────── data ─────────────────────────────────── */

const modules = [
  { icon: Lightbulb,  title: 'Faísca Criativa', desc: 'Chat com IA que descobre o melhor do seu conteúdo e gera temas incríveis com hook e ângulo.', tag: 'text-iara-300', color: 'from-iara-600/30 to-accent-purple/20', border: 'border-iara-600/40' },
  { icon: FileText,   title: 'Roteiros',     desc: 'Roteiros no seu tom, em 6 formatos, em menos de 60s.',              tag: 'text-iara-400',    color: 'from-iara-600/20 to-accent-purple/10',    border: 'border-iara-700/20' },
  { icon: Layers,     title: 'Carrossel',    desc: 'Cole o link. Slides completos com paleta e layout automáticos.',    tag: 'text-accent-pink', color: 'from-accent-pink/15 to-accent-purple/10', border: 'border-accent-pink/20' },
  { icon: Image,      title: 'Thumbnail',    desc: 'Alto CTR. PNG 1280×720 com análise de composição.',                 tag: 'text-accent-purple',color:'from-accent-purple/20 to-iara-600/10',  border: 'border-accent-purple/30' },
  { icon: Smartphone, title: 'Stories',      desc: 'Sequência de 7 slides. Hook, virada e CTA. Pronto para postar.',   tag: 'text-accent-pink', color: 'from-accent-pink/15 to-iara-600/10',     border: 'border-accent-pink/20' },
  { icon: Mic,        title: 'Oratória',     desc: 'Score em 5 dimensões com exercícios personalizados.',              tag: 'text-accent-purple',color:'from-accent-purple/20 to-iara-600/10',  border: 'border-accent-purple/30' },
  { icon: BookOpen,   title: 'Mídia Kit',    desc: 'Kit profissional automático. Exporta PDF para marcas.',            tag: 'text-amber-400',   color: 'from-amber-900/20 to-iara-600/10',       border: 'border-amber-800/20' },
  { icon: TrendingUp, title: 'Métricas',     desc: 'IG + YT + TikTok com diagnóstico estratégico da IA.',             tag: 'text-iara-400',    color: 'from-iara-600/15 to-accent-pink/10',     border: 'border-iara-700/20' },
  { icon: Target,     title: 'Metas',        desc: 'Gamificação com pontos e níveis. Do Iniciante ao Lenda.',          tag: 'text-green-400',   color: 'from-green-900/20 to-iara-600/10',       border: 'border-green-800/20' },
  { icon: Calendar,   title: 'Calendário',   desc: 'Grade semanal integrada às metas. Planeje, execute, marque.',      tag: 'text-teal-400',    color: 'from-teal-900/20 to-iara-600/10',        border: 'border-teal-800/20' },
  { icon: Images,     title: 'Banco de Fotos', desc: 'Armazenamento privado para usar nos geradores.',                 tag: 'text-iara-400',    color: 'from-iara-600/15 to-teal-900/10',        border: 'border-iara-700/20' },
]

const testimonials = [
  { quote: 'Gastava 3h por semana pensando em pauta. Agora em 10 min tenho roteiro, carrossel e calendário prontos.', name: 'Ana Luíza M.', role: 'Lifestyle · 85K', emoji: '✨' },
  { quote: 'A análise de oratória me mostrou que eu falava rápido demais. Meus vídeos subiram 40% em retenção.', name: 'Rafael T.', role: 'Fitness · 200K', emoji: '🎙️' },
  { quote: 'O nível de personalização é absurdo. Cada roteiro parece que eu escrevi — não parece IA.', name: 'Juliana P.', role: 'Empreendedora · 45K', emoji: '🚀' },
  { quote: 'Finalmente consegui fechar parceria com uma marca grande. O mídia kit da Iara foi decisivo.', name: 'Carlos E.', role: 'Tech · 120K', emoji: '💼' },
  { quote: 'A IA entende meu nicho melhor do que eu expliquei. É como ter um sócio criativo que nunca cansa.', name: 'Mariana S.', role: 'Gastronomia · 92K', emoji: '🍳' },
  { quote: 'Usei 3 plataformas antes da Iara. Nunca mais. Tudo que preciso em um lugar, na minha língua.', name: 'Thiago R.', role: 'Games · 310K', emoji: '🎮' },
]

const painPoints = [
  { icon: Clock, title: 'Você fica horas em branco', sub: 'O roteiro não vem. O carrossel fica para amanhã. E amanhã a culpa aparece no lugar da ideia.' },
  { icon: Brain, title: 'Bloqueio criativo constante', sub: 'Você sabe que tem algo a dizer — mas a página em branco paralisa. Todo dia. Todo mês.' },
  { icon: BarChart3, title: 'Métricas espalhadas em 4 apps', sub: 'Instagram numa aba, YouTube em outra, TikTok em outra. Nenhum diz o que fazer com os dados.' },
  { icon: DollarSign, title: 'Parcerias que passam batido', sub: 'Seu mídia kit está desatualizado. A marca pediu. Você perdeu a oportunidade.' },
]

const affiliateTiers = [
  {
    name: 'Embaixador',
    commission: '15%',
    period: 'recorrente',
    desc: 'A partir de 10 indicações ativas, você recebe 15% de tudo que eles pagam enquanto forem assinantes.',
    color: 'from-iara-900/40 to-accent-purple/10',
    border: 'border-iara-700/30',
    tag: 'text-iara-400',
    badge: null,
  },
  {
    name: 'Parceiro',
    commission: '20%',
    period: 'recorrente',
    desc: 'Com 30 indicações ativas, você sobe de nível e passa a ganhar 20% recorrente para sempre.',
    color: 'from-accent-purple/20 to-accent-pink/10',
    border: 'border-accent-purple/40',
    tag: 'text-accent-purple',
    badge: 'Mais popular',
  },
  {
    name: 'Elite',
    commission: '25%',
    period: 'recorrente',
    desc: '50 indicações ativas. O topo da pirâmide — 25% recorrente mais bônus trimestral por volume.',
    color: 'from-accent-pink/20 to-iara-600/10',
    border: 'border-accent-pink/40',
    tag: 'text-accent-pink',
    badge: null,
  },
]

/* ─────────────────────────── sub-components ───────────────────────── */

function StatItem({ value, suffix, label, started }: { value: number; suffix: string; label: string; started: boolean }) {
  const count = useCounter(value, started)
  return (
    <div className="text-center">
      <p className="text-4xl sm:text-5xl font-black shimmer-text mb-2">
        {count.toLocaleString('pt-BR')}{suffix}
      </p>
      <p className="text-sm text-[#5a5a7a]">{label}</p>
    </div>
  )
}

/* ─────────────────────────── MAIN ─────────────────────────────────── */

export function LandingPage() {
  const scrollY = useScrollY()

  const [heroVisible, setHeroVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 80); return () => clearTimeout(t) }, [])

  /* Reveals */
  const painReveal    = useReveal(0.06)
  const solutionReveal = useReveal(0.1)
  const statsReveal   = useReveal(0.2)
  const modulesReveal = useReveal(0.04)
  const timeReveal    = useReveal(0.1)
  const howReveal     = useReveal(0.08)
  const affiliateReveal = useReveal(0.08)
  const ctaReveal     = useReveal(0.15)

  /* Parallax values */
  const heroParallax  = scrollY * 0.35
  const orbParallax   = scrollY * 0.18

  return (
    <div className="min-h-screen bg-[#08080f] text-[#f1f1f8] overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrollY > 40 ? 'rgba(8,8,15,0.85)' : 'transparent',
          backdropFilter: scrollY > 40 ? 'blur(20px)' : 'none',
          borderBottom: scrollY > 40 ? '1px solid rgba(255,255,255,0.05)' : 'none',
        }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <IaraLogo size="sm" layout="horizontal" />
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-[#6b6b8a]">
            <a href="#modulos"       className="hover:text-[#f1f1f8] transition-colors">Módulos</a>
            <a href="#como-funciona" className="hover:text-[#f1f1f8] transition-colors">Como funciona</a>
            <a href="#planos"        className="hover:text-[#f1f1f8] transition-colors">Planos</a>
            <a href="#afiliados"     className="hover:text-[#f1f1f8] transition-colors">Indique e Ganhe</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm text-[#6b6b8a] hover:text-[#f1f1f8] transition-colors">
              Entrar
            </Link>
            <Link href="/register"
              className="btn-shimmer flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-iara-900/40"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }}>
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 px-4 sm:px-6 overflow-hidden">

        {/* Dot grid — moves slower than content (parallax) */}
        <div className="absolute inset-0 dot-grid opacity-35 pointer-events-none"
          style={{ transform: `translateY(${orbParallax * 0.5}px)` }} />

        {/* Orbs — heavy parallax */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full pointer-events-none animate-orb-1"
          style={{
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, transparent 70%)',
            transform: `translate(-50%, ${-orbParallax}px)`,
          }} />
        <div className="absolute top-1/3 left-[10%] w-[450px] h-[450px] rounded-full pointer-events-none animate-orb-2"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 70%)',
            transform: `translateY(${-orbParallax * 0.7}px)`,
          }} />
        <div className="absolute top-1/4 right-[8%] w-[320px] h-[320px] rounded-full pointer-events-none animate-orb-3"
          style={{
            background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)',
            transform: `translateY(${-orbParallax * 0.5}px)`,
          }} />

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #08080f 88%)' }} />

        {/* Content — moves slightly on scroll */}
        <div className="relative max-w-5xl mx-auto text-center z-10"
          style={{ transform: `translateY(${heroParallax}px)`, opacity: Math.max(0, 1 - scrollY / 600) }}>

          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-iara-700/40 bg-iara-950/60 text-iara-300 text-xs font-medium mb-10 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Flame className="w-3.5 h-3.5 text-iara-400 animate-glow-pulse" />
            Assessoria com IA · Feito para criadores brasileiros
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[82px] font-black leading-[1.02] tracking-tight mb-6">
            {[
              { text: 'Pare de desperdiçar', delay: '0ms' },
              { text: 'horas tentando', delay: '120ms', shimmer: false },
              { text: 'achar o que criar.', delay: '240ms', shimmer: true },
            ].map((line, i) => (
              <span key={i}
                className={`block transition-all duration-800 ${line.shimmer ? 'shimmer-text' : ''} ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: line.delay, transitionDuration: '800ms' }}>
                {line.text}
              </span>
            ))}
          </h1>

          {/* Sub-headline */}
          <p className={`text-lg sm:text-xl md:text-2xl text-[#9b9bb5] max-w-2xl mx-auto mb-8 leading-relaxed transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: '400ms' }}>
            A Iara é sua assessora de comunicação com IA. Aprende seu estilo, fala na sua voz e entrega roteiro, carrossel, thumbnail e calendário —{' '}
            <span className="text-[#f1f1f8] font-semibold">em minutos, não horas.</span>
          </p>

          {/* CTAs */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '560ms' }}>
            <Link href="/register"
              className="btn-shimmer group flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-2xl text-base font-bold text-white shadow-2xl shadow-iara-900/50 hover:scale-[1.04] hover:shadow-iara-800/70 transition-all duration-300"
              style={{ background: 'linear-gradient(135deg,#6366f1 0%,#a855f7 55%,#ec4899 100%)' }}>
              Começar grátis agora
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#modulos"
              className="flex items-center gap-2 w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-semibold text-[#9b9bb5] border border-white/10 hover:border-iara-700/50 hover:text-[#f1f1f8] hover:bg-iara-900/20 transition-all duration-300">
              Ver os 10 módulos
              <ChevronDown className="w-4 h-4 opacity-50" />
            </a>
          </div>

          <p className={`text-xs text-[#3a3a5a] transition-all duration-700 ${heroVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '680ms' }}>
            Sem cartão de crédito · Plano gratuito para sempre · Cancele quando quiser
          </p>

          {/* Hero mockup */}
          <div className={`relative mt-16 transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
            style={{ transitionDelay: '780ms' }}>
            {/* Window */}
            <div className="relative mx-auto max-w-3xl rounded-[20px] overflow-hidden border border-white/8 shadow-[0_40px_120px_rgba(0,0,0,0.85)]"
              style={{ background: 'linear-gradient(150deg, #0d0d1e 0%, #111121 100%)' }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5"
                style={{ background: 'rgba(8,8,16,0.9)' }}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex-1 mx-4 h-6 rounded-lg flex items-center px-3 text-xs text-[#3a3a5a]"
                  style={{ background: 'rgba(20,20,40,0.9)' }}>
                  app.iara.com.br/dashboard · Roteiro gerado em 12s ✨
                </div>
              </div>
              <div className="p-5 grid grid-cols-3 gap-4">
                <div className="hidden sm:flex flex-col gap-1.5">
                  {['Dashboard', 'Faísca Criativa', 'Roteiros', 'Carrossel', 'Métricas'].map((item, i) => (
                    <div key={item}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${i === 1 ? 'bg-iara-600/25 text-iara-300 border border-iara-600/25' : 'text-[#4a4a6a]'}`}>
                      <div className={`w-2 h-2 rounded-sm ${i === 1 ? 'bg-iara-500' : 'bg-[#2a2a3a]'}`} />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="col-span-3 sm:col-span-2 space-y-3">
                  {/* AI writing animation */}
                  <div className="rounded-xl p-4 border border-iara-700/20" style={{ background: 'rgba(10,10,22,0.8)' }}>
                    <p className="text-[10px] text-iara-400 font-semibold mb-2">🤖 Roteiro · Reels · 60s</p>
                    <div className="space-y-1.5">
                      {[
                        { w: 'w-full', o: 1 },
                        { w: 'w-5/6', o: 0.85 },
                        { w: 'w-4/5', o: 0.7 },
                        { w: 'w-3/4', o: 0.5 },
                        { w: 'w-1/2', o: 0.25 },
                      ].map((l, li) => (
                        <div key={li} className={`h-2.5 ${l.w} rounded-full`}
                          style={{ background: `rgba(99,102,241,${l.o * 0.4})`, opacity: l.o }} />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-glow-pulse" />
                      <p className="text-[10px] text-green-400 font-medium">Pronto em 12 segundos</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Score voz', val: '94/100', color: '#a855f7' },
                      { label: 'Engajamento', val: '4.2%', color: '#ec4899' },
                      { label: 'Roteiros', val: '47', color: '#818cf8' },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-3 text-center border border-white/5"
                        style={{ background: 'rgba(10,10,20,0.7)' }}>
                        <p className="text-sm font-bold mb-0.5" style={{ color: s.color }}>{s.val}</p>
                        <p className="text-[9px] text-[#4a4a6a]">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -left-4 md:-left-10 hidden md:flex animate-float">
              <div className="rounded-2xl px-4 py-3 border border-green-700/30 shadow-xl shadow-black/60 text-left"
                style={{ background: 'rgba(8,8,18,0.95)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-glow-pulse" />
                  <p className="text-[11px] font-semibold text-green-400">Roteiro gerado</p>
                </div>
                <p className="text-[10px] text-[#5a5a7a] mt-0.5 max-w-[140px] leading-tight">"Hook: O erro que 90% dos criadores..."</p>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 md:-right-10 hidden md:flex animate-float-2">
              <div className="rounded-2xl px-4 py-3 border border-iara-700/30 shadow-xl shadow-black/60 text-left"
                style={{ background: 'rgba(8,8,18,0.95)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3 h-3 text-iara-400" />
                  <p className="text-[11px] font-semibold text-iara-400">Score de Oratória</p>
                </div>
                <p className="text-xl font-black shimmer-text">94<span className="text-sm font-normal text-[#5a5a7a]">/100</span></p>
              </div>
            </div>

            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 hidden md:flex animate-float-slow">
              <div className="rounded-2xl px-5 py-2.5 border border-accent-purple/30 shadow-xl shadow-black/60 flex items-center gap-3"
                style={{ background: 'rgba(8,8,18,0.95)', backdropFilter: 'blur(16px)' }}>
                <div className="flex -space-x-2">
                  {['#818cf8','#a855f7','#ec4899'].map(c => (
                    <div key={c} className="w-6 h-6 rounded-full border-2 border-[#08080f]" style={{ background: c }} />
                  ))}
                </div>
                <p className="text-[11px] text-[#9b9bb5]">
                  <span className="font-bold text-[#f1f1f8]">11 módulos</span> de IA integrados
                </p>
              </div>
            </div>

            {/* Under-glow */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 blur-[60px] rounded-full pointer-events-none animate-glow-pulse"
              style={{ background: 'rgba(99,102,241,0.28)' }} />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS MARQUEE ─────────────────────────────────────── */}
      <section className="py-14 overflow-hidden border-y border-white/5">
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-28 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #08080f, transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-28 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, #08080f, transparent)' }} />
          <div className="flex gap-5 animate-marquee whitespace-nowrap">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i}
                className="inline-flex flex-col gap-3 p-5 rounded-2xl border border-white/6 flex-shrink-0 w-[330px] whitespace-normal"
                style={{ background: 'rgba(12,12,24,0.9)' }}>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-sm text-[#c4c4d8] leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-2.5 pt-1 border-t border-white/5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-base border border-iara-700/20"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.2))' }}>
                    {t.emoji}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#f1f1f8]">{t.name}</p>
                    <p className="text-[10px] text-[#4a4a6a]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOR ──────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(220,38,38,0.04) 0%, transparent 60%)' }} />

        <div className="max-w-5xl mx-auto">
          <div ref={painReveal.ref}
            className={`text-center mb-16 reveal ${painReveal.visible ? 'visible' : ''}`}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-red-800/40 bg-red-950/30 text-red-400 text-xs font-medium mb-6">
              <X className="w-3.5 h-3.5" /> Se você se reconhece em algum desses cenários...
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4">
              Bloqueio criativo não é falta<br />
              <span style={{ color: 'rgba(220,38,38,0.85)' }}>de talento. É falta de sistema.</span>
            </h2>
            <p className="text-[#6b6b8a] text-lg max-w-xl mx-auto">
              E nenhum sistema foi feito especificamente para criadores brasileiros. Até agora.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {painPoints.map((p, i) => {
              const Icon = p.icon
              return (
                <div key={i}
                  className={`reveal reveal-delay-${i + 1} ${painReveal.visible ? 'visible' : ''} group flex gap-4 p-6 rounded-2xl border border-red-900/20 hover:border-red-800/40 transition-all duration-300 cursor-default`}
                  style={{ background: 'rgba(12,6,6,0.7)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform"
                    style={{ background: 'rgba(220,38,38,0.1)' }}>
                    <Icon className="w-5 h-5 text-red-400/70" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#f1f1f8] mb-1">{p.title}</h3>
                    <p className="text-sm text-[#6b6b8a] leading-relaxed">{p.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SOLUÇÃO FLASH ────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #08080f 0%, #0b0b18 50%, #08080f 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.10) 0%, transparent 65%)' }} />

        <div ref={solutionReveal.ref}
          className={`max-w-4xl mx-auto text-center relative z-10 reveal ${solutionReveal.visible ? 'visible' : ''}`}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-green-800/40 bg-green-950/30 text-green-400 text-xs font-medium mb-8">
            <Check className="w-3.5 h-3.5" /> A solução existe. Está aqui.
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] mb-8">
            A Iara aprende a sua voz.<br />
            <span className="shimmer-text">Fala por você. Trabalha por você.</span>
          </h2>
          <p className="text-xl text-[#9b9bb5] max-w-2xl mx-auto mb-10 leading-relaxed">
            Não é uma IA genérica que gera texto sem alma. A Iara absorve o seu nicho, o seu tom, os seus formatos — e entrega conteúdo que parece que saiu da sua cabeça, não de uma máquina.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {[
              { icon: Zap, color: 'text-iara-400', bg: 'rgba(99,102,241,0.1)', border: 'border-iara-700/25', title: 'Rápido de verdade', sub: 'Roteiro, carrossel e thumbnails em menos de 2 minutos. Sem exagero.' },
              { icon: Brain, color: 'text-accent-purple', bg: 'rgba(168,85,247,0.1)', border: 'border-accent-purple/25', title: 'Personalizado', sub: 'Cada output usa o seu perfil vocal, nicho e estilo. Nada genérico.' },
              { icon: TrendingUp, color: 'text-accent-pink', bg: 'rgba(236,72,153,0.1)', border: 'border-accent-pink/25', title: 'Tudo integrado', sub: '10 módulos que se falam. Calendário, metas, métricas, mídia kit.' },
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i}
                  className={`reveal reveal-delay-${i + 1} ${solutionReveal.visible ? 'visible' : ''} p-5 rounded-2xl border ${f.border}`}
                  style={{ background: f.bg }}>
                  <Icon className={`w-5 h-5 ${f.color} mb-3`} />
                  <h3 className="font-bold text-[#f1f1f8] mb-1">{f.title}</h3>
                  <p className="text-sm text-[#6b6b8a] leading-relaxed">{f.sub}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── ROI DO TEMPO ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div ref={timeReveal.ref} className={`reveal ${timeReveal.visible ? 'visible' : ''}`}>
            <div className="text-center mb-14">
              <p className="text-iara-400 text-xs font-bold uppercase tracking-widest mb-4">A Matemática do Tempo</p>
              <h2 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">
                Quanto tempo você joga fora<br />
                <span className="shimmer-text">tentando pensar no que criar?</span>
              </h2>
              <p className="text-[#6b6b8a] max-w-xl mx-auto">
                Criadores gastam mais de 6 horas por semana só com planejamento e produção de conteúdo. Com a Iara, esse tempo cai para menos de 30 minutos.
              </p>
            </div>

            {/* Before / After */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* Before */}
              <div className="rounded-2xl p-8 border border-red-900/25" style={{ background: 'rgba(10,4,4,0.8)' }}>
                <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-6">Sem a Iara</p>
                <div className="space-y-4">
                  {[
                    { label: 'Pensar em pauta', time: '~2h' },
                    { label: 'Escrever roteiro', time: '~90 min' },
                    { label: 'Montar carrossel', time: '~60 min' },
                    { label: 'Criar thumbnail', time: '~30 min' },
                    { label: 'Stories + legenda', time: '~45 min' },
                    { label: 'Calendário + planejamento', time: '~30 min' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-red-500/60" />
                        <span className="text-sm text-[#9b9bb5]">{r.label}</span>
                      </div>
                      <span className="text-sm font-bold text-red-400">{r.time}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-red-900/30 flex items-center justify-between">
                    <span className="font-bold text-[#f1f1f8]">Total por semana</span>
                    <span className="text-lg font-black text-red-400">~6h</span>
                  </div>
                  <p className="text-xs text-[#4a4a6a]">= mais de 300 horas por ano. Horas que você não vai recuperar.</p>
                </div>
              </div>

              {/* After */}
              <div className="rounded-2xl p-8 border border-green-900/25 relative overflow-hidden" style={{ background: 'rgba(4,10,4,0.8)' }}>
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.05) 0%, transparent 60%)' }} />
                <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-6 relative z-10">Com a Iara</p>
                <div className="space-y-4 relative z-10">
                  {[
                    { label: 'Roteiro completo', time: '~2 min' },
                    { label: 'Carrossel montado', time: '~3 min' },
                    { label: 'Thumbnail gerada', time: '~1 min' },
                    { label: 'Stories + legenda', time: '~2 min' },
                    { label: 'Calendário ajustado', time: '~2 min' },
                    { label: 'Ideias com Faísca IA', time: '~10 min' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-[#9b9bb5]">{r.label}</span>
                      </div>
                      <span className="text-sm font-bold text-green-400">{r.time}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-green-900/30 flex items-center justify-between">
                    <span className="font-bold text-[#f1f1f8]">Total por semana</span>
                    <span className="text-lg font-black text-green-400">~20 min</span>
                  </div>
                  <p className="text-xs text-[#4a4a6a]">= 300+ horas devolvidas por ano. Use criando, crescendo.</p>
                </div>
              </div>
            </div>

            {/* Big number highlight */}
            <div className="rounded-2xl p-10 border border-iara-700/25 text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.05))' }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />
              <p className="relative z-10 text-[#6b6b8a] text-sm mb-3 uppercase tracking-widest font-bold">O que você faz com 300 horas por ano a mais?</p>
              <p className="relative z-10 text-5xl sm:text-7xl font-black shimmer-text mb-4">300h</p>
              <p className="relative z-10 text-lg text-[#9b9bb5] max-w-lg mx-auto">
                Mais vídeos. Mais parcerias. Mais descanso. Mais vida.<br />
                <span className="text-[#f1f1f8] font-semibold">A Iara não substitui sua criatividade — ela libera ela.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-y border-white/5"
        style={{ background: 'linear-gradient(180deg, #08080f 0%, #0c0c1c 100%)' }}>
        <div ref={statsReveal.ref}
          className={`max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 reveal ${statsReveal.visible ? 'visible' : ''}`}>
          <StatItem value={11}    suffix="+"  label="Módulos integrados"           started={statsReveal.visible} />
          <StatItem value={6}     suffix="h+" label="Economizadas por semana"      started={statsReveal.visible} />
          <StatItem value={300}   suffix="h+" label="Economizadas por ano"         started={statsReveal.visible} />
          <StatItem value={10}    suffix="B"  label="Mercado de influência (R$/ano)" started={statsReveal.visible} />
        </div>
      </section>

      {/* ── MÓDULOS ───────────────────────────────────────────────────── */}
      <section id="modulos" className="py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div ref={modulesReveal.ref}
            className={`text-center mb-16 reveal ${modulesReveal.visible ? 'visible' : ''}`}>
            <p className="text-iara-400 text-xs font-bold uppercase tracking-widest mb-4">Tudo que você precisa</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4">
              11 módulos. Um único objetivo:{' '}
              <span className="shimmer-text">seu crescimento.</span>
            </h2>
            <p className="text-[#6b6b8a] max-w-xl mx-auto text-lg">
              Cada módulo aprende com seu perfil. Os resultados ficam mais precisos a cada uso.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {modules.map((m, i) => {
              const Icon = m.icon
              return (
                <div key={m.title}
                  className={`reveal reveal-delay-${Math.min(i % 5 + 1, 6)} card-glow rounded-2xl p-5 border ${m.border} bg-gradient-to-br ${m.color} hover:scale-[1.04] hover:shadow-xl hover:shadow-black/50 active:scale-[0.98] transition-all duration-300 cursor-default ${modulesReveal.visible ? 'visible' : ''}`}>
                  <div className="w-10 h-10 rounded-xl bg-[#08080f]/70 flex items-center justify-center mb-3.5 shadow-inner">
                    <Icon className={`w-5 h-5 ${m.tag}`} />
                  </div>
                  <h3 className="font-bold text-[#f1f1f8] text-sm mb-2 leading-tight">{m.title}</h3>
                  <p className="text-xs text-[#6b6b8a] leading-relaxed">{m.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #08080f 0%, #0d0d1a 50%, #08080f 100%)' }}>
        <div className="absolute inset-0 dot-grid opacity-15 pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div ref={howReveal.ref}
            className={`text-center mb-16 reveal ${howReveal.visible ? 'visible' : ''}`}>
            <p className="text-iara-400 text-xs font-bold uppercase tracking-widest mb-4">Simples assim</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">
              Do zero ao seu{' '}
              <span className="shimmer-text">assessor pessoal de IA</span>{' '}
              em minutos.
            </h2>
          </div>
          <div className="relative">
            <div className="absolute left-[31px] md:left-[39px] top-10 bottom-10 w-px hidden md:block"
              style={{ background: 'linear-gradient(180deg, rgba(99,102,241,0.7), rgba(168,85,247,0.4), transparent)' }} />
            <div className="space-y-10">
              {[
                { num: '01', title: 'Configure seu perfil', desc: 'Informe nicho, tom de voz e plataformas. A Iara aprende quem você é e fala do seu jeito — não de qualquer criador.', color: 'from-iara-600/20 to-accent-purple/10', border: 'border-iara-700/30' },
                { num: '02', title: 'Use os módulos', desc: 'Roteiros, carrosseis, thumbnails, stories, métricas, mídia kit — tudo gerado com a SUA personalidade, não um template genérico.', color: 'from-accent-purple/20 to-accent-pink/10', border: 'border-accent-purple/30' },
                { num: '03', title: 'Crie, publique, cresça', desc: 'Histórico salvo, metas gamificadas, calendário integrado. Você foca no que importa. A Iara cuida do resto.', color: 'from-accent-pink/15 to-iara-600/10', border: 'border-accent-pink/20' },
              ].map((step, i) => (
                <div key={step.num}
                  className={`flex gap-6 items-start reveal reveal-delay-${i + 1} ${howReveal.visible ? 'visible' : ''}`}>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} border ${step.border} flex items-center justify-center flex-shrink-0 relative z-10 shadow-xl shadow-black/40`}>
                    <span className="text-xl font-black shimmer-text">{step.num}</span>
                  </div>
                  <div className="pt-3 flex-1">
                    <h3 className="text-xl font-bold text-[#f1f1f8] mb-1.5">{step.title}</h3>
                    <p className="text-[#9b9bb5] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANOS ────────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── AFILIADOS / PARCEIROS ─────────────────────────────────────── */}
      <section id="afiliados" className="py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(168,85,247,0.08) 0%, transparent 65%)' }} />

        <div className="max-w-5xl mx-auto relative z-10">
          <div ref={affiliateReveal.ref}
            className={`text-center mb-14 reveal ${affiliateReveal.visible ? 'visible' : ''}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent-purple/30 bg-accent-purple/10 text-accent-purple text-xs font-bold mb-8">
              <Gift className="w-3.5 h-3.5" />
              Programa de Parcerias · Indique e Ganhe
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-5">
              Use a Iara. Indique a Iara.<br />
              <span className="shimmer-text">Ganhe todo mês por isso.</span>
            </h2>
            <p className="text-[#6b6b8a] text-lg max-w-2xl mx-auto">
              Cada criador que você indica gera comissão recorrente para você enquanto ele for assinante. Não é MLM — é simplesmente compartilhar algo que funciona e ser remunerado por isso.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {affiliateTiers.map((tier, i) => (
              <div key={tier.name}
                className={`reveal reveal-delay-${i + 1} ${affiliateReveal.visible ? 'visible' : ''} relative rounded-2xl p-7 border ${tier.border} bg-gradient-to-br ${tier.color} hover:scale-[1.02] transition-all duration-300`}>
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>
                    {tier.badge}
                  </div>
                )}
                <div className={`text-4xl font-black ${tier.tag} mb-1`}>{tier.commission}</div>
                <div className="text-xs text-[#6b6b8a] mb-4 uppercase tracking-widest font-semibold">{tier.period}</div>
                <h3 className="font-bold text-[#f1f1f8] text-lg mb-3">{tier.name}</h3>
                <p className="text-sm text-[#9b9bb5] leading-relaxed">{tier.desc}</p>
              </div>
            ))}
          </div>

          {/* How to join */}
          <div className={`reveal reveal-delay-4 ${affiliateReveal.visible ? 'visible' : ''} rounded-2xl p-8 border border-white/8 text-center`}
            style={{ background: 'rgba(12,12,24,0.7)' }}>
            <Users className="w-8 h-8 text-iara-400 mx-auto mb-4" />
            <h3 className="font-bold text-[#f1f1f8] text-lg mb-2">Como funciona</h3>
            <div className="grid sm:grid-cols-3 gap-6 mt-6 text-sm text-[#9b9bb5]">
              {[
                { num: '1', text: 'Crie sua conta e ative seu link único de afiliado no painel.' },
                { num: '2', text: 'Compartilhe com sua comunidade, stories, reels — do jeito que você preferir.' },
                { num: '3', text: 'Cada assinatura ativa gera comissão mensal automaticamente na sua conta.' },
              ].map(s => (
                <div key={s.num} className="flex flex-col items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-iara-700/40 bg-iara-950/60 flex items-center justify-center text-sm font-black text-iara-400">
                    {s.num}
                  </div>
                  <p className="leading-relaxed text-center">{s.text}</p>
                </div>
              ))}
            </div>
            <Link href="/register"
              className="inline-flex items-center gap-2 mt-8 px-7 py-3 rounded-xl text-sm font-bold text-white hover:scale-[1.03] transition-all duration-300"
              style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>
              Quero ser parceiro <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
      <section className="py-32 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 65%)', animation: 'orb-drift-2 22s ease-in-out infinite' }} />

        <div ref={ctaReveal.ref}
          className={`max-w-3xl mx-auto relative z-10 reveal ${ctaReveal.visible ? 'visible' : ''}`}>
          <div className="relative rounded-3xl overflow-hidden border border-white/8 shadow-[0_60px_200px_rgba(0,0,0,0.9)] p-12 sm:p-20 text-center"
            style={{ background: 'linear-gradient(160deg, rgba(12,12,28,0.98), rgba(18,8,32,0.98))' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 55%)' }} />

            <div className="relative">
              <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-iara-900/70"
                style={{ background: 'linear-gradient(135deg,#6366f1 0%,#a855f7 100%)' }}>
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] mb-6">
                Sua próxima fase como criador{' '}
                <span className="shimmer-text">começa agora.</span>
              </h2>
              <p className="text-[#9b9bb5] text-xl mb-12 max-w-lg mx-auto leading-relaxed">
                Cada módulo foi construído para o criador brasileiro — do roteiro à oratória. Você ainda vai ficar em branco amanhã?
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                <Link href="/register"
                  className="btn-shimmer group flex items-center justify-center gap-2 w-full sm:w-auto px-12 py-5 rounded-2xl text-lg font-black text-white shadow-2xl shadow-iara-900/70 hover:scale-[1.04] hover:shadow-iara-800/70 transition-all duration-300"
                  style={{ background: 'linear-gradient(135deg,#6366f1 0%,#a855f7 55%,#ec4899 100%)' }}>
                  Criar conta grátis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/login" className="text-sm text-[#6b6b8a] hover:text-[#f1f1f8] transition-colors">
                  Já tenho conta →
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-7 text-xs text-[#3a3a5a]">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Dados seguros · LGPD</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500" /> Sem cartão de crédito</span>
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-iara-400" /> Acesso imediato</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold shimmer-text">Iara</span>
          </div>
          <p className="text-xs text-[#3a3a5a] text-center">
            © {new Date().getFullYear()} Iara Hub. Feito no Brasil 🇧🇷 para criadores brasileiros.
          </p>
          <div className="flex items-center gap-5 text-xs text-[#3a3a5a]">
            <Link href="/privacidade" className="hover:text-[#9b9bb5] transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-[#9b9bb5] transition-colors">Termos</Link>
            <a href="#afiliados" className="hover:text-[#9b9bb5] transition-colors">Afiliados</a>
            <Link href="/login" className="hover:text-[#9b9bb5] transition-colors">Entrar</Link>
            <Link href="/register" className="hover:text-[#9b9bb5] transition-colors">Cadastrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
