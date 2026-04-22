'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  motion, useScroll, useTransform, useSpring,
  useMotionValueEvent, useReducedMotion,
} from 'framer-motion'
import { IaraLogo } from '@/components/iara-logo'
import {
  Sparkles, FileText, Mic, Target, Calendar,
  TrendingUp, ArrowRight, Check, Zap, Shield,
  Layers, Image, Images, BookOpen, Smartphone,
  DollarSign, ChevronDown, X, Gift, Lightbulb,
  Building2, ShoppingBag, Tag, Link2,
} from 'lucide-react'
import { PricingSection } from '@/components/pricing-section'
import { CursorHalo } from '@/components/landing/cursor-halo'
import { Magnetic } from '@/components/landing/magnetic'
import { LineReveal } from '@/components/landing/line-reveal'
import { VelocityMarquee } from '@/components/landing/velocity-marquee'
import { CountUp } from '@/components/landing/count-up'
import { MegaWordmark } from '@/components/landing/mega-wordmark'
import { ScrollWash } from '@/components/landing/scroll-wash'

/* ─────────────────────────────────────────────────────────────
   VARIANTS
   ───────────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.08 },
  }),
}
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
}

/* ─────────────────────────────────────────────────────────────
   DADOS
   ───────────────────────────────────────────────────────────── */
const modules = [
  { icon: Lightbulb,   title: 'Faísca Criativa', desc: 'Chat com IA que descobre o melhor do seu conteúdo e gera temas com hook e ângulo.', tag: 'text-iara-300',      glow: 'rgba(99,102,241,0.30)' },
  { icon: FileText,    title: 'Roteiros',         desc: 'Roteiros no seu tom, em 6 formatos, em menos de 60 segundos.',                       tag: 'text-iara-400',      glow: 'rgba(99,102,241,0.20)' },
  { icon: Layers,      title: 'Carrossel',        desc: 'Cole o link. Slides completos com paleta e layout automáticos.',                     tag: 'text-accent-pink',   glow: 'rgba(236,72,153,0.25)' },
  { icon: Image,       title: 'Thumbnail',        desc: 'Alto CTR. PNG 1280×720 com análise de composição, 17 fontes editáveis.',             tag: 'text-accent-purple', glow: 'rgba(168,85,247,0.25)' },
  { icon: Smartphone,  title: 'Stories',          desc: '7 slides em sequência. Hook, virada e CTA, prontos para postar.',                     tag: 'text-accent-pink',   glow: 'rgba(236,72,153,0.25)' },
  { icon: Mic,         title: 'Oratória',         desc: 'Score em 5 dimensões com exercícios personalizados por IA.',                          tag: 'text-accent-purple', glow: 'rgba(168,85,247,0.25)' },
  { icon: BookOpen,    title: 'Mídia Kit',        desc: 'Kit profissional automático em PDF. Para marcas, parceiros, clientes.',              tag: 'text-amber-400',     glow: 'rgba(245,158,11,0.20)' },
  { icon: TrendingUp,  title: 'Métricas',         desc: 'Instagram, YouTube e TikTok com diagnóstico estratégico da Iara.',                    tag: 'text-iara-400',      glow: 'rgba(99,102,241,0.20)' },
  { icon: Target,      title: 'Metas & Hábitos',  desc: 'Gamificação com pontos, níveis e 15 arquétipos por nicho.',                           tag: 'text-green-400',     glow: 'rgba(34,197,94,0.20)' },
  { icon: Calendar,    title: 'Calendário',       desc: 'Grade semanal integrada às metas. Plano e execução no mesmo lugar.',                 tag: 'text-teal-400',      glow: 'rgba(20,184,166,0.20)' },
  { icon: Images,      title: 'Banco de Fotos',   desc: 'Armazenamento privado, usado por todos os geradores.',                                tag: 'text-iara-400',      glow: 'rgba(99,102,241,0.20)' },
]

const painPoints = [
  { title: 'Você sabe, mas não começa',    sub: 'Essa semana. Semana que vem. Outro profissional da sua área ocupa o espaço que seria seu.' },
  { title: 'Expertise que não vira post',  sub: 'Anos de conhecimento. A página em branco paralisa. Todo dia.' },
  { title: 'Posta, mas não cresce',        sub: 'Sem estratégia, sem ritmo. Presença irregular não gera confiança.' },
  { title: 'Oportunidades que escapam',    sub: 'Cliente pediu portfólio. Parceiro pediu referências. Você não tinha. Ela foi pra quem estava pronto.' },
]

const affiliateTiers = [
  { name: 'Primeira venda',    commission: '50%', desc: 'Metade do primeiro mês de todo amigo que você trouxer. Maior comissão do mercado brasileiro.',  tag: 'text-iara-400' },
  { name: 'Recorrente 12m',    commission: '10%', desc: 'Mais 10% por 12 meses enquanto ele continuar assinando. Renda passiva enquanto dorme.',         tag: 'text-accent-purple' },
  { name: 'Bônus de volume',   commission: 'R$ 5k', desc: 'Fez 50 indicações em um trimestre? R$ 5.000 de bônus em cima. Embaixador = R$ 500, Parceiro = R$ 1.500.', tag: 'text-accent-pink' },
]

const bandItems = ['Roteiros', 'Carrossel', 'Thumbnail', 'Stories', 'Oratória', 'Métricas', 'Metas', 'Calendário', 'Mídia Kit', 'Faísca Criativa', 'Afiliação', 'Persona IA']

/* ─────────────────────────────────────────────────────────────
   LANDING PAGE
   ───────────────────────────────────────────────────────────── */
export function LandingPage() {
  const shouldReduce = useReducedMotion()
  const { scrollY, scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 400, damping: 40 })

  // Hero parallax
  const heroContentY = useTransform(scrollY, [0, 700], [0, shouldReduce ? 0 : 140])
  const heroOpacity = useTransform(scrollY, [0, 550], [1, shouldReduce ? 1 : 0])
  const heroScale = useTransform(scrollY, [0, 700], [1, shouldReduce ? 1 : 0.94])

  // Nav state
  const [navScrolled, setNavScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', v => setNavScrolled(v > 40))

  // Copy-to-clipboard easter egg no brand name
  const [copied, setCopied] = useState(false)
  async function copyBrandUrl() {
    try {
      await navigator.clipboard.writeText('https://iarahubapp.com.br')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }

  return (
    <ScrollWash>
      <div className="text-[#f1f1f8] overflow-x-hidden editorial-punct">
        {/* Cursor halo global */}
        <CursorHalo />

        {/* Scroll progress bar */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left pointer-events-none"
          style={{ scaleX: smoothProgress, background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)' }}
        />

        {/* Toast de copy */}
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-iara-600/90 backdrop-blur text-white text-xs font-medium"
          >
            Link copiado ✦
          </motion.div>
        )}

        {/* ── NAV ─────────────────────────────────────────────── */}
        <header
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={{
            background: navScrolled ? 'rgba(8,8,15,0.82)' : 'transparent',
            backdropFilter: navScrolled ? 'blur(20px)' : 'none',
            borderBottom: navScrolled ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <button
              onDoubleClick={copyBrandUrl}
              className="flex items-center cursor-pointer"
              aria-label="Iara Hub — clique duplo para copiar URL"
            >
              <IaraLogo size="sm" layout="horizontal" />
            </button>
            <nav className="hidden md:flex items-center gap-7 text-sm text-[#9b9bb5]">
              {[['#modulos', 'Módulos'], ['#preco', 'Preço'], ['#afiliados', 'Afiliados']].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="hover:text-[#f1f1f8] transition-colors duration-200 relative group"
                >
                  {label}
                  <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-iara-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </a>
              ))}
              <Link
                href="/empresas"
                className="flex items-center gap-1.5 text-xs font-medium text-[#9b9bb5] hover:text-[#f1f1f8] border border-white/10 hover:border-iara-700/50 px-2.5 py-1.5 rounded-lg transition-all"
              >
                <Building2 className="w-3 h-3" />
                Para Empresas
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden sm:block text-sm text-[#9b9bb5] hover:text-[#f1f1f8] transition-colors">Entrar</Link>
              <Magnetic strength={0.3}>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }}
                >
                  Começar grátis
                </Link>
              </Magnetic>
            </div>
          </div>
        </header>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="relative min-h-[92vh] flex flex-col items-center justify-center pt-24 pb-16 px-4 sm:px-6 overflow-hidden">
          {/* SVG grid sutil */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60" aria-hidden>
            <defs>
              <pattern id="hero-grid" width="64" height="64" patternUnits="userSpaceOnUse">
                <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(99,102,241,0.05)" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>

          {/* Orb único central — simplificado */}
          <motion.div
            aria-hidden
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(99,102,241,0.14) 0%, transparent 70%)',
              y: useTransform(scrollY, [0, 500], [0, shouldReduce ? 0 : -80]),
            }}
          />

          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 35%, #08080f 92%)' }} />

          {/* Content */}
          <motion.div
            className="relative max-w-5xl mx-auto text-center z-10 prose-editorial"
            style={{ y: heroContentY, opacity: heroOpacity, scale: heroScale }}
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-iara-700/30 text-[10px] font-semibold text-iara-300 mb-10 tracking-[0.22em] uppercase"
            >
              <span className="w-1 h-1 rounded-full bg-iara-400" />
              Conteúdo como vendas · Feito no Brasil
            </motion.div>

            {/* Headline com editorial italic no meio */}
            <LineReveal
              className="font-display text-[clamp(44px,9vw,112px)] font-black tracking-display leading-[0.94] mb-8"
              lines={[
                { content: <>Pare de perder tempo</>, delay: 0.15 },
                { content: (
                  <>
                    tentando criar{' '}
                    <span className="font-editorial font-normal text-iara-300/95">conteúdo</span>
                  </>
                ), delay: 0.22 },
                { content: (
                  <span className="bg-gradient-to-r from-[#f1f1f8] via-[#d8ccff] to-iara-300 bg-clip-text text-transparent">
                    do zero toda semana.
                  </span>
                ), delay: 0.3 },
              ]}
              as="h1"
            />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65 }}
              className="text-[clamp(16px,1.6vw,21px)] text-[#9b9bb5] max-w-xl mx-auto mb-10 leading-relaxed"
            >
              A Iara é sua assessora digital com IA. Aprende seu tom, escreve na sua voz e constrói sua autoridade online —{' '}
              <span className="text-[#f1f1f8] font-semibold">em minutos por dia.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.78 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5"
            >
              <Magnetic strength={0.22}>
                <Link
                  href="/register"
                  className="group flex items-center justify-center gap-2 px-9 py-4 rounded-2xl text-[15px] font-bold text-white shadow-2xl shadow-iara-900/50"
                  style={{ background: 'linear-gradient(135deg,#6366f1 0%,#a855f7 55%,#ec4899 100%)' }}
                >
                  Começar grátis agora
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Magnetic>
              <a
                href="#modulos"
                className="flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-medium text-[#9b9bb5] hover:text-[#f1f1f8] transition-colors"
              >
                Ver como funciona <ChevronDown className="w-4 h-4 opacity-60" />
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95 }}
              className="text-[11px] tracking-[0.18em] uppercase text-[#3a3a5a] font-semibold"
            >
              3 dias grátis em qualquer plano · Cancele antes e zero é cobrado
            </motion.p>
          </motion.div>
        </section>

        {/* ── VELOCITY MARQUEE ─────────────────────────────────── */}
        <VelocityMarquee items={bandItems} baseVelocity={40} className="bg-[#090910]" />

        {/* ── BIG NUMBER EDITORIAL (um só número, centerpiece) ── */}
        <section className="py-28 sm:py-40 px-4 sm:px-6 relative overflow-hidden">
          <div className="max-w-5xl mx-auto relative">
            {/* Linha editorial superior */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-4 mb-10 sm:mb-14"
            >
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="text-[11px] tracking-[0.3em] uppercase font-semibold text-iara-400 whitespace-nowrap">
                O preço do tempo que você perde hoje
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </motion.div>

            {/* Número gigante centerpiece */}
            <div className="relative text-center">
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="font-display font-black text-[clamp(140px,24vw,320px)] leading-[0.82] tracking-display"
              >
                <span className="bg-gradient-to-b from-[#f1f1f8] via-[#d8ccff] to-accent-purple bg-clip-text text-transparent">
                  <CountUp to={300} suffix="h" />
                </span>
              </motion.p>

              {/* Tag editorial flutuante à direita do número */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="font-editorial italic text-[clamp(22px,3vw,36px)] text-iara-300/90 mt-4"
              >
                devolvidas por ano.
              </motion.p>

              {/* Parágrafo editorial (coluna estreita, tipo revista) */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.7, delay: 0.55 }}
                className="prose-editorial text-[clamp(15px,1.4vw,18px)] text-[#9b9bb5] max-w-[42ch] mx-auto mt-10 leading-[1.65]"
              >
                É o que criadores e profissionais gastam{' '}
                <span className="text-[#f1f1f8] font-semibold">só planejando conteúdo.</span>{' '}
                A Iara corta essas <span className="font-editorial text-[#f1f1f8]">seis horas semanais</span> para menos de trinta minutos — sem abrir mão da qualidade, sem te fazer soar robótico.
              </motion.p>

              {/* Meta numbers discretos como footnote editorial */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex items-center justify-center gap-8 sm:gap-14 mt-14 pt-8 border-t border-white/5 max-w-md mx-auto"
              >
                <div className="text-center">
                  <p className="font-display font-bold text-[20px] sm:text-[24px] text-[#f1f1f8] tabular leading-none">
                    <CountUp to={6} suffix="h" />
                  </p>
                  <p className="text-[10px] tracking-[0.18em] uppercase text-[#5a5a7a] mt-1.5 font-semibold">por semana</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="font-display font-bold text-[20px] sm:text-[24px] text-[#f1f1f8] tabular leading-none">
                    &lt; 30<span className="text-[14px] text-[#9b9bb5] font-normal">min</span>
                  </p>
                  <p className="text-[10px] tracking-[0.18em] uppercase text-[#5a5a7a] mt-1.5 font-semibold">com a iara</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── VENDER COM CONTEÚDO ─────────────────────────────── */}
        <section className="py-24 sm:py-32 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.08) 0%, transparent 65%)' }} />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="max-w-4xl mx-auto relative z-10 text-center prose-editorial"
          >
            <motion.p variants={fadeUp} className="text-[11px] tracking-[0.3em] uppercase font-semibold text-iara-400 mb-5">
              — A melhor estratégia de vendas de 2026
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-display font-black text-[clamp(36px,6.5vw,68px)] leading-[1.02] tracking-display mb-6">
              Conteúdo é a forma mais{' '}
              <span className="font-editorial font-normal">poderosa</span>{' '}
              de vender o seu trabalho.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[clamp(16px,1.6vw,20px)] text-[#9b9bb5] max-w-2xl mx-auto mb-10 leading-relaxed">
              Quem mostra o que sabe, vende mais. Quem aparece com consistência, escala. Não importa sua área — o conteúdo é o que transforma seguidores em clientes, e clientes em fãs.{' '}
              <span className="text-[#f1f1f8] font-semibold">A Iara faz isso por você, todo dia.</span>
            </motion.p>
            <motion.div variants={fadeUp}>
              <Magnetic strength={0.2}>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-9 py-4 rounded-2xl text-[15px] font-bold text-white shadow-2xl shadow-iara-900/50"
                  style={{ background: 'linear-gradient(135deg,#6366f1 0%,#a855f7 55%,#ec4899 100%)' }}
                >
                  Começar agora — é grátis
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Magnetic>
            </motion.div>
          </motion.div>
        </section>

        {/* ── DOR (editorial, serif italic nos títulos) ────────── */}
        <section className="py-24 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(220,38,38,0.04) 0%, transparent 60%)' }} />
          <div className="max-w-5xl mx-auto relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
              className="text-center mb-20"
            >
              <motion.p variants={fadeUp} className="text-[11px] tracking-[0.3em] uppercase font-semibold text-red-400/70 mb-5">
                <X className="inline w-3 h-3 mb-0.5" /> &nbsp;Se você se reconhece…
              </motion.p>
              <motion.h2 variants={fadeUp} className="font-display font-black text-[clamp(34px,5.5vw,58px)] leading-[1.04] tracking-display mb-4 prose-editorial">
                O problema nunca foi{' '}
                <span className="font-editorial font-normal">tempo</span>.
                <br />
                <span className="text-red-400/85">É não ter sistema.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-[#6b6b8a] text-lg max-w-xl mx-auto">
                Todo profissional que quer crescer online passa pelos mesmos obstáculos. A Iara foi feita pra acabar com eles.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={stagger}
              className="grid md:grid-cols-2 gap-5"
            >
              {painPoints.map((p, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                  className="group flex gap-5 p-7 rounded-2xl border border-white/5 bg-[#0c0610]/60 cursor-default"
                >
                  <div className="w-1 rounded-full bg-red-500/30 group-hover:bg-red-500/60 transition-colors flex-shrink-0" />
                  <div>
                    <h3 className="font-display font-bold text-[#f1f1f8] text-[18px] mb-2">{p.title}</h3>
                    <p className="text-[15px] text-[#6b6b8a] leading-relaxed">{p.sub}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── MÓDULOS BENTO ─────────────────────────────────────── */}
        <section id="modulos" className="py-24 sm:py-32 px-4 sm:px-6 relative">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
              className="mb-16 prose-editorial"
            >
              <motion.p variants={fadeUp} className="text-[11px] tracking-[0.3em] uppercase font-semibold text-iara-400 mb-5">
                — Tudo o que você precisa
              </motion.p>
              <motion.h2 variants={fadeUp} className="font-display font-black text-[clamp(36px,6vw,64px)] leading-[1.02] tracking-display mb-4 max-w-3xl">
                Um estúdio de{' '}
                <span className="font-editorial font-normal">conteúdo</span>{' '}
                inteiro no seu bolso.
              </motion.h2>
              <motion.p variants={fadeUp} className="text-[#6b6b8a] text-lg max-w-xl">
                Cada módulo aprende com seu perfil. Os resultados ficam mais precisos a cada uso.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={stagger}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              {modules.map((m, i) => {
                const Icon = m.icon
                return (
                  <motion.div
                    key={m.title}
                    variants={fadeUp}
                    custom={i % 4}
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                    className="relative p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-[#0e0e1a] to-[#080811] cursor-default overflow-hidden group"
                  >
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: `radial-gradient(circle at 50% 0%, ${m.glow}, transparent 70%)` }}
                    />
                    <div className="relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-[#08080f]/80 flex items-center justify-center mb-4 border border-white/5">
                        <Icon className={`w-[18px] h-[18px] ${m.tag}`} />
                      </div>
                      <h3 className="font-display font-bold text-[#f1f1f8] text-[15px] mb-2 leading-tight">{m.title}</h3>
                      <p className="text-[12.5px] text-[#6b6b8a] leading-relaxed">{m.desc}</p>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>

        {/* ── B2B RIBBON (compacto, não bloco gigante) ────────── */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6 }}
              className="relative rounded-2xl border border-accent-purple/20 p-6 sm:p-8 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(8,8,15,0.9))' }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div>
                  <div className="font-display inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-accent-purple/30 text-accent-purple text-[10px] font-bold mb-3 tracking-[0.2em] uppercase">
                    <Building2 className="w-3 h-3" /> Para Marcas
                  </div>
                  <h3 className="font-display font-bold text-[#f1f1f8] text-[22px] sm:text-[26px] leading-tight mb-1.5">
                    Sua marca na frente de criadores ativos.
                  </h3>
                  <p className="text-[14px] text-[#9b9bb5]">
                    Campanhas, afiliação de produtos, match segmentado.
                  </p>
                </div>
                <Magnetic strength={0.2}>
                  <Link
                    href="/empresas"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)' }}
                  >
                    Conhecer área de empresas
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Magnetic>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── AFILIAÇÃO DE PRODUTOS ─────────────────────────── */}
        <section id="afiliacao" className="py-24 sm:py-32 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(236,72,153,0.06) 0%, transparent 55%)' }} />
          <div className="max-w-5xl mx-auto relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
              className="text-center mb-16 prose-editorial"
            >
              <motion.p variants={fadeUp} className="text-[11px] tracking-[0.3em] uppercase font-semibold text-accent-pink/90 mb-5">
                <Tag className="inline w-3 h-3 mb-0.5" /> &nbsp;Nova fonte de renda
              </motion.p>
              <motion.h2 variants={fadeUp} className="font-display font-black text-[clamp(34px,5.5vw,56px)] leading-[1.04] tracking-display mb-5">
                Divulgue produtos.
                <br />
                <span className="font-editorial font-normal text-accent-pink/90">Ganhe por venda.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-[#6b6b8a] text-lg max-w-2xl mx-auto">
                Marcas cadastram produtos. Você escolhe o que faz sentido pro seu nicho, gera link exclusivo ou cupom personalizado — e recebe por cada venda do seu público.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={stagger}
              className="grid md:grid-cols-3 gap-5"
            >
              {[
                { icon: ShoppingBag, num: '01', title: 'Marcas cadastram', desc: 'Catálogo verificado por nicho, comissão definida.', tag: 'text-accent-pink' },
                { icon: Link2, num: '02', title: 'Você gera link/cupom', desc: 'Um clique. Compartilha onde seu público estiver.', tag: 'text-accent-purple' },
                { icon: DollarSign, num: '03', title: 'Comissão cai na conta', desc: 'Rastreamento automático, sem intermediário.', tag: 'text-green-400' },
              ].map((step, i) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    custom={i}
                    whileHover={{ y: -6 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="relative rounded-2xl p-7 border border-white/5 bg-[#0c0a14]/70 cursor-default"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-11 h-11 rounded-xl bg-[#08080f] border border-white/5 flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${step.tag}`} />
                      </div>
                      <span className="font-display font-black text-[32px] text-[#1a1a2e]">{step.num}</span>
                    </div>
                    <h3 className="font-display font-bold text-[#f1f1f8] text-[17px] mb-2 leading-snug">{step.title}</h3>
                    <p className="text-[14px] text-[#9b9bb5] leading-relaxed">{step.desc}</p>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>

        {/* ── PRICING (já em componente próprio) ─────────────── */}
        <div id="preco">
          <PricingSection />
        </div>

        {/* ── INDIQUE E GANHE (compactada) ───────────────────── */}
        <section id="afiliados" className="py-24 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(168,85,247,0.07) 0%, transparent 60%)' }} />
          <div className="max-w-5xl mx-auto relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
              className="text-center mb-12 prose-editorial"
            >
              <motion.p variants={fadeUp} className="text-[11px] tracking-[0.3em] uppercase font-semibold text-accent-purple/90 mb-5">
                <Gift className="inline w-3 h-3 mb-0.5" /> &nbsp;Indique e ganhe
              </motion.p>
              <motion.h2 variants={fadeUp} className="font-display font-black text-[clamp(30px,4.8vw,50px)] leading-[1.05] tracking-display mb-4">
                Use a Iara. Indique a Iara.{' '}
                <span className="font-editorial font-normal text-accent-purple/90">Ganhe todo mês.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-[#6b6b8a] text-[16px] max-w-2xl mx-auto">
                Metade do primeiro mês vai direto pra você. Depois, 10% por 12 meses enquanto ele continuar assinando. Paga em PIX todo dia 10.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={stagger}
              className="grid md:grid-cols-3 gap-4"
            >
              {affiliateTiers.map((tier, i) => (
                <motion.div
                  key={tier.name}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 20 }}
                  className="relative rounded-2xl p-6 border border-white/5 bg-[#0b0a14]/80 cursor-default"
                >
                  <div className={`font-display font-black text-[42px] ${tier.tag} leading-none mb-1 tracking-display`}>{tier.commission}</div>
                  <div className="text-[10px] text-[#6b6b8a] mb-4 uppercase tracking-[0.2em] font-semibold">do novo assinante</div>
                  <h3 className="font-display font-bold text-[#f1f1f8] text-[17px] mb-2.5">{tier.name}</h3>
                  <p className="text-[13.5px] text-[#9b9bb5] leading-relaxed">{tier.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA FINAL ─────────────────────────────────────── */}
        <section className="py-32 px-4 sm:px-6 relative overflow-hidden">
          <motion.div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
            animate={shouldReduce ? {} : { scale: [1, 1.08, 1], opacity: [0.55, 0.9, 0.55] }}
            transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity }}
            style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.16) 0%, transparent 65%)' }}
          />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="max-w-3xl mx-auto relative z-10 text-center prose-editorial"
          >
            <motion.h2
              variants={fadeUp}
              className="font-display font-black text-[clamp(36px,6.5vw,72px)] leading-[1.02] tracking-display mb-6"
            >
              Sua próxima fase online{' '}
              <span className="font-editorial font-normal">começa agora.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[#9b9bb5] text-[clamp(16px,1.6vw,20px)] mb-12 max-w-lg mx-auto leading-relaxed">
              Cada módulo foi construído pra quem quer escalar seu nome no digital com consistência — sem agência, sem sorte.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Magnetic strength={0.22}>
                <Link
                  href="/register"
                  className="flex items-center gap-2 px-11 py-5 rounded-2xl text-base font-black text-white shadow-2xl shadow-iara-900/60"
                  style={{ background: 'linear-gradient(135deg,#6366f1 0%,#a855f7 55%,#ec4899 100%)' }}
                >
                  Criar conta grátis
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Magnetic>
              <Link href="/login" className="text-sm text-[#9b9bb5] hover:text-[#f1f1f8] transition-colors">
                Já tenho conta →
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[11px] tracking-[0.15em] uppercase text-[#3a3a5a]">
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> LGPD</span>
              <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> 3 dias grátis</span>
              <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-iara-400" /> Acesso imediato</span>
            </motion.div>
          </motion.div>
        </section>

        {/* ── MEGA WORDMARK + FOOTER META ─────────────────────── */}
        <MegaWordmark />
        <footer className="border-t border-white/5 px-4 sm:px-6 py-10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 text-[12px] text-[#3a3a5a]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="font-display font-bold text-[#9b9bb5]">Iara Hub</span>
              <span>·</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-5 flex-wrap justify-center">
              <Link href="/empresas"     className="hover:text-[#9b9bb5] transition-colors">Empresas</Link>
              <Link href="/ajuda"        className="hover:text-[#9b9bb5] transition-colors">Ajuda</Link>
              <Link href="/privacidade"  className="hover:text-[#9b9bb5] transition-colors">Privacidade</Link>
              <Link href="/termos"       className="hover:text-[#9b9bb5] transition-colors">Termos</Link>
              <a href="#afiliados"       className="hover:text-[#9b9bb5] transition-colors">Afiliados</a>
              <Link href="/login"        className="hover:text-[#9b9bb5] transition-colors">Entrar</Link>
            </div>
          </div>
        </footer>
      </div>
    </ScrollWash>
  )
}
