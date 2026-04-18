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
  Sparkles, ArrowRight, Check, Zap, Shield, Users, ChevronDown,
  Building2, Tag, TrendingUp, Target, DollarSign,
  Search, Star, Link2, ShoppingBag, Megaphone,
  Clock, X, Briefcase, Eye, FileText,
} from 'lucide-react'

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
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
}

/* ── Data ──────────────────────────────────────────────────────── */
const bandItems = [
  'CAMPANHAS', 'AFILIAÇÕES', 'CRIADORES', 'ROI', 'PARCERIAS',
  'MÉTRICAS', 'CURADORIA', 'AUTENTICIDADE', 'ESCALA', 'RESULTADOS',
]

const brandPains = [
  { icon: Search, title: 'Encontrar o criador certo é um trabalho por si só', sub: 'Horas buscando perfis, mandando DM, esperando resposta. Sem garantia de alinhamento de nicho.' },
  { icon: DollarSign, title: 'Pagar por alcance sem saber o ROI', sub: 'Post publicado, dinheiro pago — e nenhuma métrica clara do que realmente converteu.' },
  { icon: Clock, title: 'Gestão de campanhas por planilha', sub: 'E-mail aqui, contrato lá, nota fiscal em outro lugar. A campanha vira um projeto de produção.' },
  { icon: X, title: 'Afiliados sem rastreamento real', sub: 'Sem um sistema centralizado, cupons se perdem e você não sabe quem vendeu o quê.' },
]

const features = [
  {
    icon: Megaphone,
    title: 'Campanhas anunciadas',
    tag: 'text-iara-400',
    border: 'border-iara-700/30',
    bg: 'rgba(99,102,241,0.07)',
    glow: 'rgba(99,102,241,0.15)',
    desc: 'Crie uma campanha e ela aparece direto no app dos criadores — enquanto eles estão produzindo conteúdo. Candidaturas, seleção e briefing em um só lugar.',
    points: ['Criadores candidatos já usam a Iara ativamente', 'Filtros por nicho, plataforma e tamanho de audiência', 'Briefing, aprovação e entrega gerenciados na plataforma'],
  },
  {
    icon: Tag,
    title: 'Programa de afiliação',
    tag: 'text-accent-pink',
    border: 'border-accent-pink/30',
    bg: 'rgba(236,72,153,0.07)',
    glow: 'rgba(236,72,153,0.15)',
    desc: 'Cadastre seus produtos e deixe criadores gerarem links e cupons exclusivos. Você paga somente quando a venda acontece — ROI claro, sem risco.',
    points: ['Rastreamento em tempo real de cada link e cupom', 'Comissão por venda configurável por produto', 'Webhook integrado para confirmação automática de vendas'],
  },
  {
    icon: Users,
    title: 'Catálogo de criadores',
    tag: 'text-accent-purple',
    border: 'border-accent-purple/30',
    bg: 'rgba(168,85,247,0.07)',
    glow: 'rgba(168,85,247,0.15)',
    desc: 'Explore o perfil completo dos criadores — nicho, tom de voz, plataformas, métricas. Solicite mídia kit direto pela plataforma com um clique.',
    points: ['Mídia kit gerado automaticamente pela Iara', 'Segmentação por nicho, região e plataforma', 'Proposta e contratação sem sair do app'],
  },
]

/* ── FeatureCard with 3-D tilt ────────────────────────────────── */
function FeatureCard({ feat, index }: { feat: typeof features[0]; index: number }) {
  const Icon = feat.icon
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotX = useTransform(my, [-80, 80], [5, -5])
  const rotY = useTransform(mx, [-80, 80], [-5, 5])
  const sRotX = useSpring(rotX, { stiffness: 220, damping: 28 })
  const sRotY = useSpring(rotY, { stiffness: 220, damping: 28 })

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      style={{ rotateX: sRotX, rotateY: sRotY, transformStyle: 'preserve-3d' as const, background: feat.bg, backdropFilter: 'blur(12px)' }}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set(e.clientX - r.left - r.width / 2)
        my.set(e.clientY - r.top - r.height / 2)
      }}
      onMouseLeave={() => { mx.set(0); my.set(0) }}
      whileHover={{ scale: 1.02 }}
      transition={{ scale: { type: 'spring', stiffness: 260, damping: 22 } }}
      className={`rounded-2xl p-7 border ${feat.border} relative overflow-hidden cursor-default group`}
    >
      {/* Glass shine */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${feat.glow}, transparent 65%)` }} />
      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${feat.glow}, transparent)` }} />
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl mb-5 flex items-center justify-center shadow-inner`}
          style={{ background: 'rgba(8,8,15,0.7)', border: `1px solid ${feat.glow}` }}>
          <Icon className={`w-6 h-6 ${feat.tag}`} />
        </div>
        <h3 className="text-xl font-black text-[#f1f1f8] mb-3 leading-snug">{feat.title}</h3>
        <p className="text-[#9b9bb5] text-sm leading-relaxed mb-5">{feat.desc}</p>
        <ul className="space-y-2.5">
          {feat.points.map((p, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-[#8b8ba8]">
              <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${feat.tag}`} />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

/* ── AnimatedCounter ────────────────────────────────────────────── */
function AnimatedCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const numRef = useRef<HTMLParagraphElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inView = useInView(wrapRef, { once: true, margin: '-50px' })
  useEffect(() => {
    if (!inView || !numRef.current) return
    const ctrl = animate(0, value, {
      duration: 2.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(v) { if (numRef.current) numRef.current.textContent = Math.round(v).toLocaleString('pt-BR') + suffix },
    })
    return ctrl.stop
  }, [inView, value, suffix])
  return (
    <motion.div ref={wrapRef} className="text-center" variants={fadeUp}>
      <p ref={numRef} className="text-4xl sm:text-5xl font-black gold-shimmer-text mb-2 tabular-nums">0{suffix}</p>
      <p className="text-sm text-[#5a5a7a]">{label}</p>
    </motion.div>
  )
}

/* ── MAIN ────────────────────────────────────────────────────────── */
export function LandingEmpresas() {
  const shouldReduce = useReducedMotion()
  const { scrollY, scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 400, damping: 40 })

  const heroContentY = useTransform(scrollY, [0, 700], [0, shouldReduce ? 0 : 150])
  const heroOpacity  = useTransform(scrollY, [0, 500], [1, shouldReduce ? 1 : 0])
  const orbY         = useTransform(scrollY, [0, 700], [0, shouldReduce ? 0 : -120])

  const mouseX   = useMotionValue(0)
  const mouseY   = useMotionValue(0)
  const heroGlow = useMotionTemplate`radial-gradient(700px circle at ${mouseX}px ${mouseY}px, rgba(168,85,247,0.10), transparent 40%)`

  const [navScrolled, setNavScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', v => setNavScrolled(v > 40))
  useEffect(() => {
    const fn = (e: MouseEvent) => { mouseX.set(e.clientX); mouseY.set(e.clientY) }
    window.addEventListener('mousemove', fn)
    return () => window.removeEventListener('mousemove', fn)
  }, [mouseX, mouseY])

  return (
    <div className="min-h-screen bg-[#08080f] text-[#f1f1f8] overflow-x-hidden">

      {/* ── Scroll progress bar ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left pointer-events-none"
        style={{ scaleX: smoothProgress, background: 'linear-gradient(90deg,#a855f7,#6366f1,#ec4899)' }}
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
              ['#solucoes','Soluções'],
              ['#como-funciona','Como funciona'],
              ['#planos','Planos'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-[#f1f1f8] transition-colors duration-200 relative group cursor-pointer">
                {label}
                <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-accent-purple to-iara-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </a>
            ))}
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium text-[#9b9bb5] hover:text-[#f1f1f8] border border-white/10 hover:border-iara-700/50 hover:bg-iara-900/20 px-3 py-1.5 rounded-xl transition-all duration-200"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Para Criadores
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm text-[#6b6b8a] hover:text-[#f1f1f8] transition-colors">Entrar</Link>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/register?tipo=marca"
                className="btn-shimmer flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold shadow-lg"
                style={{ background: 'linear-gradient(135deg,#E2C068 0%,#C9A84C 55%,#a855f7 100%)', color: '#0a0a14', boxShadow: '0 4px 20px rgba(201,168,76,0.35)' }}>
                Cadastrar marca
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
            <pattern id="empresa-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(168,85,247,0.07)" strokeWidth="0.8"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#empresa-grid)" />
        </svg>

        {/* Mouse glow */}
        <motion.div className="absolute inset-0 pointer-events-none" style={{ background: heroGlow }} />

        {/* Orbs */}
        <motion.div className="absolute top-1/4 left-1/2 w-[900px] h-[600px] rounded-full pointer-events-none animate-orb-1"
          style={{ background: 'radial-gradient(ellipse, rgba(168,85,247,0.16) 0%, transparent 70%)', y: orbY, x: '-50%' }} />
        <motion.div className="absolute top-1/3 right-[5%] w-[350px] h-[350px] rounded-full pointer-events-none animate-orb-2"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)' }} />
        <motion.div className="absolute bottom-1/4 left-[5%] w-[280px] h-[280px] rounded-full pointer-events-none animate-orb-3"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.10) 0%, transparent 70%)' }} />

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #08080f 88%)' }} />

        <motion.div
          className="relative max-w-5xl mx-auto text-center z-10"
          style={{ y: heroContentY, opacity: heroOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C9A84C]/45 bg-[#C9A84C]/8 text-[#E2C068] text-xs font-medium mb-10"
            style={{ boxShadow: '0 0 24px rgba(201,168,76,0.12)' }}
          >
            <Building2 className="w-3.5 h-3.5 animate-glow-pulse" />
            Iara para Empresas · Conecte sua marca aos criadores certos
          </motion.div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[82px] font-black leading-[1.02] tracking-tight mb-6">
            {[
              { text: 'Sua marca presente', delay: 0.2 },
              { text: 'onde os criadores',   delay: 0.35 },
              { text: 'trabalham todo dia.', delay: 0.5, shimmer: true },
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
            A Iara é usada diariamente por criadores para produzir conteúdo. Sua marca pode aparecer nesse fluxo —{' '}
            <span className="text-[#f1f1f8] font-semibold">em campanhas, afiliações e parcerias diretas.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/register?tipo=marca"
                className="btn-shimmer group flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-2xl text-base font-bold transition-shadow duration-300"
                style={{ background: 'linear-gradient(135deg,#E2C068 0%,#C9A84C 50%,#a855f7 100%)', color: '#0a0a14', boxShadow: '0 8px 32px rgba(201,168,76,0.40)', textShadow: 'none' }}>
                Cadastrar minha marca grátis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <a href="#solucoes"
              className="flex items-center gap-2 w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-semibold text-[#9b9bb5] border border-white/10 hover:border-accent-purple/40 hover:text-[#f1f1f8] hover:bg-accent-purple/5 transition-all duration-300 cursor-pointer">
              Ver as soluções
              <ChevronDown className="w-4 h-4 opacity-50" />
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="text-xs text-[#3a3a5a]"
          >
            Sem taxa de cadastro · Plano gratuito para explorar · Suporte em português
          </motion.p>

          {/* Brand dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-16"
          >
            <motion.div
              animate={shouldReduce ? {} : { y: [0, -10, 0] }}
              transition={{ duration: 6.5, ease: 'easeInOut', repeat: Infinity }}
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
                  iarahubapp.com.br/marca/dashboard · Painel da Marca
                </div>
              </div>
              <div className="p-5 grid grid-cols-3 gap-4">
                <div className="hidden sm:flex flex-col gap-1.5">
                  {['Dashboard','Campanhas','Criadores','Afiliações','Métricas'].map((item, i) => (
                    <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${i === 1 ? 'bg-accent-purple/25 text-accent-purple border border-accent-purple/25' : 'text-[#4a4a6a]'}`}>
                      <div className={`w-2 h-2 rounded-sm ${i === 1 ? 'bg-accent-purple' : 'bg-[#2a2a3a]'}`} />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="col-span-3 sm:col-span-2 space-y-3">
                  <div className="rounded-xl p-4 border border-accent-purple/20" style={{ background: 'rgba(10,10,22,0.8)' }}>
                    <p className="text-[10px] text-accent-purple font-semibold mb-3">Campanha ativa · Fitness</p>
                    <div className="space-y-2">
                      {[{label:'Candidaturas',val:'24',bar:'w-4/5'},{label:'Em análise',val:'8',bar:'w-2/5'},{label:'Selecionados',val:'5',bar:'w-1/4'}].map(r => (
                        <div key={r.label}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-[#5a5a7a]">{r.label}</span>
                            <span className="text-[#9b9bb5] font-bold">{r.val}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#1a1a2e]">
                            <motion.div
                              className={`h-full ${r.bar} rounded-full`}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.8, delay: 1.1 + 0.15 * ['24','8','5'].indexOf(r.val), ease: 'easeOut' }}
                              style={{ background: 'linear-gradient(90deg,#a855f7,#6366f1)', transformOrigin: 'left' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[{label:'Vendas via afiliado',val:'R$4,2K',color:'#a855f7'},{label:'Alcance total',val:'420K',color:'#818cf8'},{label:'ROI médio',val:'3.8x',color:'#ec4899'}].map(s => (
                      <div key={s.label} className="rounded-xl p-3 text-center border border-white/5" style={{ background: 'rgba(10,10,20,0.7)' }}>
                        <p className="text-sm font-bold mb-0.5" style={{ color: s.color }}>{s.val}</p>
                        <p className="text-[9px] text-[#4a4a6a] leading-tight">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating badges */}
            <motion.div animate={shouldReduce ? {} : { y: [0,-10,0] }} transition={{ duration: 4.5, ease: 'easeInOut', repeat: Infinity }}
              className="absolute -top-4 -left-4 md:-left-10 hidden md:flex">
              <div className="rounded-2xl px-4 py-3 border border-accent-purple/30 shadow-xl shadow-black/60" style={{ background: 'rgba(8,8,18,0.95)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-glow-pulse" />
                  <p className="text-[11px] font-semibold text-accent-purple">Nova candidatura</p>
                </div>
                <p className="text-[10px] text-[#5a5a7a] mt-0.5 max-w-[130px] leading-tight">Influenciador · Fitness · 85K seguidores</p>
              </div>
            </motion.div>

            <motion.div animate={shouldReduce ? {} : { y: [0,-12,0] }} transition={{ duration: 5.5, ease: 'easeInOut', repeat: Infinity, delay: 1 }}
              className="absolute -top-4 -right-4 md:-right-10 hidden md:flex">
              <div className="rounded-2xl px-4 py-3 border border-[#C9A84C]/35 shadow-xl shadow-black/60" style={{ background: 'rgba(10,8,4,0.97)', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 20px rgba(201,168,76,0.12)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-3 h-3 text-[#E2C068]" />
                  <p className="text-[11px] font-semibold text-[#E2C068]">Venda confirmada</p>
                </div>
                <p className="text-xl font-black">R$<span className="gold-shimmer-text">297</span></p>
              </div>
            </motion.div>

            <motion.div animate={shouldReduce ? {} : { y: [0,-8,0] }} transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity, delay: 2 }}
              className="absolute -bottom-5 left-1/2 -translate-x-1/2 hidden md:flex">
              <div className="rounded-2xl px-5 py-2.5 border border-iara-700/30 shadow-xl shadow-black/60 flex items-center gap-3" style={{ background: 'rgba(8,8,18,0.95)', backdropFilter: 'blur(16px)' }}>
                <div className="flex -space-x-2">
                  {['#818cf8','#a855f7','#ec4899','#6366f1'].map(c => (
                    <div key={c} className="w-6 h-6 rounded-full border-2 border-[#08080f]" style={{ background: c }} />
                  ))}
                </div>
                <p className="text-[11px] text-[#9b9bb5]">
                  <span className="font-bold text-[#f1f1f8]">+24 criadores</span> candidatados
                </p>
              </div>
            </motion.div>

            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 blur-[60px] rounded-full pointer-events-none animate-glow-pulse"
              style={{ background: 'rgba(168,85,247,0.25)' }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── SCROLLING TEXT BAND ── */}
      <section className="py-5 overflow-hidden border-y border-white/5 bg-[#090910]">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 35, ease: 'linear', repeat: Infinity }}
          className="flex gap-10 whitespace-nowrap"
        >
          {[...bandItems, ...bandItems, ...bandItems, ...bandItems].map((item, i) => (
            <span key={i} className={`text-xs font-bold tracking-[0.25em] uppercase flex items-center gap-10 ${i % 5 === 0 ? 'text-[#C9A84C]/70' : 'text-[#3a3a5a]'}`}>
              {item}
              <span className="inline-block w-1 h-1 rounded-full flex-shrink-0" style={{ background: i % 5 === 0 ? 'rgba(201,168,76,0.7)' : 'rgba(168,85,247,0.45)' }} />
            </span>
          ))}
        </motion.div>
      </section>

      {/* ── DOR DA MARCA ── */}
      <section className="py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(220,38,38,0.04) 0%, transparent 60%)' }} />
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-red-800/40 bg-red-950/30 text-red-400 text-xs font-medium mb-6">
              <X className="w-3.5 h-3.5" /> O influencer marketing ainda parece isso?
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4">
              Fechar uma parceria não deveria<br />
              <span style={{ color: 'rgba(220,38,38,0.85)' }}>ser trabalho manual de semanas.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[#6b6b8a] text-lg max-w-xl mx-auto">
              A Iara resolve cada um desses pontos — com um sistema feito para marcas que levam crescimento a sério.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={stagger} className="grid md:grid-cols-2 gap-5">
            {brandPains.map((p, i) => {
              const Icon = p.icon
              return (
                <motion.div key={i} variants={fadeUp} custom={i}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                  className="group flex gap-4 p-6 rounded-2xl border border-red-900/20 hover:border-red-800/35 transition-colors duration-300 cursor-default"
                  style={{ background: 'rgba(12,6,6,0.7)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(220,38,38,0.1)' }}>
                    <Icon className="w-5 h-5 text-red-400/70" />
                  </div>
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

      {/* ── STATS ── */}
      <section className="py-20 px-4 sm:px-6 border-y border-white/5" style={{ background: 'linear-gradient(180deg, #08080f 0%, #0c0c1c 100%)' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger}
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
          <AnimatedCounter value={11} suffix="+" label="Módulos usados pelos criadores" />
          <AnimatedCounter value={6}  suffix="h+" label="Economizadas por criador/semana" />
          <AnimatedCounter value={300} suffix="+" label="Horas/ano de produção de conteúdo" />
          <AnimatedCounter value={10} suffix="B"  label="Mercado de influência (R$/ano)" />
        </motion.div>
      </section>

      {/* ── SOLUÇÕES ── */}
      <section id="solucoes" className="py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-accent-purple text-xs font-bold uppercase tracking-widest mb-4">Três frentes. Um ecossistema.</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4">
              Não é uma ferramenta.<br />
              <span className="shimmer-text">É a ponte entre marca e criador.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[#6b6b8a] max-w-xl mx-auto text-lg">
              Cada solução foi desenhada para eliminar fricção entre a sua marca e o criador que vai representá-la de verdade.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-5"
            style={{ perspective: '1200px' }}
          >
            {features.map((f, i) => <FeatureCard key={f.title} feat={f} index={i} />)}
          </motion.div>
        </div>
      </section>

      {/* ── COMO FUNCIONA — CAMPANHAS ── */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #08080f 0%, #0d0d1a 50%, #08080f 100%)' }}>
        <div className="absolute inset-0 dot-grid opacity-15 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-iara-700/40 bg-iara-950/60 text-iara-400 text-xs font-bold mb-6">
              <Megaphone className="w-3.5 h-3.5" />
              Campanhas Anunciadas
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4">
              Sua campanha aparece onde os criadores<br />
              <span className="shimmer-text">já estão produzindo conteúdo.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[#6b6b8a] max-w-xl mx-auto text-base">
              O diferencial da Iara: criadores usam o app diariamente para criar roteiros e carrosseis. Sua campanha aparece nesse fluxo — não em um feed de anúncios ignorado.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Passos */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }} variants={stagger} className="space-y-6">
              {[
                { num: '01', title: 'Crie a campanha', desc: 'Defina briefing, nicho, plataforma e deadline. Em minutos sua oportunidade está ao vivo para os criadores.', color: 'from-accent-purple/20 to-iara-600/10', border: 'border-accent-purple/30' },
                { num: '02', title: 'Criadores se candidatam', desc: 'Quem usa a Iara vê sua campanha e se candidata. Cada candidato tem perfil completo: métricas, tom de voz, mídia kit.', color: 'from-iara-600/20 to-accent-pink/10', border: 'border-iara-700/30' },
                { num: '03', title: 'Selecione, aprove, acompanhe', desc: 'Escolha os selecionados, envie briefing e acompanhe entrega e desempenho — tudo sem sair da plataforma.', color: 'from-accent-pink/15 to-accent-purple/10', border: 'border-accent-pink/20' },
              ].map((step, i) => (
                <motion.div key={step.num} variants={fadeUp} custom={i} className="flex gap-5 items-start">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} border ${step.border} flex items-center justify-center flex-shrink-0 shadow-xl shadow-black/40 cursor-default`}>
                    <span className="text-lg font-black shimmer-text">{step.num}</span>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-lg font-bold text-[#f1f1f8] mb-1">{step.title}</h3>
                    <p className="text-[#9b9bb5] text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Mockup de campanha */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-accent-purple/20 overflow-hidden"
              style={{ background: 'rgba(12,10,22,0.9)', backdropFilter: 'blur(12px)' }}
            >
              <div className="border-b border-white/5 px-5 py-4 flex items-center justify-between">
                <span className="text-xs font-bold text-accent-purple uppercase tracking-widest">Campanha · Ao vivo</span>
                <span className="text-[10px] text-green-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-glow-pulse inline-block" />
                  24 candidaturas
                </span>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-lg font-black text-[#f1f1f8] mb-1">Campanha de Lançamento</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['Fitness','Instagram','25K–200K'].map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-accent-purple/15 border border-accent-purple/25 text-accent-purple">{t}</span>
                    ))}
                  </div>
                  <p className="text-xs text-[#6b6b8a] leading-relaxed">Procuramos criadores da área fitness para divulgar o lançamento do suplemento X. Precisa criar 1 Reels + 3 Stories com link na bio.</p>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Mari S.', role: 'Fitness · 92K', status: 'Selecionado', color: 'text-green-400', bg: 'bg-green-900/20 border-green-900/30' },
                    { name: 'João P.',  role: 'Saúde · 45K',  status: 'Em análise',  color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-900/30' },
                    { name: 'Camila R.',role: 'Fitness · 180K',status: 'Em análise', color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-900/30' },
                  ].map(c => (
                    <div key={c.name} className={`flex items-center justify-between p-3 rounded-xl border ${c.bg}`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-purple/40 to-iara-600/30" />
                        <div>
                          <p className="text-xs font-semibold text-[#f1f1f8]">{c.name}</p>
                          <p className="text-[10px] text-[#5a5a7a]">{c.role}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold ${c.color}`}>{c.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA — AFILIAÇÃO ── */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(236,72,153,0.07) 0%, transparent 55%)' }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent-pink/30 bg-accent-pink/10 text-accent-pink text-xs font-bold mb-6">
              <Tag className="w-3.5 h-3.5" />
              Programa de Afiliação
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4">
              Distribua sua marca.<br />
              <span className="shimmer-text">Pague só quando vender.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[#6b6b8a] max-w-xl mx-auto text-base leading-relaxed">
              Cadastre seus produtos no catálogo da Iara. Criadores escolhem o que combina com seu nicho, geram link ou cupom exclusivo e divulgam para o público deles. Você rastreia cada venda em tempo real.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {[
              { icon: ShoppingBag, title: 'Cadastre o produto',         desc: 'Defina comissão, regras e integre seu webhook para confirmação de vendas.',        tag: 'text-accent-pink', bg: 'from-accent-pink/15 to-accent-purple/5', border: 'border-accent-pink/20' },
              { icon: Eye,         title: 'Produto entra no catálogo',  desc: 'Após verificação, seu produto aparece para todos os criadores segmentados.',        tag: 'text-accent-purple', bg: 'from-accent-purple/15 to-iara-600/5', border: 'border-accent-purple/20' },
              { icon: Link2,       title: 'Criador gera link/cupom',    desc: 'Com um clique, cada criador gera seu identificador único para compartilhar.',       tag: 'text-iara-400', bg: 'from-iara-600/15 to-teal-900/5', border: 'border-iara-700/20' },
              { icon: TrendingUp,  title: 'Venda rastreada, você paga', desc: 'Cada conversão é registrada automaticamente. Zero risco antes de vender.',         tag: 'text-green-400', bg: 'from-green-900/20 to-iara-600/5', border: 'border-green-800/20' },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div key={i} variants={fadeUp} custom={i}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className={`rounded-2xl p-6 border ${s.border} bg-gradient-to-br ${s.bg} cursor-default`}>
                  <div className="w-10 h-10 rounded-xl bg-[#08080f]/70 flex items-center justify-center mb-4 shadow-inner">
                    <Icon className={`w-5 h-5 ${s.tag}`} />
                  </div>
                  <h3 className="font-bold text-[#f1f1f8] text-sm mb-2 leading-snug">{s.title}</h3>
                  <p className="text-xs text-[#6b6b8a] leading-relaxed">{s.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>

          {/* ROI highlight */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }} variants={scaleIn}
            className="rounded-2xl p-8 border border-accent-pink/20 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.07), rgba(168,85,247,0.05))' }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(236,72,153,0.08) 0%, transparent 60%)' }} />
            <div className="relative z-10 grid md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-2">
                <h3 className="text-2xl font-black text-[#f1f1f8] mb-3 leading-snug">
                  ROI claro. Risco zero.<br />
                  <span className="gold-shimmer-text">É performance pura.</span>
                </h3>
                <p className="text-[#9b9bb5] text-sm leading-relaxed">
                  Diferente de contratos de post patrocinado onde você paga pelo alcance sem garantia de venda — na afiliação da Iara você define a comissão e paga apenas quando o criador converte. O rastreamento por webhook garante que nenhuma venda passe despercebida.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: '0', unit: 'risco',     label: 'antes de vender', color: 'text-green-400' },
                  { v: '100%', unit: 'rastread.', label: 'via webhook',   color: 'text-accent-pink' },
                  { v: '24h',  unit: 'setup',   label: 'para entrar ao vivo', color: 'text-iara-400' },
                  { v: '+',    unit: 'nichos',  label: 'disponíveis',    color: 'text-accent-purple' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 border border-white/8 text-center" style={{ background: 'rgba(8,8,15,0.7)' }}>
                    <p className={`text-xl font-black ${s.color}`}>{s.v}</p>
                    <p className={`text-[10px] font-bold ${s.color} opacity-70`}>{s.unit}</p>
                    <p className="text-[9px] text-[#4a4a6a] mt-0.5 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── POR QUE A IARA ── */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #08080f 0%, #0b0b18 50%, #08080f 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 65%)' }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger} className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-iara-400 text-xs font-bold uppercase tracking-widest mb-4">A diferença que importa</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-black leading-tight mb-4">
              Não é mais um marketplace.<br />
              <span className="shimmer-text">É onde os criadores vivem.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[#6b6b8a] max-w-xl mx-auto">
              A Iara não é usada para procurar campanha — é usada para criar conteúdo todo dia. Isso significa que sua marca entra na rotina real dos criadores, não em uma plataforma que eles abrem uma vez por mês.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={stagger}
            className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Zap,       color: 'text-iara-400',    bg: 'rgba(99,102,241,0.08)',  border: 'border-iara-700/25',     title: 'Criadores ativos diariamente', sub: 'Cada criador usa a Iara para produzir conteúdo — não só para procurar marca. Sua campanha alcança quem produz de verdade.' },
              { icon: Star,      color: 'text-[#E2C068]',   bg: 'rgba(201,168,76,0.10)',  border: 'border-[#C9A84C]/30',    title: 'Perfis com dados reais',       sub: 'Nicho, tom de voz, score de oratória, métricas de todas as plataformas — tudo validado pelo uso real da ferramenta.' },
              { icon: Shield,    color: 'text-green-400',   bg: 'rgba(34,197,94,0.07)',   border: 'border-green-800/20',    title: 'Transparência total',         sub: 'Rastreamento por webhook, comissões automáticas e histórico completo. Sem jogo de planilha, sem sumiço de criador.' },
              { icon: FileText,  color: 'text-accent-purple',bg:'rgba(168,85,247,0.07)',  border: 'border-accent-purple/20',title: 'Mídia kit automático',        sub: 'Todo criador tem mídia kit gerado pela IA. Você analisa portfólio, métricas e tom de voz antes de fechar qualquer coisa.' },
              { icon: Target,    color: 'text-accent-pink', bg: 'rgba(236,72,153,0.07)',  border: 'border-accent-pink/20',  title: 'Segmentação precisa',         sub: 'Filtre por nicho, plataforma, tamanho de audiência e engajamento. Encontre quem faz sentido para a sua marca.' },
              { icon: Briefcase, color: 'text-teal-400',    bg: 'rgba(20,184,166,0.07)',  border: 'border-teal-800/20',     title: 'Suporte em português',        sub: 'Plataforma 100% em português, com suporte dedicado. Sem barreiras de idioma, sem contratos em inglês para decifrar.' },
            ].map((f, i) => {
              const FIcon = f.icon
              return (
                <motion.div key={i} variants={fadeUp} custom={i}
                  whileHover={{ y: -5 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  className={`p-6 rounded-2xl border ${f.border} cursor-default`}
                  style={{ background: f.bg }}>
                  <FIcon className={`w-5 h-5 ${f.color} mb-4`} />
                  <h3 className="font-bold text-[#f1f1f8] mb-2 text-sm leading-snug">{f.title}</h3>
                  <p className="text-xs text-[#6b6b8a] leading-relaxed">{f.sub}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-32 px-4 sm:px-6 relative overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
          animate={shouldReduce ? {} : { scale: [1, 1.12, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 9, ease: 'easeInOut', repeat: Infinity }}
          style={{ background: 'radial-gradient(ellipse, rgba(168,85,247,0.16) 0%, transparent 65%)' }}
        />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}
          className="max-w-3xl mx-auto relative z-10">
          <motion.div variants={scaleIn}
            className="relative rounded-3xl overflow-hidden border border-[#C9A84C]/20 shadow-[0_60px_200px_rgba(0,0,0,0.9)] p-12 sm:p-20 text-center"
            style={{ background: 'linear-gradient(160deg, rgba(14,10,6,0.99), rgba(18,8,32,0.99))', boxShadow: '0 60px 200px rgba(0,0,0,0.9), 0 0 60px rgba(201,168,76,0.08), inset 0 1px 0 rgba(226,192,104,0.15)' }}>
            {/* Gold top beam */}
            <div className="absolute top-0 left-[10%] right-[10%] h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(226,192,104,0.5), transparent)' }} />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(201,168,76,0.12) 0%, rgba(168,85,247,0.10) 40%, transparent 70%)' }} />
            <div className="relative">
              <motion.div
                animate={shouldReduce ? {} : { scale: [1, 1.06, 1] }}
                transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
                className="w-[72px] h-[72px] rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-accent-purple/40"
                style={{ background: 'linear-gradient(135deg,#a855f7 0%,#6366f1 100%)' }}>
                <Building2 className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] mb-6">
                Sua marca no lugar<br />
                <span className="gold-shimmer-text">onde acontece a criação.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-[#9b9bb5] text-xl mb-12 max-w-lg mx-auto leading-relaxed">
                Cadastre sua empresa grátis e comece a explorar o catálogo de criadores, criar campanhas e estruturar seu programa de afiliação.
              </motion.p>
              <motion.div variants={stagger} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                <motion.div variants={fadeUp} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/register?tipo=marca"
                    className="btn-shimmer group flex items-center justify-center gap-2 w-full sm:w-auto px-12 py-5 rounded-2xl text-lg font-black transition-shadow duration-300"
                    style={{ background: 'linear-gradient(135deg,#E2C068 0%,#C9A84C 50%,#a855f7 100%)', color: '#0a0a14', boxShadow: '0 12px 48px rgba(201,168,76,0.45)' }}>
                    Cadastrar minha marca grátis
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
                <Link href="/login" className="text-sm text-[#6b6b8a] hover:text-[#f1f1f8] transition-colors">Já tenho conta →</Link>
              </motion.div>
              <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-7 text-xs text-[#3a3a5a]">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> LGPD · Dados protegidos</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500" /> Sem taxa de cadastro</span>
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-accent-purple" /> Suporte em português</span>
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
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-purple to-iara-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold shimmer-text">Iara</span>
            <span className="text-xs ml-1" style={{ color: '#C9A84C', opacity: 0.7 }}>para Empresas</span>
          </div>
          <p className="text-xs text-[#3a3a5a] text-center">
            © {new Date().getFullYear()} Iara Hub. A plataforma que une marcas e criadores brasileiros.
          </p>
          <div className="flex items-center gap-5 text-xs text-[#3a3a5a]">
            <Link href="/" className="hover:text-[#9b9bb5] transition-colors">Para Criadores</Link>
            <Link href="/privacidade" className="hover:text-[#9b9bb5] transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-[#9b9bb5] transition-colors">Termos</Link>
            <Link href="/login" className="hover:text-[#9b9bb5] transition-colors">Entrar</Link>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
