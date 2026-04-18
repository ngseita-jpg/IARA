'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Loader2,
  Building2, Globe, Instagram, Target,
} from 'lucide-react'

const SEGMENTOS = [
  { value: 'moda_beleza',     label: 'Moda e Beleza',         emoji: '👗' },
  { value: 'alimentacao',     label: 'Alimentação',           emoji: '🍕' },
  { value: 'tecnologia',      label: 'Tecnologia',            emoji: '⚡' },
  { value: 'saude_bem_estar', label: 'Saúde e Bem-estar',     emoji: '💪' },
  { value: 'educacao',        label: 'Educação',              emoji: '📚' },
  { value: 'entretenimento',  label: 'Entretenimento',        emoji: '🎬' },
  { value: 'financas',        label: 'Finanças',              emoji: '💰' },
  { value: 'viagem',          label: 'Viagem e Turismo',      emoji: '✈️' },
  { value: 'games',           label: 'Games',                 emoji: '🎮' },
  { value: 'casa_decoracao',  label: 'Casa e Decoração',      emoji: '🏠' },
  { value: 'esportes',        label: 'Esportes',              emoji: '🏆' },
  { value: 'pet',             label: 'Pet',                   emoji: '🐾' },
  { value: 'automotivo',      label: 'Automotivo',            emoji: '🚗' },
  { value: 'sustentabilidade',label: 'Sustentabilidade',      emoji: '🌱' },
  { value: 'outro',           label: 'Outro',                 emoji: '🌟' },
]

const PORTES = [
  { value: 'startup',  label: 'Startup',              desc: 'Até 10 funcionários' },
  { value: 'pequena',  label: 'Pequena empresa',      desc: '11–50 funcionários' },
  { value: 'media',    label: 'Média empresa',        desc: '51–200 funcionários' },
  { value: 'grande',   label: 'Grande empresa',       desc: '200+ funcionários' },
  { value: 'agencia',  label: 'Agência',              desc: 'Gerencia múltiplas marcas' },
]

const NICHOS = [
  { label: 'Lifestyle',             emoji: '✨' },
  { label: 'Fitness e saúde',       emoji: '💪' },
  { label: 'Gastronomia',           emoji: '🍳' },
  { label: 'Moda e beleza',         emoji: '👗' },
  { label: 'Finanças e negócios',   emoji: '💰' },
  { label: 'Tecnologia',            emoji: '⚡' },
  { label: 'Educação',              emoji: '📚' },
  { label: 'Entretenimento',        emoji: '🎬' },
  { label: 'Viagem',                emoji: '✈️' },
  { label: 'Esportes',              emoji: '🏆' },
  { label: 'Games',                 emoji: '🎮' },
  { label: 'Maternidade e família', emoji: '👨‍👩‍👧' },
  { label: 'Outro',                 emoji: '🌟' },
]

const PLATAFORMAS = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn', 'Pinterest', 'Twitch']

const ORCAMENTOS = [
  { value: 'ate_5k',    label: 'Até R$5.000',          desc: 'por campanha' },
  { value: '5k_20k',   label: 'R$5.000 – R$20.000',   desc: 'por campanha' },
  { value: '20k_50k',  label: 'R$20.000 – R$50.000',  desc: 'por campanha' },
  { value: '50k_mais', label: 'Acima de R$50.000',     desc: 'por campanha' },
]

const STEPS = [
  { title: 'Sua empresa',     desc: 'Conte-nos sobre o seu negócio',          icon: Building2 },
  { title: 'Presença online', desc: 'Como encontramos vocês na internet?',     icon: Globe },
  { title: 'Preferências',    desc: 'Que tipo de criador você busca?',         icon: Target },
]

export default function MarcaOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [segmento, setSegmento] = useState('')
  const [porte, setPorte] = useState('')

  // Step 2
  const [site, setSite] = useState('')
  const [instagram, setInstagram] = useState('')
  const [sobre, setSobre] = useState('')

  // Step 3
  const [nichosInteresse, setNichosInteresse] = useState<string[]>([])
  const [plataformasFoco, setPlataformasFoco] = useState<string[]>([])
  const [orcamentoMedio, setOrcamentoMedio] = useState('')

  function toggleNicho(nicho: string) {
    setNichosInteresse(prev =>
      prev.includes(nicho) ? prev.filter(n => n !== nicho) : [...prev, nicho]
    )
  }

  function togglePlataforma(p: string) {
    setPlataformasFoco(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  function canAdvance() {
    if (step === 0) return nomeEmpresa.trim() && segmento && porte
    if (step === 1) return true
    if (step === 2) return nichosInteresse.length > 0 && plataformasFoco.length > 0 && orcamentoMedio
    return false
  }

  async function handleFinish() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/marca/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_empresa: nomeEmpresa.trim(),
          cnpj: cnpj.trim() || null,
          segmento,
          porte,
          site: site.trim() || null,
          instagram: instagram.trim() || null,
          sobre: sobre.trim() || null,
          nichos_interesse: nichosInteresse,
          plataformas_foco: plataformasFoco,
          orcamento_medio: orcamentoMedio,
          onboarding_completo: true,
        }),
      })
      if (!res.ok) throw new Error('Erro ao salvar perfil')
      router.push('/marca/dashboard')
    } catch {
      setError('Erro ao salvar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-iara-500 to-accent-purple blur-xl opacity-50" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center shadow-2xl">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold iara-gradient-text">Área da Marca</h1>
          <p className="text-sm text-[#5a5a7a] mt-1">Configure sua empresa em 3 passos</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                i < step
                  ? 'bg-iara-600 text-white'
                  : i === step
                    ? 'bg-iara-600/30 border border-iara-500 text-iara-300'
                    : 'bg-[#1a1a2e] text-[#3a3a5a]'
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 rounded-full transition-all ${i < step ? 'bg-iara-600' : 'bg-[#1a1a2e]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-[#1a1a2e] bg-[#0f0f1e]/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
          {/* Step header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#f1f1f8]">{STEPS[step].title}</h2>
            <p className="text-sm text-[#5a5a7a] mt-1">{STEPS[step].desc}</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm">
              ⚠ {error}
            </div>
          )}

          {/* STEP 0 — Empresa */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
                  Nome da empresa *
                </label>
                <input
                  type="text"
                  value={nomeEmpresa}
                  onChange={e => setNomeEmpresa(e.target.value)}
                  placeholder="Ex: Marca Brasil Ltda"
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/15 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
                  CNPJ <span className="text-[#3a3a5a] normal-case font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={e => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/15 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-3">
                  Segmento *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SEGMENTOS.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSegmento(s.value)}
                      className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-medium transition-all border ${
                        segmento === s.value
                          ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
                          : 'border-[#1a1a2e] text-[#6b6b8a] hover:border-iara-900/50 hover:text-[#9b9bb5]'
                      }`}
                    >
                      <span className="text-base">{s.emoji}</span>
                      <span className="text-center leading-tight">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-3">
                  Porte da empresa *
                </label>
                <div className="space-y-2">
                  {PORTES.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPorte(p.value)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                        porte === p.value
                          ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
                          : 'border-[#1a1a2e] text-[#9b9bb5] hover:border-iara-900/50'
                      }`}
                    >
                      <span>{p.label}</span>
                      <span className={`text-xs ${porte === p.value ? 'text-iara-500' : 'text-[#3a3a5a]'}`}>{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 — Presença online */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
                  Site <span className="text-[#3a3a5a] normal-case font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3a3a5a]" />
                  <input
                    type="url"
                    value={site}
                    onChange={e => setSite(e.target.value)}
                    placeholder="https://suamarca.com.br"
                    className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 pl-11 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/15 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
                  Instagram <span className="text-[#3a3a5a] normal-case font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3a3a5a]" />
                  <input
                    type="text"
                    value={instagram}
                    onChange={e => setInstagram(e.target.value)}
                    placeholder="@suamarca"
                    className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 pl-11 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/15 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
                  Sobre a empresa <span className="text-[#3a3a5a] normal-case font-normal">(opcional)</span>
                </label>
                <textarea
                  value={sobre}
                  onChange={e => setSobre(e.target.value)}
                  placeholder="Descreva brevemente o que sua empresa faz e o público que atende..."
                  rows={4}
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/15 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2 — Preferências */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-3">
                  Nichos de criador que te interessam *
                </label>
                <div className="flex flex-wrap gap-2">
                  {NICHOS.map(n => (
                    <button
                      key={n.label}
                      type="button"
                      onClick={() => toggleNicho(n.label)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                        nichosInteresse.includes(n.label)
                          ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
                          : 'border-[#1a1a2e] text-[#6b6b8a] hover:border-iara-900/50 hover:text-[#9b9bb5]'
                      }`}
                    >
                      <span>{n.emoji}</span> {n.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-3">
                  Plataformas de foco *
                </label>
                <div className="flex flex-wrap gap-2">
                  {PLATAFORMAS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlataforma(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                        plataformasFoco.includes(p)
                          ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
                          : 'border-[#1a1a2e] text-[#6b6b8a] hover:border-iara-900/50 hover:text-[#9b9bb5]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-3">
                  Orçamento médio por campanha *
                </label>
                <div className="space-y-2">
                  {ORCAMENTOS.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setOrcamentoMedio(o.value)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                        orcamentoMedio === o.value
                          ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
                          : 'border-[#1a1a2e] text-[#9b9bb5] hover:border-iara-900/50'
                      }`}
                    >
                      <span>{o.label}</span>
                      <span className={`text-xs ${orcamentoMedio === o.value ? 'text-iara-500' : 'text-[#3a3a5a]'}`}>{o.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#1a1a2e]">
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[#6b6b8a] hover:text-[#9b9bb5] disabled:opacity-0 disabled:pointer-events-none transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                disabled={!canAdvance()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}
              >
                Próximo <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={!canAdvance() || loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Check className="w-4 h-4" /> Entrar no painel</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
