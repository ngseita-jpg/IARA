'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  motion, useScroll, useTransform, useSpring,
  useInView, useMotionValue, useMotionTemplate,
  useMotionValueEvent, useReducedMotion, animate,
} from 'framer-motion'
import { IaraLogo } from '@/components/iara-logo'
import {
  Sparkles, FileText, Mic, Target, Calendar,
  TrendingUp, ArrowRight, Check, Zap, Shield,
  Layers, Image, Images, BookOpen, Smartphone,
  Clock, Brain, DollarSign, Users, ChevronDown,
  Flame, X, BarChart3, Gift, Lightbulb,
  Building2, ShoppingBag, Tag, Link2,
} from 'lucide-react'
import { PricingSection } from '@/components/pricing-section'

/* ── Variants ──────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.09 },
  }),
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1, scale: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
}

/* ── Data ──────────────────────────────────────────────────────── */
const modules = [
  { icon: Lightbulb,   title: 'Faísca Criativa',  desc: 'Chat com IA que descobre o melhor do seu conteúdo e gera temas com hook e ângulo.',  tag: 'text-iara-300',     color: 'from-iara-600/30 to-accent-purple/20',    border: 'border-iara-600/40',     glow: 'rgba(99,102,241,0.30)' },
  { icon: FileText,    title: 'Roteiros',          desc: 'Roteiros no seu tom, em 6 formatos, em menos de 60s.',                                tag: 'text-iara-400',     color: 'from-iara-600/20 to-accent-purple/10',    border: 'border-iara-700/20',     glow: 'rgba(99,102,241,0.20)' },
  { icon: Layers,      title: 'Carrossel',         desc: 'Cole o link. Slides completos com paleta e layout automáticos.',                       tag: 'text-accent-pink',  color: 'from-accent-pink/15 to-accent-purple/10', border: 'border-accent-pink/20',  glow: 'rgba(236,72,153,0.25)' },
  { icon: Image,       title: 'Thumbnail',         desc: 'Alto CTR. PNG 1280×720 com análise de composição.',                                   tag: 'text-accent-purple',color: 'from-accent-purple/20 to-iara-600/10',   border: 'border-accent-purple/30',glow: 'rgba(168,85,247,0.25)' },
  { icon: Smartphone,  title: 'Stories',           desc: 'Sequência de 7 slides. Hook, virada e CTA. Pronto para postar.',                      tag: 'text-accent-pink',  color: 'from-accent-pink/15 to-iara-600/10',     border: 'border-accent-pink/20',  glow: 'rgba(236,72,153,0.25)' },
  { icon: Mic,         title: 'Oratória',          desc: 'Score em 5 dimensões com exercícios personalizados.',                                 tag: 'text-accent-purple',color: 'from-accent-purple/20 to-iara-600/10',   border: 'border-accent-purple/30',glow: 'rgba(168,85,247,0.25)' },
  { icon: BookOpen,    title: 'Mídia Kit',         desc: 'Kit profissional automático. Exporta PDF para marcas.',                               tag: 'text-amber-400',    color: 'from-amber-900/20 to-iara-600/10',       border: 'border-amber-800/20',    glow: 'rgba(245,158,11,0.20)' },
  { icon: TrendingUp,  title: 'Métricas',          desc: 'IG + YT + TikTok com diagnóstico estratégico da IA.',                                 tag: 'text-iara-400',     color: 'from-iara-600/15 to-accent-pink/10',     border: 'border-iara-700/20',     glow: 'rgba(99,102,241,0.20)' },
  { icon: Target,      title: 'Metas',             desc: 'Gamificação com pontos e níveis. Do Iniciante ao Lenda.',                             tag: 'text-green-400',    color: 'from-green-900/20 to-iara-600/10',       border: 'border-green-800/20',    glow: 'rgba(34,197,94,0.20)'  },
  { icon: Calendar,    title: 'Calendário',        desc: 'Grade semanal integrada às metas. Planeje, execute, marque.',                         tag: 'text-teal-400',     color: 'from-teal-900/20 to-iara-600/10',        border: 'border-teal-800/20',     glow: 'rgba(20,184,166,0.20)' },
  { icon: Images,      title: 'Banco de Fotos',    desc: 'Armazenamento privado para usar nos geradores.',                                      tag: 'text-iara-400',     color: 'from-iara-600/15 to-teal-900/10',        border: 'border-iara-700/20',     glow: 'rgba(99,102,241,0.20)' },
]

const painPoints = [
  { icon: Clock,      title: 'Você fica horas em branco',       sub: 'O roteiro não vem. O carrossel fica para amanhã. E amanhã a culpa aparece no lugar da ideia.' },
  { icon: Brain,      title: 'Bloqueio criativo constante',      sub: 'Você sabe que tem algo a dizer — mas a página em branco paralisa. Todo dia. Todo mês.' },
  { icon: BarChart3,  title: 'Métricas espalhadas em 4 apps',   sub: 'Instagram numa aba, YouTube em outra, TikTok em outra. Nenhum diz o que fazer com os dados.' },
  { icon: DollarSign, title: 'Parcerias que passam batido',      sub: 'Seu mídia kit está desatualizado. A marca pediu. Você perdeu a oportunidade.' },
]

const affiliateTiers = [
  { name: 'Embaixador', commission: '15%', period: 'recorrente', desc: 'A partir de 10 indicações ativas, você recebe 15% de tudo que eles pagam enquanto forem assinantes.', color: 'from-iara-900/40 to-accent-purple/10', border: 'border-iara-700/30',     tag: 'text-iara-400',     badge: null },
  { name: 'Parceiro',   commission: '20%', period: 'recorrente', desc: 'Com 30 indicações ativas, você sobe de nível e passa a ganhar 20% recorrente para sempre.',            color: 'from-accent-purple/20 to-accent-pink/10', border: 'border-accent-purple/40', tag: 'text-accent-purple', badge: null },
  { name: 'Elite',      commission: '25%', period: 'recorrente', desc: '50 indicações ativas. O topo da pirâmide — 25% recorrente mais bônus trimestral por volume.',          color: 'from-accent-pink/20 to-iara-600/10',  border: 'border-accent-pink/40',  tag: 'text-accent-pink',  badge: null },
]

const bandItems = ['ROTEIROS', 'CARROSSEL', 'THUMBNAIL', 'STORIES', 'ORATÓRIA', 'MÉTRICAS', 'METAS', 'CALENDÁRIO', 'MÍDIA KIT', 'FAÍSCA CRIATIVA']

/* ── AnimatedCounter ────────────────────────────────────────────── */
function AnimatedCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const numRef = useRef<HTMLParagraphElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inView = useInView(wrapRef, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!inView || !numRef.current) return
    const controls = animate(0, value, {
      duration: 2.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(v) {
        if (numRef.current) numRef.current.textContent = Math.round(v).toLocaleString('pt-BR') + suffix
      },
    })
    return controls.stop
  }, [inView, value, suffix])

  return (
    <motion.div ref={wrapRef} className="text-center" variants={fadeUp}>
      <p ref={numRef} className="text-4xl sm:text-5xl font-black shimmer-text mb-2 tabular-nums">0{suffix}</p>
      <p className="text-sm text-[#5a5a7a]">{label}</p>
    </motion.div>
  )
}

/* ── ModuleCard (3-D tilt) ──────────────────────────────────────── */
function ModuleCard({ mod, index }: { mod: typeof modules[0]; index: number }) {
  const Icon = mod.icon
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotX = useTransform(my, [-60, 60], [6, -6])
  const rotY = useTransform(mx, [-60, 60], [-6, 6])
  const sRotX = useSpring(rotX, { stiffness: 250, damping: 25 })
  const sRotY = useSpring(rotY, { stiffness: 250, damping: 25 })

  return (
    <motion.div
      variants={fadeUp}
      custom={index % 5}
      style={{ rotateX: sRotX, rotateY: sRotY, transformStyle: 'preserve-3d' }}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set(e.clientX - r.left - r.width / 2)
        my.set(e.clientY - r.top - r.height / 2)
      }}
      onMouseLeave={() => { mx.set(0); my.set(0) }}
      whileHover={{ scale: 1.05 }}
      transition={{ scale: { type: 'spring', stiffness: 280, damping: 20 } }}
      className={`rounded-2xl p-5 border ${mod.border} bg-gradient-to-br ${mod.color} cursor-default relative overflow-hidden group`}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${mod.glow}, transparent 70%)` }}
      />
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-xl bg-[#08080f]/70 flex items-center justify-center mb-3.5 shadow-inner">
          <Icon className={`w-5 h-5 ${mod.tag}`} />
        </div>
        <h3 className="font-bold text-[#f1f1f8] text-sm mb-2 leading-tight">{mod.title}</h3>
        <p className="text-xs text-[#6b6b8a] leading-relaxed">{mod.desc}</p>
      </div>
    </motion.div>
  )
}

/* ── MAIN ────────────────────────────────────────────────────────── */
export function LandingPage() {
  const shouldReduce = useReducedMotion()

  const { scrollY, scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 400, damping: 40 })

  const heroContentY = useTransform(scrollY, [0, 700], [0, shouldReduce ? 0 : 180])
  const heroOpacity  = useTransform(scrollY, [0, 550], [1, shouldReduce ? 1 : 0])
  const orbY         = useTransform(scrollY, [0, 700], [0, shouldReduce ? 0 : -130])
  const orb2Y        = useTransform(scrollY, [0, 700], [0, shouldReduce ? 0 : -80])
  const orb3Y        = useTransform(scrollY, [0, 700], [0, shouldReduce ? 0 : -60])

  const mouseX   = useMotionValue(0)
  const mouseY   = useMotionValue(0)
  const heroGlow = useMotionTemplate`radial-gradient(700px circle at ${mouseX}px ${mouseY}px, rgba(99,102,241,0.09), transparent 40%)`

  const [navScrolled, setNavScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', v => setNavScrolled(v > 40))

  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouseX.set(e.clientX); mouseY.set(e.clientY) }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [mouseX, mouseY])

  return (
    <div className="min-h-screen bg-[#08080f] text-[#f1f1f8] overflow-x-hidden">

      {/* ── Scroll progress bar ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left pointer-events-none"
        style={{ scaleX: smoothProgress, background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)' }}
      />

      {/* ── NAV ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: navScrolled ? 'rgba(8,8,15,0.88)' : 'transparent',
          backdropFilter: navScrolled ? 'blur(24px)' : 'none',
          borderBottom: navScrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between"
        >
          <Link href="/"><IaraLogo size="sm" layout="horizontal" /></Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-[#6b6b8a]">
            {[
              ['#modulos','Módulos'],
              ['#afiliacao','Afiliação'],
              ['#planos','Planos'],
              ['#indique','Indique e Ganhe'],
            ].map(([href,label]) => (
              <a key={href} href={href} className="hover:text-[#f1f1f8] transition-colors duration-200 relative group cursor-pointer">
                {label}
                <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-iara-500 to-accent-purple scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </a>
            ))}
            <Link
              href="/empresas"
              className="flex items-center gap-1.5 text-sm font-medium text-[#9b9bb5] hover:text-[#f1f1f8] border border-white/10 hover:border-iara-700/50 hover:bg-iara-900/20 px-3 py-1.5 rounded-xl transition-all duration-200"
            >
              <Building2 className="w-3.5 h-3.5" />
              Para Empresas
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm text-[#6b6b8a] hover:text-[#f1f1f8] transition-colors">Entrar</Link>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/register"
                className="btn-shimmer flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-iara-900/40"
                style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }}>
                Começar grátis
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 px-4 sm:px-6 overflow-hidden">

        {/* SVG grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          <defs>
            <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(99,102,241,0.07)" strokeWidth="0.8"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>

        {/* Mouse glow spotlight */}
        <motion.div className="absolute inset-0 pointer-events-none" style={{ background: heroGlow }} />

        {/* Orbs */}
        <motion.div className="absolute top-1/4 left-1/2 w-[1000px] h-[700px] rounded-full pointer-events-none animate-orb-1"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)', y: orbY, x: '-50%' }} />
        <motion.div className="absolute top-1/3 left-[10%] w-[450px] h-[450px] rounded-full pointer-events-none animate-orb-2"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 70%)', y: orb2Y }} />
        <motion.div className="absolute top-1/4 right-[8%] w-[320px] h-[320px] rounded-full pointer-events-none animate-orb-3"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)', y: orb3Y }} />

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #08080f 88%)' }} />

        {/* Hero content — parallax on scroll */}
        <motion.div
          className="relative max-w-5xl mx-auto text-center z-10"
          style={{ y: heroContentY, opacity: heroOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-iara-700/40 bg-iara-950/60 text-iara-300 text-xs font-medium mb-10"
          >
            <Flame className="w-3.5 h-3.5 text-iara-400 animate-glow-pulse" />
            A plataforma que une criadores e marcas · Feito no Brasil
          </motion.div>

          {/* Headline — staggered lines */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[82px] font-black leading-[1.02] tracking-tight mb-6">
            {[
              { text: 'Pare de desperdiçar', delay: 0.2 },
              { text: 'horas tentando',       delay: 0.35 },
              { text: 'achar o que criar.',   delay: 0.5, shimmer: true },
            ].map((line, i) => (
              <motion.span
                key={i}
                className={`block ${line.shimmer ? 'shimmer-text' : ''}`}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: line.delay, ease: [0.22, 1, 0.36, 1] }}
              >
                {line.text}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="text-lg sm:text-xl md:text-2xl text-[#9b9bb5] max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            A Iara é sua assessora de comunicação com IA. Aprende seu estilo, fala na sua voz e entrega roteiro, carrossel, thumbnail e calendário —{' '}
            <span className="text-[#f1f1f8] font-semibold">em minutos, não horas.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/register"
                className="btn-shimmer group flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-2xl text-base font-bold text-white shadow-2xl shadow-iara-900/50 hover:shadow-iara-800/70 transition-shadow duration-300"
                style={{ background: 'linear-gradient(135deg,#6366f1 0%,#a855f7 55%,#ec4899 100%)' }}>
                Começar grátis agora
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <a href="#modulos"
              className="flex items-center gap-2 w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-semibold text-[#9b9bb5] border border-white/10 hover:border-iara-700/50 hover:text-[#f1f1f8] hover:bg-iara-900/20 transition-all duration-300 cursor-pointer">
              Ver os 10 módulos
              <ChevronDown className="w-4 h-4 opacity-50" />
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="text-xs text-[#3a3a5a]"
          >
            Sem cartão de crédito · Plano gratuito para sempre · Cancele quando quiser
          </motion.p>

          {/* Mobile social proof strip — visible only on mobile, replaces floating badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="flex sm:hidden items-center justify-center gap-5 mt-8 pt-6 border-t border-white/5"
          >
            {[
              { value: '10+', label: 'Módulos IA' },
              { value: '6h+', label: 'Economizadas/semana' },
              { value: '100%', label: 'Feito pro Brasil' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-black shimmer-text leading-none">{s.value}</p>
                <p className="text-[10px] text-[#4a4a6a] mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* App mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-10 sm:mt-16 mx-2 sm:mx-0"
          >
            <motion.div
              animate={shouldReduce ? {} : { y: [0, -10, 0] }}
              transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
              className="relative mx-auto max-w-3xl rounded-[20px] overflow-hidden border border-white/8 shadow-[0_40px_120px_rgba(0,0,0,0.85)]"
              style={{ background: 'linear-gradient(150deg, #0d0d1e 0%, #111121 100%)' }}
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5" style={{ background: 'rgba(8,8,16,0.9)' }}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex-1 mx-4 h-6 rounded-lg flex items-center px-3 text-xs text-[#3a3a5a]" style={{ background: 'rgba(20,20,40,0.9)' }}>
                  iarahubapp.com.br/dashboard · Roteiro gerado em 12s
                </div>
              </div>
              <div className="p-5 grid grid-cols-3 gap-4">
                <div className="hidden sm:flex flex-col gap-1.5">
                  {['Dashboard','Faísca Criativa','Roteiros','Carrossel','Métricas'].map((item, i) => (
                    <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${i === 1 ? 'bg-iara-600/25 text-iara-300 border border-iara-600/25' : 'text-[#4a4a6a]'}`}>
                      <div className={`w-2 h-2 rounded-sm ${i === 1 ? 'bg-iara-500' : 'bg-[#2a2a3a]'}`} />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="col-span-3 sm:col-span-2 space-y-3">
                  <div className="rounded-xl p-4 border border-iara-700/20" style={{ background: 'rgba(10,10,22,0.8)' }}>
                    <p className="text-[10px] text-iara-400 font-semibold mb-2">Roteiro · Reels · 60s</p>
                    <div className="space-y-1.5">
                      {[{w:'w-full',o:1},{w:'w-5/6',o:0.85},{w:'w-4/5',o:0.7},{w:'w-3/4',o:0.5},{w:'w-1/2',o:0.25}].map((l, li) => (
                        <motion.div key={li} className={`h-2.5 ${l.w} rounded-full`}
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={{ scaleX: 1, opacity: l.o }}
                          transition={{ duration: 0.6, delay: 1.2 + li * 0.12, ease: 'easeOut' }}
                          style={{ background: `rgba(99,102,241,${l.o * 0.4})`, transformOrigin: 'left' }}
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-glow-pulse" />
                      <p className="text-[10px] text-green-400 font-medium">Pronto em 12 segundos</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[{label:'Score voz',val:'94/100',color:'#a855f7'},{label:'Engajamento',val:'4.2%',color:'#ec4899'},{label:'Roteiros',val:'47',color:'#818cf8'}].map(s => (
                      <div key={s.label} className="rounded-xl p-3 text-center border border-white/5" style={{ background: 'rgba(10,10,20,0.7)' }}>
                        <p className="text-sm font-bold mb-0.5" style={{ color: s.color }}>{s.val}</p>
                        <p className="text-[9px] text-[#4a4a6a]">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating badges */}
            <motion.div animate={shouldReduce ? {} : { y: [0,-10,0] }} transition={{ duration: 4.5, ease: 'easeInOut', repeat: Infinity }}
              className="absolute -top-4 -left-4 md:-left-10 hidden md:flex">
              <div className="rounded-2xl px-4 py-3 border border-green-700/30 shadow-xl shadow-black/60" style={{ background: 'rgba(8,8,18,0.95)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-glow-pulse" />
                  <p className="text-[11px] font-semibold text-green-400">Roteiro gerado</p>
                </div>
                <p className="text-[10px] text-[#5a5a7a] mt-0.5 max-w-[140px] leading-tight">"Hook: O erro que 90% dos criadores..."</p>
              </div>
            </motion.div>

            <motion.div animate={shouldReduce ? {} : { y: [0,-12,0] }} transition={{ duration: 5.5, ease: 'easeInOut', repeat: Infinity, delay: 1 }}
              className="absolute -top-4 -right-4 md:-right-10 hidden md:flex">
              <div className="rounded-2xl px-4 py-3 border border-iara-700/30 shadow-xl shadow-black/60" style={{ background: 'rgba(8,8,18,0.95)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3 h-3 text-iara-400" />
                  <p className="text-[11px] font-semibold text-iara-400">Score de Oratória</p>
                </div>
                <p className="text-xl font-black shimmer-text">94<span className="text-sm font-normal text-[#5a5a7a]">/100</span></p>
              </div>
            </motion.div>

            <motion.div animate={shouldReduce ? {} : { y: [0,-8,0] }} transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity, delay: 2 }}
              className="absolute -bottom-5 left-1/2 -translate-x-1/2 hidden md:flex">
              <div className="rounded-2xl px-5 py-2.5 border border-accent-purple/30 shadow-xl shadow-black/60 flex items-center gap-3" style={{ background: 'rgba(8,8,18,0.95)', backdropFilter: 'blur(16px)' }}>
                <div className="flex -space-x-2">
                  {['#818cf8','#a855f7','#ec4899'].map(c => (
                    <div key={c} className="w-6 h-6 rounded-full border-2 border-[#08080f]" style={{ background: c }} />
                  ))}
                </div>
                <p className="text-[11px] text-[#9b9bb5]">
                  <span className="font-bold text-[#f1f1f8]">10 módulos</span> de IA integrados
                </p>
              </div>
            </motion.div>

            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 blur-[60px] rounded-full pointer-events-none animate-glow-pulse"
              style={{ background: 'rgba(99,102,241,0.28)' }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── SCROLLING TEXT BAND ── */}
      <section className="py-5 overflow-hidden border-y border-white/5 bg-[#090910]">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
          className="flex gap-10 whitespace-nowrap"
        >
          {[...bandItems, ...bandItems, ...bandItems, ...bandItems].map((item, i) => (
            <span key={i} className="text-xs font-bold tracking-[0.25em] text-[#3a3a5a] uppercase flex items-center gap-10">
              {item}
              <span className="inline-block w-1 h-1 rounded-full bg-iara-600/60 flex-shrink-0" />
            </span>
          ))}
        </motion.div>
      </section>

      {/* ── DOR ── */}
      <section className="py-16 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(220,38,38,0.04) 0%, transparent 60%)' }} />
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-red-800/40 bg-red-950/30 text-red-400 text-xs font-medium mb-6">
              <X className="w-3.5 h-3.5" /> Se você se reconhece em algum desses cenários...
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4">
              Bloqueio criativo não é falta<br />
              <span style={{ color: 'rgba(220,38,38,0.85)' }}>de talento. É falta de sistema.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[#6b6b8a] text-lg max-w-xl mx-auto">
              E nenhum sistema foi feito especificamente para criadores brasileiros. Até agora.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={stagger} className="grid md:grid-cols-2 gap-5">
            {painPoints.map((p, i) => {
              const Icon = p.icon
              return (
                <motion.div key={i} variants={fadeUp} custom={i}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                  className="group flex gap-4 p-6 rounded-2xl border border-red-900/20 hover:border-red-800/35 transition-colors duration-300 cursor-default"
                  style={{ background: 'rgba(12,6,6,0.7)' }}
                >
                  <motion.div whileHover={{ scale: 1.15, rotate: -5 }} transition={{ type: 'spring', stiffness: 300 }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(220,38,38,0.1)' }}>
                    <Icon className="w-5 h-5 text-red-400/70" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-[#f1f1f8] mb-1">{p.title}</h3>
                    <p className="text-sm text-[#6b6b8a] leading-relaxed">{p.sub}</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ── SOLUÇÃO ── */}
      <section className="py-20 px-4 sm:px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #08080f 0%, #0b0b18 50%, #08080f 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.10) 0%, transparent 65%)' }} />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}
          className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-green-800/40 bg-green-950/30 text-green-400 text-xs font-medium mb-8">
            <Check className="w-3.5 h-3.5" /> A solução existe. Está aqui.
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] mb-8">
            A Iara aprende a sua voz.<br />
            <span className="shimmer-text">Fala por você. Trabalha por você.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-xl text-[#9b9bb5] max-w-2xl mx-auto mb-10 leading-relaxed">
            Não é uma IA genérica que gera texto sem alma. A Iara absorve o seu nicho, o seu tom, os seus formatos — e entrega conteúdo que parece que saiu da sua cabeça, não de uma máquina.
          </motion.p>
          <motion.div variants={stagger} className="grid sm:grid-cols-3 gap-4 text-left">
            {[
              { icon: Zap,        color: 'text-iara-400',     bg: 'rgba(99,102,241,0.1)',  border: 'border-iara-700/25',     title: 'Rápido de verdade', sub: 'Roteiro, carrossel e thumbnails em menos de 2 minutos. Sem exagero.' },
              { icon: Brain,      color: 'text-accent-purple',bg: 'rgba(168,85,247,0.1)',  border: 'border-accent-purple/25',title: 'Personalizado',     sub: 'Cada output usa o seu perfil vocal, nicho e estilo. Nada genérico.' },
              { icon: TrendingUp, color: 'text-accent-pink',  bg: 'rgba(236,72,153,0.1)',  border: 'border-accent-pink/25',  title: 'Tudo integrado',    sub: '10 módulos que se falam. Calendário, metas, métricas, mídia kit.' },
            ].map((f, i) => {
              const FIcon = f.icon
              return (
                <motion.div key={i} variants={fadeUp} custom={i}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  className={`p-5 rounded-2xl border ${f.border} cursor-default`}
                  style={{ background: f.bg }}>
                  <FIcon className={`w-5 h-5 ${f.color} mb-3`} />
                  <h3 className="font-bold text-[#f1f1f8] mb-1">{f.title}</h3>
                  <p className="text-sm text-[#6b6b8a] leading-relaxed">{f.sub}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* ── ROI DO TEMPO ── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
            <motion.div variants={stagger} className="text-center mb-14">
              <motion.p variants={fadeUp} className="text-iara-400 text-xs font-bold uppercase tracking-widest mb-4">A Matemática do Tempo</motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-black mb-4 leading-tight">
                Quanto tempo você joga fora<br />
                <span className="shimmer-text">tentando pensar no que criar?</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-[#6b6b8a] max-w-xl mx-auto">
                Criadores gastam mais de 6 horas por semana só com planejamento. Com a Iara, esse tempo cai para menos de 30 minutos.
              </motion.p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <motion.div variants={fadeUp} custom={0} className="rounded-2xl p-8 border border-red-900/25" style={{ background: 'rgba(10,4,4,0.8)' }}>
                <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-6">Sem a Iara</p>
                <div className="space-y-4">
                  {[{label:'Pensar em pauta',time:'~2h'},{label:'Escrever roteiro',time:'~90 min'},{label:'Montar carrossel',time:'~60 min'},{label:'Criar thumbnail',time:'~30 min'},{label:'Stories + legenda',time:'~45 min'},{label:'Calendário + planejamento',time:'~30 min'}].map(r => (
                    <div key={r.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5"><Clock className="w-4 h-4 text-red-500/60" /><span className="text-sm text-[#9b9bb5]">{r.label}</span></div>
                      <span className="text-sm font-bold text-red-400">{r.time}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-red-900/30 flex items-center justify-between">
                    <span className="font-bold text-[#f1f1f8]">Total por semana</span>
                    <span className="text-lg font-black text-red-400">~6h</span>
                  </div>
                  <p className="text-xs text-[#4a4a6a]">= mais de 300 horas por ano. Horas que você não vai recuperar.</p>
                </div>
              </motion.div>
              <motion.div variants={fadeUp} custom={1} className="rounded-2xl p-8 border border-green-900/25 relative overflow-hidden" style={{ background: 'rgba(4,10,4,0.8)' }}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.05) 0%, transparent 60%)' }} />
                <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-6 relative z-10">Com a Iara</p>
                <div className="space-y-4 relative z-10">
                  {[{label:'Roteiro completo',time:'~2 min'},{label:'Carrossel montado',time:'~3 min'},{label:'Thumbnail gerada',time:'~1 min'},{label:'Stories + legenda',time:'~2 min'},{label:'Calendário ajustado',time:'~2 min'},{label:'Ideias com Faísca IA',time:'~10 min'}].map(r => (
                    <div key={r.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-green-400" /><span className="text-sm text-[#9b9bb5]">{r.label}</span></div>
                      <span className="text-sm font-bold text-green-400">{r.time}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-green-900/30 flex items-center justify-between">
                    <span className="font-bold text-[#f1f1f8]">Total por semana</span>
                    <span className="text-lg font-black text-green-400">~20 min</span>
                  </div>
                  <p className="text-xs text-[#4a4a6a]">= 300+ horas devolvidas por ano. Use criando, crescendo.</p>
                </div>
              </motion.div>
            </div>
            <motion.div variants={scaleIn}
              className="rounded-2xl p-10 border border-iara-700/25 text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.05))' }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />
              <p className="relative z-10 text-[#6b6b8a] text-sm mb-3 uppercase tracking-widest font-bold">O que você faz com 300 horas por ano a mais?</p>
              <p className="relative z-10 text-5xl sm:text-7xl font-black shimmer-text mb-4">300h</p>
              <p className="relative z-10 text-lg text-[#9b9bb5] max-w-lg mx-auto">
                Mais vídeos. Mais parcerias. Mais descanso. Mais vida.<br />
                <span className="text-[#f1f1f8] font-semibold">A Iara não substitui sua criatividade — ela libera ela.</span>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 px-4 sm:px-6 border-y border-white/5" style={{ background: 'linear-gradient(180deg, #08080f 0%, #0c0c1c 100%)' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger}
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
          <AnimatedCounter value={11}  suffix="+"  label="Módulos integrados" />
          <AnimatedCounter value={6}   suffix="h+" label="Economizadas por semana" />
          <AnimatedCounter value={300} suffix="h+" label="Economizadas por ano" />
          <AnimatedCounter value={10}  suffix="B"  label="Mercado de influência (R$/ano)" />
        </motion.div>
      </section>

      {/* ── B2B TEASER — para empresas ── */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl overflow-hidden border border-accent-purple/20 p-8 sm:p-10"
            style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(99,102,241,0.05) 50%, rgba(8,8,15,0.95) 100%)' }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(168,85,247,0.12) 0%, transparent 55%)' }} />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-purple/30 bg-accent-purple/10 text-accent-purple text-xs font-bold mb-5">
                  <Building2 className="w-3.5 h-3.5" />
                  Para Marcas &amp; Empresas
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#f1f1f8] leading-tight mb-3">
                  Sua marca na frente de<br />
                  <span className="shimmer-text">milhares de criadores ativos.</span>
                </h2>
                <p className="text-[#9b9bb5] text-base max-w-lg leading-relaxed">
                  Anuncie campanhas para criadores que já usam a Iara diariamente. Gerencie afiliações de produtos, encontre influenciadores alinhados ao seu nicho e feche parcerias diretamente na plataforma.
                </p>
                <div className="flex flex-wrap gap-4 mt-6 text-sm text-[#6b6b8a]">
                  {[
                    { icon: Sparkles, label: 'Campanhas anunciadas na plataforma' },
                    { icon: Tag,      label: 'Programa de afiliação de produtos' },
                    { icon: Users,    label: 'Catálogo de criadores segmentados' },
                  ].map(f => (
                    <span key={f.label} className="flex items-center gap-1.5">
                      <f.icon className="w-3.5 h-3.5 text-accent-purple/70" />
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 flex-shrink-0">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/empresas"
                    className="btn-shimmer group flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white shadow-xl shadow-accent-purple/20 whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)' }}>
                    Conhecer a área de empresas
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
                <Link href="/register?tipo=marca" className="text-center text-xs text-[#5a5a7a] hover:text-[#9b9bb5] transition-colors">
                  Já tenho conta como marca →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MÓDULOS ── */}
      <section id="modulos" className="py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-iara-400 text-xs font-bold uppercase tracking-widest mb-4">Tudo que você precisa</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4">
              10 módulos. Um único objetivo:{' '}
              <span className="shimmer-text">seu crescimento.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[#6b6b8a] max-w-xl mx-auto text-lg">
              Cada módulo aprende com seu perfil. Os resultados ficam mais precisos a cada uso.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
            style={{ perspective: '1200px' }}
          >
            {modules.map((m, i) => <ModuleCard key={m.title} mod={m} index={i} />)}
          </motion.div>
        </div>
      </section>

      {/* ── AFILIAÇÃO DE PRODUTOS ── */}
      <section id="afiliacao" className="py-28 px-4 sm:px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #08080f 0%, #0d0b1a 50%, #08080f 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(236,72,153,0.07) 0%, transparent 55%)' }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent-pink/30 bg-accent-pink/10 text-accent-pink text-xs font-bold mb-8">
              <Tag className="w-3.5 h-3.5" />
              Afiliação de Produtos · Nova fonte de renda
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-5">
              Divulgue produtos de marcas.<br />
              <span className="shimmer-text">Ganhe a cada venda gerada.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[#6b6b8a] text-lg max-w-2xl mx-auto leading-relaxed">
              Marcas cadastram seus produtos direto na Iara. Você escolhe o que faz sentido para o seu nicho, gera seu link exclusivo ou cupom personalizado — e recebe por cada venda que vier do seu público. Simples, rastreável, automático.
            </motion.p>
          </motion.div>

          {/* Como funciona — 3 passos visuais */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={stagger}
            className="grid md:grid-cols-3 gap-5 mb-14">
            {[
              {
                icon: ShoppingBag,
                num: '01',
                title: 'Marcas cadastram produtos',
                desc: 'Empresas de todos os nichos disponibilizam produtos no catálogo da Iara com comissão definida por venda.',
                color: 'from-accent-pink/20 to-accent-purple/10',
                border: 'border-accent-pink/25',
                tag: 'text-accent-pink',
              },
              {
                icon: Link2,
                num: '02',
                title: 'Você gera seu link ou cupom',
                desc: 'Com um clique, você cria seu link de afiliado ou cupom exclusivo. Compartilhe onde seu público está.',
                color: 'from-accent-purple/20 to-iara-600/10',
                border: 'border-accent-purple/25',
                tag: 'text-accent-purple',
              },
              {
                icon: DollarSign,
                num: '03',
                title: 'Venda acontece, comissão cai',
                desc: 'Cada compra rastreada pelo seu link gera comissão automática na sua conta. Sem intermediários, sem espera.',
                color: 'from-green-900/25 to-teal-900/10',
                border: 'border-green-800/25',
                tag: 'text-green-400',
              },
            ].map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div key={i} variants={fadeUp} custom={i}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className={`relative rounded-2xl p-7 border ${step.border} bg-gradient-to-br ${step.color} cursor-default overflow-hidden`}>
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-[#08080f]/60 flex items-center justify-center shadow-inner">
                      <Icon className={`w-6 h-6 ${step.tag}`} />
                    </div>
                    <span className="text-4xl font-black text-[#1a1a2e]">{step.num}</span>
                  </div>
                  <h3 className="font-bold text-[#f1f1f8] text-base mb-2 leading-snug">{step.title}</h3>
                  <p className="text-sm text-[#9b9bb5] leading-relaxed">{step.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Destaque: catálogo + rastreamento */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }} variants={stagger}
            className="grid md:grid-cols-2 gap-5">
            <motion.div variants={fadeUp}
              className="rounded-2xl p-7 border border-iara-700/25 relative overflow-hidden"
              style={{ background: 'rgba(12,10,22,0.8)' }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 0% 50%, rgba(99,102,241,0.08) 0%, transparent 60%)' }} />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-iara-600/15 border border-iara-700/30 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-5 h-5 text-iara-400" />
                </div>
                <h3 className="font-bold text-[#f1f1f8] text-lg mb-2">Catálogo exclusivo de produtos</h3>
                <p className="text-[#9b9bb5] text-sm leading-relaxed">
                  Só marcas que passaram pela verificação da Iara aparecem no catálogo. Você escolhe apenas produtos que fazem sentido para sua audiência — sem spamear, sem perder credibilidade.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['Beleza','Tech','Fitness','Moda','Casa','Alimentação'].map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-iara-900/40 text-iara-400 border border-iara-800/30">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} custom={1}
              className="rounded-2xl p-7 border border-accent-pink/20 relative overflow-hidden"
              style={{ background: 'rgba(12,8,16,0.8)' }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 100% 50%, rgba(236,72,153,0.08) 0%, transparent 60%)' }} />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-accent-pink/10 border border-accent-pink/20 flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5 text-accent-pink" />
                </div>
                <h3 className="font-bold text-[#f1f1f8] text-lg mb-2">Rastreamento em tempo real</h3>
                <p className="text-[#9b9bb5] text-sm leading-relaxed">
                  Veja quantas visitas seu link gerou, quantas converteram em venda e quanto você vai receber este mês — tudo no seu painel da Iara, junto com todos os outros módulos.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[{v:'R$ 0',l:'Ganho este mês'},{v:'0',l:'Vendas'},{v:'0%',l:'Taxa de conv.'}].map(s => (
                    <div key={s.l} className="text-center">
                      <p className="text-lg font-black shimmer-text">{s.v}</p>
                      <p className="text-[10px] text-[#4a4a6a] mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-10"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
              <Link href="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg shadow-accent-pink/20"
                style={{ background: 'linear-gradient(135deg,#ec4899,#a855f7)' }}>
                Quero ser afiliado de marcas
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #08080f 0%, #0d0d1a 50%, #08080f 100%)' }}>
        <div className="absolute inset-0 dot-grid opacity-15 pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-iara-400 text-xs font-bold uppercase tracking-widest mb-4">Simples assim</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black">
              Do zero ao seu{' '}
              <span className="shimmer-text">assessor pessoal de IA</span>{' '}
              em minutos.
            </motion.h2>
          </motion.div>
          <div className="relative">
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-[31px] md:left-[39px] top-10 bottom-10 w-px hidden md:block origin-top"
              style={{ background: 'linear-gradient(180deg, rgba(99,102,241,0.7), rgba(168,85,247,0.4), transparent)' }}
            />
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }} variants={stagger} className="space-y-10">
              {[
                { num: '01', title: 'Configure seu perfil',  desc: 'Informe nicho, tom de voz e plataformas. A Iara aprende quem você é e fala do seu jeito — não de qualquer criador.', color: 'from-iara-600/20 to-accent-purple/10', border: 'border-iara-700/30' },
                { num: '02', title: 'Use os módulos',        desc: 'Roteiros, carrosseis, thumbnails, stories, métricas, mídia kit — tudo gerado com a SUA personalidade, não um template genérico.', color: 'from-accent-purple/20 to-accent-pink/10', border: 'border-accent-purple/30' },
                { num: '03', title: 'Crie, publique, cresça',desc: 'Histórico salvo, metas gamificadas, calendário integrado. Você foca no que importa. A Iara cuida do resto.', color: 'from-accent-pink/15 to-iara-600/10', border: 'border-accent-pink/20' },
              ].map((step, i) => (
                <motion.div key={step.num} variants={fadeUp} custom={i} className="flex gap-6 items-start">
                  <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: 'spring', stiffness: 300 }}
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} border ${step.border} flex items-center justify-center flex-shrink-0 relative z-10 shadow-xl shadow-black/40 cursor-default`}>
                    <span className="text-xl font-black shimmer-text">{step.num}</span>
                  </motion.div>
                  <div className="pt-3 flex-1">
                    <h3 className="text-xl font-bold text-[#f1f1f8] mb-1.5">{step.title}</h3>
                    <p className="text-[#9b9bb5] leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <PricingSection />

      {/* ── AFILIADOS (Indique e Ganhe) ── */}
      <section id="indique" className="py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(168,85,247,0.08) 0%, transparent 65%)' }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger} className="text-center mb-14">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent-purple/30 bg-accent-purple/10 text-accent-purple text-xs font-bold mb-8">
              <Gift className="w-3.5 h-3.5" /> Programa de Parcerias · Indique e Ganhe
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-5">
              Use a Iara. Indique a Iara.<br />
              <span className="shimmer-text">Ganhe todo mês por isso.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[#6b6b8a] text-lg max-w-2xl mx-auto">
              Cada criador que você indica gera comissão recorrente para você enquanto ele for assinante. Não é MLM — é simplesmente compartilhar algo que funciona e ser remunerado por isso.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={stagger} className="grid md:grid-cols-3 gap-5 mb-12">
            {affiliateTiers.map((tier, i) => (
              <motion.div key={tier.name} variants={fadeUp} custom={i}
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 250, damping: 20 }}
                className={`relative rounded-2xl p-7 border ${tier.border} bg-gradient-to-br ${tier.color} cursor-default`}>
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
              </motion.div>
            ))}
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={scaleIn}
            className="rounded-2xl p-8 border border-white/8 text-center" style={{ background: 'rgba(12,12,24,0.7)' }}>
            <Users className="w-8 h-8 text-iara-400 mx-auto mb-4" />
            <h3 className="font-bold text-[#f1f1f8] text-lg mb-2">Como funciona</h3>
            <div className="grid sm:grid-cols-3 gap-6 mt-6 text-sm text-[#9b9bb5]">
              {[
                { num: '1', text: 'Crie sua conta e ative seu link único de afiliado no painel.' },
                { num: '2', text: 'Compartilhe com sua comunidade, stories, reels — do jeito que você preferir.' },
                { num: '3', text: 'Cada assinatura ativa gera comissão mensal automaticamente na sua conta.' },
              ].map(s => (
                <div key={s.num} className="flex flex-col items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-iara-700/40 bg-iara-950/60 flex items-center justify-center text-sm font-black text-iara-400">{s.num}</div>
                  <p className="leading-relaxed text-center">{s.text}</p>
                </div>
              ))}
            </div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block mt-8">
              <Link href="/register"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>
                Quero ser parceiro <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-32 px-4 sm:px-6 relative overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
          animate={shouldReduce ? {} : { scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity }}
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 65%)' }}
        />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}
          className="max-w-3xl mx-auto relative z-10">
          <motion.div variants={scaleIn}
            className="relative rounded-3xl overflow-hidden border border-white/8 shadow-[0_60px_200px_rgba(0,0,0,0.9)] p-12 sm:p-20 text-center"
            style={{ background: 'linear-gradient(160deg, rgba(12,12,28,0.98), rgba(18,8,32,0.98))' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 55%)' }} />
            <div className="relative">
              <motion.div
                animate={shouldReduce ? {} : { scale: [1, 1.06, 1] }}
                transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
                className="w-[72px] h-[72px] rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-iara-900/70"
                style={{ background: 'linear-gradient(135deg,#6366f1 0%,#a855f7 100%)' }}>
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] mb-6">
                Sua próxima fase como criador{' '}
                <span className="shimmer-text">começa agora.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-[#9b9bb5] text-xl mb-12 max-w-lg mx-auto leading-relaxed">
                Cada módulo foi construído para o criador brasileiro — do roteiro à oratória. Você ainda vai ficar em branco amanhã?
              </motion.p>
              <motion.div variants={stagger} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                <motion.div variants={fadeUp} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/register"
                    className="btn-shimmer group flex items-center justify-center gap-2 w-full sm:w-auto px-12 py-5 rounded-2xl text-lg font-black text-white shadow-2xl shadow-iara-900/70 hover:shadow-iara-800/70 transition-shadow duration-300"
                    style={{ background: 'linear-gradient(135deg,#6366f1 0%,#a855f7 55%,#ec4899 100%)' }}>
                    Criar conta grátis
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
                <Link href="/login" className="text-sm text-[#6b6b8a] hover:text-[#f1f1f8] transition-colors">Já tenho conta →</Link>
              </motion.div>
              <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-7 text-xs text-[#3a3a5a]">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Dados seguros · LGPD</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500" /> Sem cartão de crédito</span>
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-iara-400" /> Acesso imediato</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <motion.footer
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        className="border-t border-white/5 py-12 px-4 sm:px-6"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold shimmer-text">Iara</span>
          </div>
          <p className="text-xs text-[#3a3a5a] text-center">
            © {new Date().getFullYear()} Iara Hub. Feito no Brasil para criadores brasileiros.
          </p>
          <div className="flex items-center gap-5 text-xs text-[#3a3a5a]">
            <Link href="/empresas" className="hover:text-[#9b9bb5] transition-colors">Para Empresas</Link>
            <Link href="/privacidade" className="hover:text-[#9b9bb5] transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-[#9b9bb5] transition-colors">Termos</Link>
            <a href="#indique" className="hover:text-[#9b9bb5] transition-colors cursor-pointer">Afiliados</a>
            <Link href="/login" className="hover:text-[#9b9bb5] transition-colors">Entrar</Link>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
