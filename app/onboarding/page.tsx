'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Loader2,
} from 'lucide-react'
import { InstagramIcon, TikTokIcon, YouTubeIcon } from '@/components/platform-icons'

// ─── dados ────────────────────────────────────────────────────────────────────

const NICHOS = [
  'Lifestyle', 'Fitness e saúde', 'Gastronomia', 'Moda e beleza',
  'Finanças e negócios', 'Tecnologia', 'Educação', 'Entretenimento',
  'Viagem', 'Esportes', 'Games', 'Maternidade e família', 'Outro',
]

const PLATAFORMAS = [
  { value: 'Instagram', icon: <InstagramIcon size={18} /> },
  { value: 'TikTok',    icon: <TikTokIcon size={18} /> },
  { value: 'YouTube',   icon: <YouTubeIcon size={18} /> },
  { value: 'Twitter/X', icon: <span className="text-[#1DA1F2] font-bold text-sm">𝕏</span> },
  { value: 'LinkedIn',  icon: <span className="text-[#0A66C2] font-bold text-sm">in</span> },
  { value: 'Kwai',      icon: <span className="text-orange-400 font-bold text-xs">K</span> },
  { value: 'Twitch',    icon: <span className="text-purple-400 font-bold text-xs">T</span> },
  { value: 'Pinterest', icon: <span className="text-red-400 font-bold text-xs">P</span> },
]

const TONS = [
  { value: 'Descontraído e divertido',   emoji: '😄' },
  { value: 'Educativo e informativo',    emoji: '📚' },
  { value: 'Inspiracional e motivacional', emoji: '🚀' },
  { value: 'Direto e objetivo',          emoji: '🎯' },
  { value: 'Storytelling e narrativo',   emoji: '📖' },
  { value: 'Provocativo e polêmico',     emoji: '🔥' },
]

const OBJETIVOS = [
  { value: 'Crescer seguidores rapidamente',    emoji: '📈' },
  { value: 'Monetizar meu conteúdo',            emoji: '💰' },
  { value: 'Construir autoridade no nicho',     emoji: '🏆' },
  { value: 'Fechar parcerias com marcas',       emoji: '🤝' },
  { value: 'Vender meus próprios produtos',     emoji: '🛍️' },
  { value: 'Criar uma comunidade engajada',     emoji: '❤️' },
]

// ─── componente ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [salvando, setSalvando] = useState(false)

  const [nomeArtistico, setNomeArtistico] = useState('')
  const [nicho, setNicho] = useState('')
  const [plataformas, setPlataformas] = useState<string[]>([])
  const [tomDeVoz, setTomDeVoz] = useState('')
  const [objetivo, setObjetivo] = useState('')

  const totalSteps = 4

  function togglePlataforma(p: string) {
    setPlataformas((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  function podeProsseguir() {
    if (step === 1) return nomeArtistico.trim().length > 0
    if (step === 2) return nicho && plataformas.length > 0
    if (step === 3) return tomDeVoz && objetivo
    return true
  }

  async function handleFinalizar() {
    setSalvando(true)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_artistico: nomeArtistico,
          nicho,
          plataformas,
          tom_de_voz: tomDeVoz,
          objetivo,
        }),
      })
      router.push('/dashboard')
    } catch {
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center shadow-lg shadow-iara-900/50">
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="text-2xl font-bold iara-gradient-text">Iara</span>
      </div>

      {/* Card principal */}
      <div className="w-full max-w-lg">
        {/* Barra de progresso */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i + 1 <= step
                  ? 'bg-gradient-to-r from-iara-600 to-accent-purple'
                  : 'bg-[#1a1a2e]'
              }`}
            />
          ))}
        </div>

        <div className="iara-card p-8">

          {/* ── STEP 1: Boas-vindas + nome ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-iara-400 uppercase tracking-wider mb-2">
                  Passo 1 de 4
                </p>
                <h1 className="text-2xl font-bold text-[#f1f1f8] mb-2">
                  Bem-vindo à Iara! 👋
                </h1>
                <p className="text-sm text-[#9b9bb5]">
                  Vou aprender tudo sobre você para personalizar cada conteúdo que criar. Começa com o básico.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#c1c1d8] mb-2">
                  Como você é conhecido? <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={nomeArtistico}
                  onChange={(e) => setNomeArtistico(e.target.value)}
                  placeholder="Ex: Mari Fitness, João Tech, Ana Viajante..."
                  autoFocus
                  className="w-full bg-[#0f0f20] border border-[#1a1a2e] rounded-xl px-4 py-3 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-600/60"
                />
                <p className="text-xs text-[#4a4a6a] mt-1.5">
                  Esse nome vai aparecer nos seus roteiros e conteúdos gerados
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Nicho + plataformas ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-iara-400 uppercase tracking-wider mb-2">
                  Passo 2 de 4
                </p>
                <h2 className="text-2xl font-bold text-[#f1f1f8] mb-2">
                  Seu universo de conteúdo
                </h2>
                <p className="text-sm text-[#9b9bb5]">
                  A Iara usa seu nicho para deixar cada roteiro relevante para a sua audiência.
                </p>
              </div>

              {/* Nicho */}
              <div>
                <label className="block text-sm font-medium text-[#c1c1d8] mb-3">
                  Qual é o seu nicho? <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {NICHOS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setNicho(n)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        nicho === n
                          ? 'bg-iara-600/30 border-iara-600/60 text-iara-300'
                          : 'bg-[#0f0f20] border-[#1a1a2e] text-[#6b6b8a] hover:border-iara-700/40 hover:text-[#9b9bb5]'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plataformas */}
              <div>
                <label className="block text-sm font-medium text-[#c1c1d8] mb-3">
                  Onde você posta? <span className="text-xs text-[#5a5a7a] font-normal">(pode marcar várias)</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PLATAFORMAS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => togglePlataforma(p.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                        plataformas.includes(p.value)
                          ? 'bg-iara-600/20 border-iara-600/50 text-iara-300'
                          : 'bg-[#0f0f20] border-[#1a1a2e] text-[#6b6b8a] hover:border-iara-700/40'
                      }`}
                    >
                      {p.icon}
                      <span className="text-[10px]">{p.value}</span>
                      {plataformas.includes(p.value) && (
                        <Check className="w-3 h-3 text-iara-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Tom de voz + objetivo ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-iara-400 uppercase tracking-wider mb-2">
                  Passo 3 de 4
                </p>
                <h2 className="text-2xl font-bold text-[#f1f1f8] mb-2">
                  Sua identidade como criador
                </h2>
                <p className="text-sm text-[#9b9bb5]">
                  Com essas informações a Iara vai escrever exatamente do seu jeito.
                </p>
              </div>

              {/* Tom de voz */}
              <div>
                <label className="block text-sm font-medium text-[#c1c1d8] mb-3">
                  Qual é o seu tom de voz? <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TONS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTomDeVoz(t.value)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                        tomDeVoz === t.value
                          ? 'bg-iara-600/20 border-iara-600/50 text-iara-300'
                          : 'bg-[#0f0f20] border-[#1a1a2e] text-[#6b6b8a] hover:border-iara-700/40 hover:text-[#9b9bb5]'
                      }`}
                    >
                      <span className="text-base">{t.emoji}</span>
                      {t.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Objetivo */}
              <div>
                <label className="block text-sm font-medium text-[#c1c1d8] mb-3">
                  Seu principal objetivo agora? <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {OBJETIVOS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setObjetivo(o.value)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                        objetivo === o.value
                          ? 'bg-iara-600/20 border-iara-600/50 text-iara-300'
                          : 'bg-[#0f0f20] border-[#1a1a2e] text-[#6b6b8a] hover:border-iara-700/40 hover:text-[#9b9bb5]'
                      }`}
                    >
                      <span className="text-base">{o.emoji}</span>
                      {o.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: Tudo pronto ── */}
          {step === 4 && (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-iara-600/30 to-accent-purple/20 border border-iara-700/30 flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 text-iara-400" />
              </div>

              <div>
                <p className="text-xs font-semibold text-iara-400 uppercase tracking-wider mb-2">
                  Tudo pronto!
                </p>
                <h2 className="text-2xl font-bold text-[#f1f1f8] mb-3">
                  Seu perfil está configurado,{' '}
                  <span className="iara-gradient-text">{nomeArtistico}</span>!
                </h2>
                <p className="text-sm text-[#9b9bb5] max-w-sm mx-auto">
                  A Iara já sabe tudo que precisa para criar conteúdo no seu estilo. Vamos começar?
                </p>
              </div>

              {/* Resumo */}
              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { label: 'Nicho', value: nicho },
                  { label: 'Tom de voz', value: tomDeVoz.split(' e ')[0] },
                  { label: 'Plataformas', value: plataformas.join(', ') },
                  { label: 'Objetivo', value: objetivo.split(' ').slice(0, 4).join(' ') + '...' },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-xl bg-[#0f0f20] border border-[#1a1a2e]">
                    <p className="text-[10px] text-[#4a4a6a] mb-1">{item.label}</p>
                    <p className="text-xs font-medium text-[#c1c1d8] truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navegação */}
          <div className={`flex mt-8 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f0f20] border border-[#1a1a2e] text-[#9b9bb5] hover:text-[#f1f1f8] text-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
            )}

            {step < 4 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!podeProsseguir()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-iara-600 to-accent-purple hover:opacity-90 disabled:opacity-40 text-white text-sm font-semibold transition-all"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinalizar}
                disabled={salvando}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-iara-600 to-accent-purple hover:opacity-90 disabled:opacity-40 text-white text-sm font-semibold transition-all"
              >
                {salvando ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Entrar na Iara</>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#3a3a5a] mt-4">
          Você pode editar tudo isso depois em{' '}
          <span className="text-iara-400">Meu Perfil</span>
        </p>
      </div>
    </div>
  )
}
