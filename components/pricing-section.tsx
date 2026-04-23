'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, Zap } from 'lucide-react'

const PLANS = [
  {
    name: 'Plus',
    desc: 'Pra criadores em crescimento',
    monthly: 59.9,
    annual: 44.9,
    cta: 'Começar 3 dias grátis',
    ctaStyle: 'border border-iara-700/40 text-iara-300 hover:bg-iara-900/30',
    highlight: false,
    items: [
      '10 roteiros por mês',
      '7 carrosseis por mês',
      '7 thumbnails por mês',
      '7 stories por mês',
      '3 análises de oratória',
      '25 fotos no banco',
      'Mídia Kit PDF',
      'Histórico de gerações',
    ],
    locked: ['Métricas com IA'],
  },
  {
    name: 'Premium',
    desc: 'Melhor custo-benefício',
    monthly: 129,
    annual: 96.75,
    cta: 'Começar 3 dias grátis',
    ctaStyle: 'bg-gradient-to-r from-iara-600 to-accent-purple text-white hover:opacity-90',
    highlight: true,
    badge: 'Mais popular',
    items: [
      '20 roteiros por mês',
      '18 carrosseis por mês',
      '18 thumbnails por mês',
      '18 stories por mês',
      '8 análises de oratória',
      '80 fotos no banco',
      'Mídia Kit PDF ilimitado',
      'Métricas com IA',
      'Suporte prioritário',
    ],
    locked: [],
  },
  {
    name: 'Profissional',
    desc: 'Pra quem vive de conteúdo',
    monthly: 249,
    annual: 186.75,
    cta: 'Começar 3 dias grátis',
    ctaStyle: 'bg-gradient-to-r from-accent-purple to-accent-pink text-white hover:opacity-90',
    highlight: false,
    badge: 'Ilimitado',
    items: [
      'Roteiros ilimitados',
      'Carrosseis ilimitados',
      'Thumbnails ilimitados',
      'Stories ilimitados',
      'Oratória ilimitada',
      'Banco de fotos ilimitado',
      'Mídia Kit PDF ilimitado',
      'Métricas com IA',
      'Acesso antecipado a novos módulos',
      'Prioridade no match com marcas',
      'Suporte VIP',
    ],
    locked: [],
  },
  {
    name: 'Agência',
    desc: 'Pra quem gerencia vários clientes',
    monthly: 499,
    annual: 374.25,
    cta: 'Falar com vendas',
    ctaStyle: 'bg-gradient-to-r from-accent-pink to-iara-600 text-white hover:opacity-90',
    highlight: false,
    badge: 'Novo',
    items: [
      'Até 5 perfis gerenciáveis',
      'Tudo do Profissional × 5',
      'Dashboard de clientes',
      'Relatórios white-label',
      'Match prioritário com marcas',
      'API de integração (em breve)',
      'Onboarding assistido',
      'Suporte dedicado',
    ],
    locked: [],
  },
]

export function PricingSection() {
  const [anual, setAnual] = useState(false)

  return (
    <section id="planos" className="py-24 px-4 sm:px-6 bg-[#0d0d1a]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-iara-400 text-sm font-semibold uppercase tracking-wider mb-3">Preços</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#f1f1f8] mb-4">
            3 dias grátis.{' '}
            <span className="iara-gradient-text">Cancele quando quiser.</span>
          </h2>
          <p className="text-[#9b9bb5] mb-2">Teste qualquer plano por 3 dias sem pagar nada. Cancela antes do fim, zero cobrança.</p>
          <p className="text-xs text-[#4a4a6a] mb-8">Pagamento via Cartão de Crédito, Débito ou Boleto</p>

          {/* Toggle mensal/anual */}
          <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-[#0a0a14] border border-[#1a1a2e]">
            <button
              onClick={() => setAnual(false)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                !anual ? 'bg-iara-600/30 text-iara-300 border border-iara-700/40' : 'text-[#6b6b8a] hover:text-[#9b9bb5]'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setAnual(true)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                anual ? 'bg-iara-600/30 text-iara-300 border border-iara-700/40' : 'text-[#6b6b8a] hover:text-[#9b9bb5]'
              }`}
            >
              Anual
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/40 text-green-400 border border-green-800/30">
                25% off
              </span>
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {PLANS.map((plan) => {
            const price = anual ? plan.annual : plan.monthly
            const isGratis = price === 0

            return (
              <div
                key={plan.name}
                className={`iara-card p-5 relative flex flex-col ${
                  plan.highlight
                    ? 'border-iara-600/50 ring-1 ring-iara-600/30 shadow-xl shadow-iara-900/30 bg-gradient-to-b from-iara-900/10 to-transparent'
                    : 'border-[#1a1a2e]'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-iara-600 to-accent-purple'
                        : 'bg-gradient-to-r from-accent-purple to-accent-pink'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-4 mt-1">
                  <p className="font-bold text-[#f1f1f8] text-lg">{plan.name}</p>
                  <p className="text-xs text-[#5a5a7a] mt-0.5">{plan.desc}</p>
                  <div className="flex items-end gap-1 mt-3">
                    {isGratis ? (
                      <span className="text-3xl font-bold text-[#f1f1f8]">Grátis</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-[#f1f1f8]">
                          R${price.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[#9b9bb5] text-sm pb-1">/mês</span>
                      </>
                    )}
                  </div>
                  {anual && !isGratis && (
                    <p className="text-xs text-green-400 mt-1">
                      Cobrado R${(price * 12).toFixed(2).replace('.', ',')}/ano
                    </p>
                  )}
                </div>

                <Link
                  href="/register"
                  className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-semibold transition-all mb-5 ${plan.ctaStyle}`}
                >
                  {isGratis ? (
                    <><Zap className="w-3.5 h-3.5" />{plan.cta}</>
                  ) : (
                    <>{plan.cta} <ChevronRight className="w-3.5 h-3.5" /></>
                  )}
                </Link>

                <ul className="space-y-2 flex-1">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-[#9b9bb5]">
                      <Check className="w-3.5 h-3.5 text-iara-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                  {plan.locked?.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-[#3a3a5a] line-through">
                      <Check className="w-3.5 h-3.5 text-[#2a2a4a] flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Math highlight — comparativo de mercado */}
        <div className="mt-12 rounded-3xl border border-iara-700/20 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(168,85,247,0.04), #0a0a14)' }}>
          <div className="p-6 sm:p-8 grid md:grid-cols-3 gap-6 items-center">

            {/* Bloco 1 — a dor numérica (agência) */}
            <div className="text-center md:text-left">
              <p className="text-[10px] tracking-[0.3em] uppercase font-semibold text-[#6b6b8a] mb-2">Uma agência cobra</p>
              <p className="text-3xl sm:text-4xl font-black text-[#f1f1f8] leading-none tabular-nums">R$ 150<span className="text-lg text-[#6b6b8a] font-normal">/carrossel</span></p>
              <p className="text-xs text-[#5a5a7a] mt-2 leading-relaxed">Um social media júnior cobra R$ 1.800/mês pra entregar ~15 posts.</p>
            </div>

            {/* Bloco central — Iara Premium */}
            <div className="text-center border-t md:border-t-0 md:border-l md:border-r border-white/5 py-5 md:py-0">
              <p className="text-[10px] tracking-[0.3em] uppercase font-semibold text-iara-400 mb-2">Iara Premium</p>
              <p className="text-4xl sm:text-5xl font-black leading-none">
                <span className="bg-gradient-to-br from-[#f1f1f8] via-[#d8ccff] to-accent-purple bg-clip-text text-transparent tabular-nums">
                  R$ 4,30
                </span>
                <span className="text-lg text-[#9b9bb5] font-normal">/dia</span>
              </p>
              <p className="text-xs text-[#9b9bb5] mt-2 leading-relaxed">
                70+ conteúdos por mês por menos que um{' '}
                <span className="italic text-[#d8ccff]" style={{ fontFamily: "'Playfair Display', serif" }}>café</span>.
              </p>
            </div>

            {/* Bloco 3 — o ganho */}
            <div className="text-center md:text-right">
              <p className="text-[10px] tracking-[0.3em] uppercase font-semibold text-green-400/90 mb-2">Economia mensal</p>
              <p className="text-3xl sm:text-4xl font-black leading-none tabular-nums bg-gradient-to-br from-green-400 to-teal-400 bg-clip-text text-transparent">R$ 1.671</p>
              <p className="text-xs text-[#5a5a7a] mt-2 leading-relaxed">
                Vs contratar social media + agência. Ainda sobram 6h por semana.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
