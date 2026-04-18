'use client'

import { useState, useRef } from 'react'
import {
  Zap, ArrowRight, Loader2, RefreshCw,
  Target, Users, FileText, TrendingUp, Lightbulb,
} from 'lucide-react'

const OBJETIVOS = [
  { value: 'awareness',       label: 'Reconhecimento de marca',      emoji: '📣' },
  { value: 'vendas',          label: 'Gerar vendas diretas',         emoji: '💰' },
  { value: 'lancamento',      label: 'Lançamento de produto',        emoji: '🚀' },
  { value: 'engajamento',     label: 'Engajamento e comunidade',     emoji: '❤️' },
  { value: 'trafego',         label: 'Tráfego para site/app',        emoji: '📱' },
  { value: 'reposicionamento',label: 'Reposicionamento de marca',    emoji: '🔄' },
]

const TONS = [
  { value: 'autêntico',       label: 'Autêntico e real' },
  { value: 'educativo',       label: 'Educativo' },
  { value: 'divertido',       label: 'Divertido e leve' },
  { value: 'aspiracional',    label: 'Aspiracional' },
  { value: 'urgente',         label: 'Urgência e oferta' },
  { value: 'emocional',       label: 'Emocional / storytelling' },
]

function MarkdownResult({ text }: { text: string }) {
  // Renderização simples de markdown sem dependência externa
  const lines = text.split('\n')
  return (
    <div className="prose-custom space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="text-base font-bold text-[#f1f1f8] mt-6 mb-2 first:mt-0 flex items-center gap-2">
              {line.replace('## ', '')}
            </h2>
          )
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="text-sm font-bold text-[#E2C068] mt-4 mb-1.5">
              {line.replace('### ', '')}
            </h3>
          )
        }
        if (line.startsWith('**') && line.endsWith('**') && !line.includes(':** ')) {
          return (
            <p key={i} className="text-sm font-semibold text-[#f1f1f8] mt-3">
              {line.replace(/\*\*/g, '')}
            </p>
          )
        }
        if (line.startsWith('- ')) {
          return (
            <li key={i} className="text-sm text-[#c9c9d8] ml-4 list-none flex gap-2">
              <span className="text-[#C9A84C] mt-1 flex-shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#f1f1f8]">$1</strong>') }} />
            </li>
          )
        }
        if (line.startsWith('| ')) {
          const cells = line.split('|').filter(c => c.trim())
          if (cells.every(c => c.trim().match(/^-+$/))) return null
          return (
            <div key={i} className="flex gap-4 text-xs border-b border-[#1a1a2e] py-1.5">
              {cells.map((cell, j) => (
                <span key={j} className={`flex-1 ${j === 0 ? 'text-[#E2C068] font-medium' : 'text-[#9b9bb5]'}`}>
                  {cell.trim()}
                </span>
              ))}
            </div>
          )
        }
        if (line.startsWith('---')) {
          return <hr key={i} className="border-[#1a1a2e] my-4" />
        }
        if (line.trim() === '') return <div key={i} className="h-1" />
        // Inline bold
        const processed = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#f1f1f8] font-semibold">$1</strong>')
        return (
          <p key={i} className="text-sm text-[#c9c9d8] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: processed }} />
        )
      })}
    </div>
  )
}

const SECTIONS = [
  { icon: Target,    label: 'Diagnóstico', keyword: 'Diagnóstico' },
  { icon: TrendingUp,label: 'Estratégia',  keyword: 'Estratégia' },
  { icon: Users,     label: 'Perfil Ideal',keyword: 'Perfil Ideal' },
  { icon: FileText,  label: 'Briefing',    keyword: 'Briefing' },
  { icon: Lightbulb, label: 'Conceitos',   keyword: 'Conceitos' },
  { icon: TrendingUp,label: 'KPIs',        keyword: 'KPIs' },
]

export default function CampanhaPage() {
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form')
  const [resultado, setResultado] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [produto, setProduto] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [publicoAlvo, setPublicoAlvo] = useState('')
  const [diferenciais, setDiferenciais] = useState('')
  const [tomDesejado, setTomDesejado] = useState('')
  const [budget, setBudget] = useState('')

  const resultRef = useRef<HTMLDivElement>(null)

  function canSubmit() {
    return produto.trim().length > 5 && objetivo
  }

  async function handleGenerate() {
    if (!canSubmit()) return
    setStep('loading')
    setError(null)
    setResultado('')

    try {
      const res = await fetch('/api/marca/campanha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto, objetivo, publicoAlvo, diferenciais, tomDesejado, budget }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao gerar campanha')
      }

      setStep('result')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setResultado(prev => prev + chunk)
        // Auto-scroll
        if (resultRef.current) {
          resultRef.current.scrollTop = resultRef.current.scrollHeight
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
      setStep('form')
    }
  }

  function handleReset() {
    setStep('form')
    setResultado('')
    setError(null)
    setProduto('')
    setObjetivo('')
    setPublicoAlvo('')
    setDiferenciais('')
    setTomDesejado('')
    setBudget('')
  }

  const sectionsDetected = SECTIONS.filter(s => resultado.includes(s.keyword))

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-[#5a5a7a] mb-2">
          <span>Área da Marca</span>
          <span>/</span>
          <span className="text-[#9b9bb5]">Campanha IA</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#f1f1f8]">
              Gerador de <span className="marca-gradient-text">Campanhas IA</span>
            </h1>
            <p className="text-sm text-[#5a5a7a] mt-1 max-w-xl">
              Estratégia completa, briefing pronto e 3 conceitos de conteúdo — tudo o que sua equipe precisaria de semanas para criar.
            </p>
          </div>
          {step === 'result' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#1a1a2e] text-[#9b9bb5] hover:border-[#C9A84C]/30 hover:text-[#E2C068] transition-all flex-shrink-0"
            >
              <RefreshCw className="w-4 h-4" /> Nova campanha
            </button>
          )}
        </div>
      </div>

      {/* What you get — pills */}
      {step === 'form' && (
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { icon: Target,    label: 'Diagnóstico de mercado' },
            { icon: TrendingUp,label: 'Estratégia de campanha' },
            { icon: Users,     label: 'Perfil ideal do criador' },
            { icon: FileText,  label: 'Briefing pronto para envio' },
            { icon: Lightbulb, label: '3 conceitos com hooks' },
            { icon: TrendingUp,label: 'KPIs e benchmarks' },
          ].map(item => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[#C9A84C]/15 text-[#9b9bb5]"
                style={{ background: 'rgba(201,168,76,0.05)' }}>
                <Icon className="w-3.5 h-3.5 text-[#C9A84C]" />
                {item.label}
              </div>
            )
          })}
        </div>
      )}

      {/* Form */}
      {step !== 'result' && (
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] p-6 mb-6">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm">
              ⚠ {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Produto */}
            <div>
              <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
                Produto ou serviço *
              </label>
              <textarea
                value={produto}
                onChange={e => setProduto(e.target.value)}
                disabled={step === 'loading'}
                placeholder="Ex: Suplemento de colágeno vegano, sabor neutro, R$89. Focado em mulheres 30+ preocupadas com pele e articulações. Já temos 5.000 avaliações positivas."
                rows={3}
                className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/40 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/10 transition-all resize-none disabled:opacity-50"
              />
              <p className="text-xs text-[#3a3a5a] mt-1.5">Quanto mais contexto, mais preciso o diagnóstico</p>
            </div>

            {/* Objetivo */}
            <div>
              <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-3">
                Objetivo principal *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {OBJETIVOS.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setObjetivo(o.value)}
                    disabled={step === 'loading'}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border disabled:opacity-50 ${
                      objetivo === o.value
                        ? 'bg-[#C9A84C]/15 border-[#C9A84C]/35 text-[#E2C068]'
                        : 'border-[#1a1a2e] text-[#6b6b8a] hover:border-[#C9A84C]/20 hover:text-[#9b9bb5]'
                    }`}
                  >
                    <span>{o.emoji}</span> {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid — público + diferenciais */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
                  Público-alvo <span className="text-[#3a3a5a] normal-case font-normal">(opcional)</span>
                </label>
                <input
                  value={publicoAlvo}
                  onChange={e => setPublicoAlvo(e.target.value)}
                  disabled={step === 'loading'}
                  placeholder="Ex: Mulheres 28-40, classe B/C, interessadas em saúde"
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/40 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/10 transition-all disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
                  Diferenciais <span className="text-[#3a3a5a] normal-case font-normal">(opcional)</span>
                </label>
                <input
                  value={diferenciais}
                  onChange={e => setDiferenciais(e.target.value)}
                  disabled={step === 'loading'}
                  placeholder="Ex: Único vegano do mercado, entrega em 24h"
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/40 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/10 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Tom + Budget */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-3">
                  Tom desejado <span className="text-[#3a3a5a] normal-case font-normal">(opcional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {TONS.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTomDesejado(tomDesejado === t.value ? '' : t.value)}
                      disabled={step === 'loading'}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border disabled:opacity-50 ${
                        tomDesejado === t.value
                          ? 'bg-[#C9A84C]/15 border-[#C9A84C]/35 text-[#E2C068]'
                          : 'border-[#1a1a2e] text-[#6b6b8a] hover:border-[#C9A84C]/20 hover:text-[#9b9bb5]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
                  Budget da campanha <span className="text-[#3a3a5a] normal-case font-normal">(opcional)</span>
                </label>
                <input
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  disabled={step === 'loading'}
                  placeholder="Ex: R$5.000 a R$15.000"
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/40 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/10 transition-all disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 pt-5 border-t border-[#1a1a2e] flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={!canSubmit() || step === 'loading'}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-[#0a0a14] disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90 hover:scale-[1.01]"
              style={{ background: canSubmit() ? 'linear-gradient(135deg, #E2C068 0%, #C9A84C 50%, #a855f7 100%)' : undefined }}
            >
              {step === 'loading' ? (
                <><Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="text-white">Gerando diagnóstico...</span></>
              ) : (
                <><Zap className="w-4 h-4" /> Gerar diagnóstico completo
                  <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
            {step === 'loading' && (
              <p className="text-xs text-[#5a5a7a]">A IA está analisando sua campanha — pode levar até 30 segundos</p>
            )}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {step === 'loading' && resultado === '' && (
        <div className="rounded-2xl border border-[#C9A84C]/15 bg-[#0f0f1e] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center animate-pulse"
              style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.3), rgba(168,85,247,0.3))' }}>
              <Zap className="w-4 h-4 text-[#E2C068]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#f1f1f8]">Analisando sua campanha...</p>
              <p className="text-xs text-[#5a5a7a]">Construindo estratégia personalizada</p>
            </div>
          </div>
          <div className="space-y-3">
            {[80, 60, 90, 50, 70].map((w, i) => (
              <div key={i} className="h-3 rounded-full bg-[#1a1a2e] animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {step === 'result' && resultado && (
        <div className="space-y-4">
          {/* Section progress pills */}
          {sectionsDetected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sectionsDetected.map(s => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[#C9A84C]/20 text-[#C9A84C]"
                    style={{ background: 'rgba(201,168,76,0.08)' }}>
                    <Icon className="w-3 h-3" /> {s.label}
                  </div>
                )
              })}
            </div>
          )}

          {/* Result card */}
          <div
            ref={resultRef}
            className="rounded-2xl border border-[#C9A84C]/15 bg-[#0f0f1e] p-6 max-h-[75vh] overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(201,168,76,0.3) transparent' }}
          >
            <MarkdownResult text={resultado} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(resultado)
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#1a1a2e] text-[#9b9bb5] hover:border-[#C9A84C]/30 hover:text-[#E2C068] transition-all"
            >
              <FileText className="w-4 h-4" /> Copiar resultado
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#1a1a2e] text-[#9b9bb5] hover:border-[#C9A84C]/30 hover:text-[#E2C068] transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Nova campanha
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
