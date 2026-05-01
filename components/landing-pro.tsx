'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ArrowRight, Check, Zap, Clock,
  AlertCircle, FileText, Layers, Smartphone, ChevronDown,
  Shield, ChevronRight,
} from 'lucide-react'
import { IaraLogo } from '@/components/iara-logo'
import type { NichoPro } from '@/lib/nichos-pro'
import { toast } from '@/lib/toast'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  )
}

const TIPO_ICONE: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  reel:      { icon: Smartphone, label: 'Reel',      color: 'text-accent-pink' },
  carrossel: { icon: Layers,     label: 'Carrossel', color: 'text-iara-400' },
  story:     { icon: FileText,   label: 'Story',     color: 'text-accent-purple' },
}

export function LandingPro({ nicho }: { nicho: NichoPro }) {
  const [faqAberto, setFaqAberto] = useState<number | null>(0)
  const [carregandoCheckout, setCarregandoCheckout] = useState<string | null>(null)

  // Salva intenção de plano + redireciona pra /register
  async function handleAssinar(plano: 'plus' | 'premium') {
    setCarregandoCheckout(plano)
    try {
      // Tenta direto (caso já esteja logado)
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano, periodo: 'mensal' }),
      })
      if (res.status === 401) {
        const params = new URLSearchParams({
          intent: 'assinar',
          plano,
          periodo: 'mensal',
          ref: nicho.slug,
        })
        window.location.href = `/register?${params}`
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao iniciar checkout')
        setCarregandoCheckout(null)
        return
      }
      if (data.url) window.location.href = data.url
    } catch {
      toast.error('Erro de conexão')
      setCarregandoCheckout(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#08080f] text-[#f1f1f8]">
      {/* Top bar mínima */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#08080f]/80 border-b border-[#1a1a2e]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/">
            <IaraLogo size="sm" layout="horizontal" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-sm text-[#9b9bb5] hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link
              href={`/register?ref=${nicho.slug}`}
              className="px-4 min-h-11 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-iara-600 to-accent-purple text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Começar grátis <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden px-4 sm:px-6 py-16 sm:py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-iara-600/10 blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-iara-700/40 bg-iara-900/20 text-iara-300 text-xs font-semibold mb-6"
          >
            <span className="text-base">{nicho.emoji}</span>
            Iara Hub para {nicho.nome}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black leading-[1.05] tracking-tight mb-5"
          >
            {nicho.hero.headline}{' '}
            <span className="iara-gradient-text">{nicho.hero.headlineDestaque}</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-base sm:text-lg text-[#9b9bb5] max-w-2xl mx-auto leading-relaxed mb-8"
          >
            {nicho.hero.subheadline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href={`/register?ref=${nicho.slug}`}
              className="w-full sm:w-auto px-6 min-h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-iara-600 via-accent-purple to-accent-pink text-white text-base font-bold hover:opacity-90 transition-opacity shadow-2xl shadow-purple-900/30"
            >
              Começar 3 dias grátis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#planos"
              className="w-full sm:w-auto px-5 min-h-12 inline-flex items-center justify-center text-sm text-[#9b9bb5] hover:text-white transition-colors"
            >
              Ver preços ↓
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-xs text-[#5a5a7a] mt-5"
          >
            Sem cartão pra testar · Cancela quando quiser · LGPD compliant
          </motion.p>
        </div>
      </section>

      {/* VOCE É ASSIM? */}
      <Section className="px-4 sm:px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-bold text-center mb-10">
            Você é {nicho.nomeSingular} <span className="iara-gradient-text">se identificou?</span>
          </motion.h2>
          <div className="space-y-3">
            {nicho.voceE.map((frase, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="flex items-start gap-3 p-4 rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e]"
              >
                <div className="w-7 h-7 rounded-full bg-iara-600/20 border border-iara-700/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-iara-400" />
                </div>
                <p className="text-sm sm:text-base text-[#c9c9d8] leading-relaxed">{frase}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* DORES */}
      <Section className="px-4 sm:px-6 py-16 bg-[#0a0a14]">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <p className="text-iara-400 text-xs font-semibold uppercase tracking-[0.3em] mb-3">O problema</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Por que tantos {nicho.nome.toLowerCase()} <span className="iara-gradient-text">desistem do Instagram</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4">
            {nicho.dores.map((d, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="p-6 rounded-2xl border border-red-900/30 bg-gradient-to-b from-red-950/15 to-transparent"
              >
                <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-900/40 flex items-center justify-center mb-4">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 leading-tight">{d.titulo}</h3>
                <p className="text-sm text-[#9b9bb5] leading-relaxed">{d.descricao}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* SOLUÇÃO + EXEMPLOS */}
      <Section className="px-4 sm:px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <p className="text-iara-400 text-xs font-semibold uppercase tracking-[0.3em] mb-3">A solução</p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Uma IA que <span className="iara-gradient-text">conhece a sua área</span>
            </h2>
            <p className="text-base text-[#9b9bb5] max-w-2xl mx-auto leading-relaxed">
              Veja exemplos do tipo de conteúdo que a Iara cria pra {nicho.nome.toLowerCase()} — em segundos, no seu tom, dentro do conselho regulador.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nicho.exemplosPosts.map((ex, i) => {
              const meta = TIPO_ICONE[ex.tipo]
              const Icon = meta.icon
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="p-5 rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] hover:border-iara-700/40 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-white leading-snug">&ldquo;{ex.titulo}&rdquo;</p>
                </motion.div>
              )
            })}
          </div>

          <motion.p variants={fadeUp} className="text-center text-xs text-[#5a5a7a] mt-8">
            E mais de 50 outros formatos por mês — adaptado ao seu tom, sua especialidade, sua audiência.
          </motion.p>
        </div>
      </Section>

      {/* COMO FUNCIONA */}
      <Section className="px-4 sm:px-6 py-16 bg-[#0a0a14]">
        <div className="max-w-4xl mx-auto">
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Como funciona <span className="iara-gradient-text">em 3 minutos</span>
          </motion.h2>
          <div className="space-y-4">
            {[
              { n: 1, titulo: 'Você descreve sua área', desc: `${nicho.nome.charAt(0).toUpperCase() + nicho.nome.slice(1, -1).toLowerCase()}, especialidade, tom de voz, público. Leva 3-5 minutos no onboarding.` },
              { n: 2, titulo: 'A Iara aprende seu jeito', desc: 'Ela treina nos seus relatos, sua história, seu posicionamento. Próxima geração já é "no seu tom".' },
              { n: 3, titulo: 'Você gera quando quiser', desc: 'Roteiro de Reel, carrossel, story, thumbnail. Em 30 segundos. Você ajusta, copia e posta.' },
            ].map((p, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="flex items-start gap-4 p-5 rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e]"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-iara-600 to-accent-purple flex items-center justify-center flex-shrink-0 text-white font-black text-sm">
                  {p.n}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white mb-1">{p.titulo}</h3>
                  <p className="text-sm text-[#9b9bb5] leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ROI / COMPARAÇÃO */}
      <Section className="px-4 sm:px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-bold text-center mb-12">
            <span className="iara-gradient-text">Quanto você economiza</span> por mês
          </motion.h2>
          <motion.div
            variants={fadeUp}
            className="rounded-3xl border border-iara-700/30 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(168,85,247,0.03), #0a0a14)' }}
          >
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#1a1a2e]">
              <div className="p-6 sm:p-8 text-center md:text-left">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#6b6b8a] font-semibold mb-2">Agência cobra</p>
                <p className="text-3xl sm:text-4xl font-black text-white tabular-nums">
                  R$ {nicho.roi.custoAgenciaMes.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-[#5a5a7a] mt-2">/mês — e ainda escreve genérico</p>
              </div>
              <div className="p-6 sm:p-8 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-iara-400 font-semibold mb-2">Iara Premium</p>
                <p className="text-3xl sm:text-4xl font-black">
                  <span className="iara-gradient-text tabular-nums">R$ 129</span>
                </p>
                <p className="text-xs text-[#9b9bb5] mt-2">/mês — todos os módulos</p>
              </div>
              <div className="p-6 sm:p-8 text-center md:text-right">
                <p className="text-[10px] uppercase tracking-[0.3em] text-green-400 font-semibold mb-2">Você economiza</p>
                <p className="text-3xl sm:text-4xl font-black text-green-400 tabular-nums">
                  R$ {(nicho.roi.custoAgenciaMes - 129).toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-[#5a5a7a] mt-2">/mês + {nicho.roi.economiaHorasSemana}h da sua semana</p>
              </div>
            </div>
            <div className="p-5 sm:p-6 border-t border-[#1a1a2e] bg-[#08080f]/50 flex items-start gap-3">
              <Clock className="w-4 h-4 text-iara-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#9b9bb5] leading-relaxed">
                Em vez de gastar {nicho.roi.economiaHorasSemana}h/semana produzindo conteúdo manual,
                você usa essas horas pra atender mais pacientes/clientes — ou simplesmente
                ter sua noite livre.
              </p>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* PLANOS */}
      <Section className="px-4 sm:px-6 py-16 bg-[#0a0a14]" >
        <div id="planos" className="max-w-4xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Comece com <span className="iara-gradient-text">3 dias grátis</span>
            </h2>
            <p className="text-base text-[#9b9bb5]">
              Cancela antes do 4º dia, zero cobrança. Pagamento mensal, sem fidelidade.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Plus */}
            <motion.div
              variants={fadeUp}
              className="p-6 rounded-3xl border border-[#1a1a2e] bg-[#0f0f1e]"
            >
              <p className="font-bold text-white text-lg">Plus</p>
              <p className="text-xs text-[#6b6b8a] mt-0.5 mb-4">Pra começar</p>
              <div className="flex items-end gap-1 mb-5">
                <span className="text-3xl font-black text-white">R$ 59,90</span>
                <span className="text-[#9b9bb5] text-sm pb-1">/mês</span>
              </div>
              <button
                onClick={() => handleAssinar('plus')}
                disabled={!!carregandoCheckout}
                className="w-full min-h-12 rounded-xl border border-iara-700/40 text-iara-300 hover:bg-iara-900/30 text-sm font-semibold mb-5 disabled:opacity-50 transition-colors"
              >
                {carregandoCheckout === 'plus' ? 'Abrindo checkout...' : 'Começar 3 dias grátis'}
              </button>
              <ul className="space-y-2 text-xs text-[#9b9bb5]">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-iara-400" /> 10 roteiros/mês</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-iara-400" /> 7 carrosseis/mês</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-iara-400" /> 7 thumbnails/mês</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-iara-400" /> 7 stories/mês</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-iara-400" /> Mídia kit profissional</li>
              </ul>
            </motion.div>

            {/* Premium destacado */}
            <motion.div
              variants={fadeUp}
              className="p-6 rounded-3xl border border-iara-600/50 bg-gradient-to-b from-iara-900/15 to-transparent ring-1 ring-iara-600/30 shadow-2xl shadow-iara-900/30 relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-iara-600 to-accent-purple text-white text-[10px] font-bold whitespace-nowrap">
                MAIS ESCOLHIDO POR {nicho.nome.toUpperCase()}
              </div>
              <p className="font-bold text-white text-lg">Premium</p>
              <p className="text-xs text-[#9b9bb5] mt-0.5 mb-4">Ideal pra agenda cheia</p>
              <div className="flex items-end gap-1 mb-5">
                <span className="text-3xl font-black text-white">R$ 129</span>
                <span className="text-[#9b9bb5] text-sm pb-1">/mês</span>
              </div>
              <button
                onClick={() => handleAssinar('premium')}
                disabled={!!carregandoCheckout}
                className="w-full min-h-12 rounded-xl bg-gradient-to-r from-iara-600 to-accent-purple text-white font-bold text-sm hover:opacity-90 mb-5 disabled:opacity-50"
              >
                {carregandoCheckout === 'premium' ? 'Abrindo checkout...' : 'Começar 3 dias grátis'}
              </button>
              <ul className="space-y-2 text-xs text-[#c9c9d8]">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-iara-400" /> 20 roteiros/mês</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-iara-400" /> 18 carrosseis/mês</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-iara-400" /> 18 thumbnails/mês</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-iara-400" /> 18 stories/mês</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-iara-400" /> Métricas com IA</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-iara-400" /> Mídia kit + link público</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-iara-400" /> Suporte prioritário</li>
              </ul>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="mt-6 flex items-center justify-center gap-2 text-xs text-[#5a5a7a]">
            <Shield className="w-3.5 h-3.5" />
            <span>Pagamento seguro via Stripe · Cartão / Boleto · Cancela quando quiser</span>
          </motion.div>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="px-4 sm:px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-bold text-center mb-10">
            Perguntas <span className="iara-gradient-text">de {nicho.nome.toLowerCase()}</span>
          </motion.h2>
          <div className="space-y-2">
            {nicho.faq.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] overflow-hidden"
              >
                <button
                  onClick={() => setFaqAberto(faqAberto === i ? null : i)}
                  className="w-full flex items-center gap-3 p-5 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="flex-1 text-sm sm:text-base font-semibold text-white">{f.pergunta}</span>
                  <ChevronDown className={`w-4 h-4 text-[#6b6b8a] flex-shrink-0 transition-transform ${faqAberto === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {faqAberto === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm text-[#9b9bb5] leading-relaxed">{f.resposta}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA FINAL */}
      <Section className="px-4 sm:px-6 py-20 bg-[#0a0a14]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div variants={fadeUp} className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-iara-600 to-accent-purple mb-6">
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-black mb-4 leading-tight">
            Sua agenda já tá cheia.<br />
            <span className="iara-gradient-text">A Iara cuida do Instagram.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-base text-[#9b9bb5] mb-8 max-w-xl mx-auto">
            3 dias grátis pra testar. Cancela antes, zero cobrança.
            Nenhum compromisso, nenhuma fidelidade.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              href={`/register?ref=${nicho.slug}`}
              className="inline-flex items-center gap-2 px-7 min-h-14 rounded-2xl bg-gradient-to-r from-iara-600 via-accent-purple to-accent-pink text-white text-base font-black hover:opacity-90 shadow-2xl shadow-purple-900/30"
            >
              <Zap className="w-5 h-5" />
              Começar grátis agora
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-6 flex items-center justify-center gap-4 text-xs text-[#5a5a7a]">
            <span>{nicho.emoji} Para {nicho.nome}</span>
            <span>·</span>
            <span>🇧🇷 Feito no Brasil</span>
            <span>·</span>
            <span>🛡️ LGPD compliant</span>
          </motion.div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a2e] py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5a5a7a]">
          <div className="flex items-center gap-2">
            <IaraLogo size="sm" layout="horizontal" />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/profissionais" className="hover:text-iara-400 transition-colors">Outras profissões</Link>
            <Link href="/privacidade" className="hover:text-iara-400 transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-iara-400 transition-colors">Termos</Link>
          </div>
          <span>© {new Date().getFullYear()} Iara Hub</span>
        </div>
      </footer>
    </div>
  )
}
