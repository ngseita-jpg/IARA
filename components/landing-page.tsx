'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Sparkles, FileText, Mic, Target, Calendar,
  TrendingUp, ArrowRight, Check, Zap, Shield,
  Star, Layers, Image, Images, BookOpen, Smartphone,
} from 'lucide-react'
import { PricingSection } from '@/components/pricing-section'

/* ── Scroll reveal hook ─────────────────────────────────────────── */
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ── Counter hook ───────────────────────────────────────────────── */
function useCounter(end: number, started: boolean, duration = 1800) {
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

/* ── Data ───────────────────────────────────────────────────────── */
const modules = [
  { icon: FileText,   title: 'Gerador de Roteiros',  desc: 'Roteiros completos no seu tom, para o seu nicho, em 6 formatos diferentes.',          tag: 'text-iara-400',    color: 'from-iara-600/20 to-accent-purple/10',    border: 'border-iara-700/20' },
  { icon: Layers,     title: 'Gerador de Carrossel', desc: 'Cole um link — a Iara monta slides completos com paleta, layout e chat de ajustes.',   tag: 'text-accent-pink', color: 'from-accent-pink/15 to-accent-purple/10', border: 'border-accent-pink/20' },
  { icon: Image,      title: 'Gerador de Thumbnail', desc: 'Thumbnails de alto CTR renderizadas em PNG 1280×720 com análise de composição.',       tag: 'text-accent-purple',color: 'from-accent-purple/20 to-iara-600/10',  border: 'border-accent-purple/30' },
  { icon: Smartphone, title: 'Gerador de Stories',   desc: 'Sequência de 7 slides com hook, virada e CTA personalizados. Pronto para postar.',    tag: 'text-accent-pink', color: 'from-accent-pink/15 to-iara-600/10',     border: 'border-accent-pink/20' },
  { icon: Mic,        title: 'Análise de Oratória',  desc: 'Score em 5 dimensões: confiança, energia, fluidez, emoção e clareza. Com exercícios.', tag: 'text-accent-purple',color: 'from-accent-purple/20 to-iara-600/10',  border: 'border-accent-purple/30' },
  { icon: BookOpen,   title: 'Mídia Kit com IA',     desc: 'Kit profissional automático com perfil, métricas e voz. Exporta PDF para marcas.',     tag: 'text-amber-400',   color: 'from-amber-900/20 to-iara-600/10',       border: 'border-amber-800/20' },
  { icon: TrendingUp, title: 'Métricas das Redes',   desc: 'Instagram, YouTube, TikTok consolidados com diagnóstico estratégico da IA.',           tag: 'text-iara-400',    color: 'from-iara-600/15 to-accent-pink/10',     border: 'border-iara-700/20' },
  { icon: Target,     title: 'Metas de Postagem',    desc: 'Gamificação com metas, pontos e níveis. Do Iniciante ao Lenda — cada post conta.',     tag: 'text-green-400',   color: 'from-green-900/20 to-iara-600/10',       border: 'border-green-800/20' },
  { icon: Calendar,   title: 'Calendário Editorial', desc: 'Grade semanal integrada às metas. Planeje, execute, marque como feito.',               tag: 'text-teal-400',    color: 'from-teal-900/20 to-iara-600/10',        border: 'border-teal-800/20' },
  { icon: Images,     title: 'Banco de Fotos',       desc: 'Salve suas fotos para usar nos geradores. Armazenamento privado e seguro.',            tag: 'text-iara-400',    color: 'from-iara-600/15 to-teal-900/10',        border: 'border-iara-700/20' },
]

const testimonials = [
  { quote: 'Gastava 3h por semana pensando em pauta. Agora em 10 min tenho roteiro, carrossel e calendário prontos.', name: 'Ana Luíza M.', role: 'Lifestyle · 85K', emoji: '✨' },
  { quote: 'A análise de oratória me mostrou que eu falava rápido demais. Meus vídeos subiram 40% em retenção.', name: 'Rafael T.', role: 'Fitness · 200K', emoji: '🎙️' },
  { quote: 'O nível de personalização é absurdo. Cada roteiro parece que eu escrevi — não parece IA.', name: 'Juliana P.', role: 'Empreendedora · 45K', emoji: '🚀' },
  { quote: 'Finalmente consegui fechar uma parceria com uma marca grande. O mídia kit da Iara foi decisivo.', name: 'Carlos E.', role: 'Tech · 120K', emoji: '💼' },
  { quote: 'A IA entende meu nicho melhor do que eu expliquei. É como ter um sócio criativo que nunca cansa.', name: 'Mariana S.', role: 'Gastronomia · 92K', emoji: '🍳' },
  { quote: 'Usei 3 plataformas antes da Iara. Nunca mais. Tudo que preciso em um lugar, falando a minha língua.', name: 'Thiago R.', role: 'Games · 310K', emoji: '🎮' },
]

const steps = [
  { num: '01', title: 'Configure seu perfil', desc: 'Informe nicho, tom de voz e plataformas. A Iara aprende quem você é e fala do seu jeito.', color: 'from-iara-600/20 to-accent-purple/10', border: 'border-iara-700/30' },
  { num: '02', title: 'Use os módulos',       desc: 'Roteiros, carrosseis, thumbnails, stories, métricas e muito mais — tudo personalizado para você.', color: 'from-accent-purple/20 to-accent-pink/10', border: 'border-accent-purple/30' },
  { num: '03', title: 'Crie, publique, cresça', desc: 'Histórico salvo, metas gamificadas, calendário integrado. Você foca no que importa: criar.',  color: 'from-accent-pink/15 to-iara-600/10', border: 'border-accent-pink/20' },
]

/* ── Stat counter item ──────────────────────────────────────────── */
function StatItem({ value, suffix, label, started }: { value: number; suffix: string; label: string; started: boolean }) {
  const count = useCounter(value, started)
  return (
    <div className="text-center">
      <p className="text-3xl sm:text-4xl font-bold shimmer-text mb-1">
        {count.toLocaleString('pt-BR')}{suffix}
      </p>
      <p className="text-sm text-[#6b6b8a]">{label}</p>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────── */
export function LandingPage() {
  /* Hero headline reveal */
  const [heroVisible, setHeroVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  /* Sections */
  const statsReveal  = useReveal(0.3)
  const modulesReveal = useReveal(0.05)
  const howReveal    = useReveal(0.1)
  const testReveal   = useReveal(0.1)
  const ctaReveal    = useReveal(0.2)

  return (
    <div className="min-h-screen bg-[#08080f] text-[#f1f1f8]">

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#08080f]/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center shadow-lg shadow-iara-900/50">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold shimmer-text">Iara</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-[#6b6b8a]">
            <a href="#modulos"       className="hover:text-[#f1f1f8] transition-colors">Módulos</a>
            <a href="#como-funciona" className="hover:text-[#f1f1f8] transition-colors">Como funciona</a>
            <a href="#planos"        className="hover:text-[#f1f1f8] transition-colors">Planos</a>
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

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 px-4 sm:px-6 overflow-hidden">

        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full pointer-events-none animate-orb-1"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 left-[15%] w-[400px] h-[400px] rounded-full pointer-events-none animate-orb-2"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-1/4 right-[10%] w-[300px] h-[300px] rounded-full pointer-events-none animate-orb-3"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.10) 0%, transparent 70%)' }} />

        {/* Vignette edges */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, #08080f 90%)' }} />

        <div className="relative max-w-4xl mx-auto text-center z-10">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-iara-700/40 bg-iara-950/60 text-iara-300 text-xs font-medium mb-10 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '0ms' }}>
            <Zap className="w-3.5 h-3.5 text-iara-400" />
            Assessoria com IA · Feito para criadores brasileiros
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.06] tracking-tight mb-6">
            <span className={`block transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: '120ms' }}>
              Imagine acordar sabendo
            </span>
            <span className={`block shimmer-text transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: '240ms' }}>
              exatamente o que criar,
            </span>
            <span className={`block transition-all duration-700 text-[#f1f1f8] ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: '360ms' }}>
              postar e conquistar hoje.
            </span>
          </h1>

          {/* Sub */}
          <p className={`text-lg sm:text-xl text-[#9b9bb5] max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: '500ms' }}>
            A Iara é sua assessora de comunicação com IA. 10 módulos integrados que aprendem seu estilo e trabalham por você todos os dias.
          </p>

          {/* CTAs */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '620ms' }}>
            <Link href="/register"
              className="btn-shimmer group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-white shadow-2xl shadow-iara-900/50 hover:scale-[1.03] hover:shadow-iara-800/60 transition-all duration-300"
              style={{ background: 'linear-gradient(135deg,#6366f1 0%,#a855f7 60%,#ec4899 100%)' }}>
              Começar grátis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#modulos"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-semibold text-[#9b9bb5] border border-white/10 hover:border-iara-700/50 hover:text-[#f1f1f8] hover:bg-iara-900/20 transition-all duration-300">
              Ver os 10 módulos
            </a>
          </div>

          <p className={`mt-5 text-xs text-[#3a3a5a] transition-all duration-700 ${heroVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '740ms' }}>
            Sem cartão de crédito · Plano gratuito para sempre · Cancele quando quiser
          </p>

          {/* Floating hero UI preview */}
          <div className={`relative mt-16 transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
            style={{ transitionDelay: '800ms' }}>

            {/* Main mockup window */}
            <div className="relative mx-auto max-w-3xl rounded-2xl overflow-hidden border border-white/8 shadow-2xl shadow-black/80"
              style={{ background: 'linear-gradient(135deg, #0f0f1e 0%, #13131f 100%)' }}>
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5"
                style={{ background: 'rgba(10,10,20,0.8)' }}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex-1 mx-4 h-5 rounded-lg flex items-center px-3 text-xs text-[#3a3a5a]"
                  style={{ background: 'rgba(26,26,46,0.8)' }}>
                  app.iara.com.br/dashboard
                </div>
              </div>
              {/* Content */}
              <div className="p-5 grid grid-cols-3 gap-4">
                {/* Left nav */}
                <div className="hidden sm:flex flex-col gap-1.5">
                  {['Dashboard', 'Roteiros', 'Carrossel', 'Métricas', 'Oratória'].map((item, i) => (
                    <div key={item}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${i === 0 ? 'bg-iara-600/25 text-iara-300 border border-iara-600/25' : 'text-[#4a4a6a]'}`}>
                      <div className={`w-2 h-2 rounded-sm ${i === 0 ? 'bg-iara-500' : 'bg-[#2a2a3a]'}`} />
                      {item}
                    </div>
                  ))}
                </div>
                {/* Main area */}
                <div className="col-span-3 sm:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 w-32 rounded-lg mb-1.5"
                        style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.5), rgba(168,85,247,0.3))' }} />
                      <div className="h-2.5 w-20 rounded bg-[#1a1a2e]" />
                    </div>
                    <div className="w-24 h-9 rounded-xl border border-iara-700/20"
                      style={{ background: 'rgba(99,102,241,0.12)' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Pontos', val: '2.840', color: '#818cf8' },
                      { label: 'Score voz', val: '94/100', color: '#a855f7' },
                      { label: 'Engajamento', val: '4.2%', color: '#ec4899' },
                      { label: 'Roteiros', val: '47 gerados', color: '#818cf8' },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-3 text-center border border-white/5"
                        style={{ background: 'rgba(10,10,20,0.7)' }}>
                        <p className="text-sm font-bold mb-0.5" style={{ color: s.color }}>{s.val}</p>
                        <p className="text-[10px] text-[#4a4a6a]">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {modules.slice(0, 3).map(m => {
                      const Icon = m.icon
                      return (
                        <div key={m.title}
                          className={`rounded-xl p-3 bg-gradient-to-br ${m.color} border ${m.border}`}>
                          <Icon className={`w-3.5 h-3.5 ${m.tag} mb-1.5`} />
                          <p className="text-[9px] font-medium text-[#9b9bb5] leading-tight">{m.title}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <div className="absolute -top-4 -left-4 md:-left-8 hidden md:block animate-float">
              <div className="rounded-2xl px-4 py-3 border border-green-700/30 shadow-xl shadow-black/60 text-left"
                style={{ background: 'rgba(10,10,20,0.9)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-glow-pulse" />
                  <p className="text-[11px] font-semibold text-green-400">Roteiro gerado</p>
                </div>
                <p className="text-[10px] text-[#5a5a7a] mt-0.5 max-w-[140px] leading-tight">"Hook do vídeo: O erro que 90% dos cria..."</p>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 md:-right-8 hidden md:block animate-float-2">
              <div className="rounded-2xl px-4 py-3 border border-iara-700/30 shadow-xl shadow-black/60 text-left"
                style={{ background: 'rgba(10,10,20,0.9)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3 h-3 text-iara-400" />
                  <p className="text-[11px] font-semibold text-iara-400">Score de Oratória</p>
                </div>
                <p className="text-xl font-black shimmer-text">94<span className="text-sm font-normal text-[#5a5a7a]">/100</span></p>
              </div>
            </div>

            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 hidden md:block animate-float-slow">
              <div className="rounded-2xl px-5 py-2.5 border border-accent-purple/30 shadow-xl shadow-black/60 flex items-center gap-3"
                style={{ background: 'rgba(10,10,20,0.9)', backdropFilter: 'blur(12px)' }}>
                <div className="flex -space-x-2">
                  {['#818cf8','#a855f7','#ec4899'].map(c => (
                    <div key={c} className="w-6 h-6 rounded-full border-2 border-[#08080f]"
                      style={{ background: c }} />
                  ))}
                </div>
                <p className="text-[11px] text-[#9b9bb5]">
                  <span className="font-bold text-[#f1f1f8]">+2.300 criadores</span> usando agora
                </p>
              </div>
            </div>

            {/* Glow under mockup */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-2/3 h-16 blur-[50px] rounded-full pointer-events-none animate-glow-pulse"
              style={{ background: 'rgba(99,102,241,0.25)' }} />
          </div>
        </div>
      </section>

      {/* ── MARQUEE TESTIMONIALS ─────────────────────────────────── */}
      <section ref={testReveal.ref} className="py-14 overflow-hidden border-y border-white/5">
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #08080f, transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, #08080f, transparent)' }} />
          <div className="flex gap-5 animate-marquee whitespace-nowrap">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i}
                className="inline-flex flex-col gap-3 p-5 rounded-2xl border border-white/6 flex-shrink-0 w-[320px] whitespace-normal"
                style={{ background: 'rgba(15,15,30,0.8)' }}>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  ))}
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

      {/* ── STATS ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div ref={statsReveal.ref} className={`max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 reveal ${statsReveal.visible ? 'visible' : ''}`}>
          <StatItem value={10}     suffix="+"    label="Módulos integrados"      started={statsReveal.visible} />
          <StatItem value={2300}   suffix="+"    label="Criadores na plataforma" started={statsReveal.visible} />
          <StatItem value={10}     suffix="B"    label="Mercado de influência/ano (R$)" started={statsReveal.visible} />
          <StatItem value={3}      suffix="h"    label="Economizadas por semana" started={statsReveal.visible} />
        </div>
      </section>

      {/* ── PROBLEM / PROMISE ───────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.06) 0%, transparent 60%)' }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-iara-400 text-xs font-bold uppercase tracking-widest mb-3">O Problema</p>
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-5">
                Você cria conteúdo incrível.<br />
                <span className="text-[#5a5a7a]">Mas nunca há tempo para pensar no próximo.</span>
              </h2>
              <div className="space-y-3">
                {[
                  'Horas gastas pensando em pauta, nada de conteúdo',
                  'Tom de voz inconsistente entre posts',
                  'Métricas espalhadas em 4 apps diferentes',
                  'Mídia kit desatualizado — perdendo parceiras',
                ].map(item => (
                  <div key={item} className="flex items-start gap-3 text-sm text-[#9b9bb5]">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/60 mt-1.5 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">Com a Iara</p>
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-5">
                Sua IA trabalha<br />
                <span className="shimmer-text">enquanto você cria.</span>
              </h2>
              <div className="space-y-3">
                {[
                  'Roteiro, hook e calendário em menos de 2 minutos',
                  'Perfil vocal salvo — sempre no seu tom',
                  'Dashboard unificado com análise estratégica',
                  'Mídia kit gerado e atualizado automaticamente',
                ].map(item => (
                  <div key={item} className="flex items-start gap-3 text-sm text-[#c4c4d8]">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MÓDULOS ───────────────────────────────────────────────── */}
      <section id="modulos" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div ref={modulesReveal.ref} className={`text-center mb-14 reveal ${modulesReveal.visible ? 'visible' : ''}`}>
            <p className="text-iara-400 text-xs font-bold uppercase tracking-widest mb-4">Tudo que você precisa</p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
              10 módulos. Um único objetivo:{' '}
              <span className="shimmer-text">seu crescimento.</span>
            </h2>
            <p className="text-[#6b6b8a] max-w-xl mx-auto">
              Cada módulo aprende com seu perfil e entrega resultados cada vez mais precisos.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {modules.map((m, i) => {
              const Icon = m.icon
              return (
                <div key={m.title}
                  className={`reveal reveal-delay-${Math.min(i % 5 + 1, 6)} card-glow rounded-2xl p-5 border ${m.border} bg-gradient-to-br ${m.color} hover:scale-[1.03] hover:shadow-xl hover:shadow-black/40 active:scale-[0.98] transition-all duration-300 cursor-default ${modulesReveal.visible ? 'visible' : ''}`}>
                  <div className="w-9 h-9 rounded-xl bg-[#08080f]/70 flex items-center justify-center mb-3 shadow-inner">
                    <Icon className={`w-4 h-4 ${m.tag}`} />
                  </div>
                  <h3 className="font-semibold text-[#f1f1f8] text-sm mb-1.5 leading-tight">{m.title}</h3>
                  <p className="text-xs text-[#6b6b8a] leading-relaxed">{m.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #08080f 0%, #0d0d1a 50%, #08080f 100%)' }}>
        <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div ref={howReveal.ref} className={`text-center mb-16 reveal ${howReveal.visible ? 'visible' : ''}`}>
            <p className="text-iara-400 text-xs font-bold uppercase tracking-widest mb-4">Simples assim</p>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Do zero ao seu{' '}
              <span className="shimmer-text">assessor pessoal de IA</span>
              {' '}em minutos.
            </h2>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[31px] md:left-[39px] top-10 bottom-10 w-px hidden md:block"
              style={{ background: 'linear-gradient(180deg, rgba(99,102,241,0.6), rgba(168,85,247,0.4), transparent)' }} />
            <div className="space-y-8">
              {steps.map((step, i) => (
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

      {/* ── PLANOS ────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── CTA FINAL ─────────────────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 relative overflow-hidden">
        {/* Massive glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none animate-orb-2"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)' }} />

        <div ref={ctaReveal.ref} className={`max-w-3xl mx-auto relative z-10 reveal ${ctaReveal.visible ? 'visible' : ''}`}>
          <div className="relative rounded-3xl overflow-hidden border border-white/8 shadow-2xl shadow-black/80 p-12 sm:p-16 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(15,15,30,0.95), rgba(20,10,35,0.95))' }}>
            {/* Inner glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)' }} />

            <div className="relative">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-iara-900/60"
                style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                <Sparkles className="w-7 h-7 text-white" />
              </div>

              <h2 className="text-3xl sm:text-5xl font-black leading-[1.1] mb-5">
                Sua próxima fase como criador{' '}
                <span className="shimmer-text">começa agora.</span>
              </h2>
              <p className="text-[#9b9bb5] text-lg mb-10 max-w-md mx-auto">
                Junte-se aos criadores que já têm uma IA trabalhando por eles — todos os dias.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
                <Link href="/register"
                  className="btn-shimmer group flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-2xl text-base font-bold text-white shadow-2xl shadow-iara-900/60 hover:scale-[1.03] hover:shadow-iara-800/60 transition-all duration-300"
                  style={{ background: 'linear-gradient(135deg,#6366f1 0%,#a855f7 60%,#ec4899 100%)' }}>
                  Criar conta grátis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/login" className="text-sm text-[#6b6b8a] hover:text-[#f1f1f8] transition-colors">
                  Já tenho conta →
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#3a3a5a]">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Dados seguros · LGPD</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500" /> Sem cartão de crédito</span>
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-iara-400" /> Acesso imediato</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold shimmer-text">Iara</span>
          </div>
          <p className="text-xs text-[#3a3a5a] text-center">
            © {new Date().getFullYear()} Iara. Feito no Brasil 🇧🇷 para criadores brasileiros.
          </p>
          <div className="flex items-center gap-5 text-xs text-[#3a3a5a]">
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
