'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react'
import { IaraLogo } from '@/components/iara-logo'
import { InstagramIcon, TikTokIcon, YouTubeIcon } from '@/components/platform-icons'

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

const PLATAFORMAS = [
  { value: 'Instagram', icon: <InstagramIcon size={20} /> },
  { value: 'TikTok',    icon: <TikTokIcon size={20} /> },
  { value: 'YouTube',   icon: <YouTubeIcon size={20} /> },
  { value: 'Twitter/X', icon: <span className="text-white font-bold text-base">𝕏</span> },
  { value: 'LinkedIn',  icon: <span className="text-[#0A66C2] font-bold text-base">in</span> },
  { value: 'Kwai',      icon: <span className="text-orange-400 font-bold text-sm">K</span> },
  { value: 'Twitch',    icon: <span className="text-purple-400 font-bold text-sm">T</span> },
  { value: 'Pinterest', icon: <span className="text-red-400 font-bold text-sm">P</span> },
]

const TONS = [
  { value: 'Descontraído e divertido',    emoji: '😄' },
  { value: 'Educativo e informativo',     emoji: '📚' },
  { value: 'Inspiracional e motivacional',emoji: '🚀' },
  { value: 'Direto e objetivo',           emoji: '🎯' },
  { value: 'Storytelling e narrativo',    emoji: '📖' },
  { value: 'Provocativo e polêmico',      emoji: '🔥' },
]

const OBJETIVOS = [
  { value: 'Crescer seguidores rapidamente', emoji: '📈' },
  { value: 'Monetizar meu conteúdo',         emoji: '💰' },
  { value: 'Construir autoridade no nicho',  emoji: '🏆' },
  { value: 'Fechar parcerias com marcas',    emoji: '🤝' },
  { value: 'Vender meus próprios produtos',  emoji: '🛍️' },
  { value: 'Criar uma comunidade engajada',  emoji: '❤️' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState(false)
  const [nomeArtistico, setNomeArtistico] = useState('')
  const [nichos, setNichos] = useState<string[]>([])
  const [plataformas, setPlataformas] = useState<string[]>([])
  const [tomDeVoz, setTomDeVoz] = useState('')
  const [objetivo, setObjetivo] = useState('')

  function toggleNicho(n: string) {
    setNichos(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])
  }

  function togglePlataforma(p: string) {
    setPlataformas(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  function podeProsseguir() {
    if (step === 1) return nomeArtistico.trim().length > 0
    if (step === 2) return nichos.length > 0 && plataformas.length > 0
    if (step === 3) return !!tomDeVoz && !!objetivo
    return true
  }

  async function handleFinalizar() {
    setSalvando(true)
    setErroSalvar(false)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_artistico: nomeArtistico, nicho: nichos.join(', '), plataformas, tom_de_voz: tomDeVoz, objetivo }),
      })
      if (!res.ok) throw new Error()
      router.push('/dashboard')
    } catch {
      setErroSalvar(true)
      setSalvando(false)
    }
  }

  const stepTitles = ['Seu nome', 'Seu nicho', 'Sua identidade', '']

  return (
    <div className="min-h-screen bg-[#07070f] flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-iara-600/8 blur-[100px] pointer-events-none" />

      {/* Logo */}
      <div className="mb-10">
        <IaraLogo size="sm" layout="horizontal" />
      </div>

      <div className="w-full max-w-md">

        {/* Step indicators */}
        {step < 4 && (
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  s < step ? 'bg-iara-600 text-white' :
                  s === step ? 'bg-gradient-to-br from-iara-500 to-accent-purple text-white shadow-lg shadow-iara-900/50' :
                  'bg-[#1a1a2e] text-[#3a3a5a]'
                }`}>
                  {s < step ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`h-px flex-1 transition-all duration-500 ${
                    s < step ? 'bg-iara-600' : 'bg-[#1a1a2e]'
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div className="rounded-3xl border border-[#1a1a2e] bg-[#0d0d1a]/90 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">

          {/* Step indicator bar */}
          {step < 4 && (
            <div className="h-0.5 bg-[#1a1a2e]">
              <div
                className="h-full bg-gradient-to-r from-iara-600 to-accent-purple transition-all duration-500"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
            </div>
          )}

          <div className="p-7">

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <p className="text-xs font-bold text-iara-400 uppercase tracking-widest mb-3">Boas-vindas 👋</p>
                  <h1 className="text-2xl font-bold text-[#f1f1f8] leading-tight mb-2">
                    Como você é conhecido?
                  </h1>
                  <p className="text-sm text-[#5a5a7a]">
                    Esse nome vai aparecer nos seus roteiros e conteúdos gerados.
                  </p>
                </div>
                <div>
                  <input
                    type="text"
                    value={nomeArtistico}
                    onChange={e => setNomeArtistico(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && podeProsseguir() && setStep(2)}
                    placeholder="Ex: Mari Fitness, João Tech, Ana Viajante..."
                    autoFocus
                    className="w-full rounded-2xl border border-[#1a1a2e] bg-[#0a0a14] px-5 py-4 text-base text-[#f1f1f8] placeholder:text-[#2a2a4a] focus:outline-none focus:border-iara-500/60 focus:ring-2 focus:ring-iara-500/15 transition-all"
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <p className="text-xs font-bold text-iara-400 uppercase tracking-widest mb-3">Passo 2 de 3</p>
                  <h2 className="text-2xl font-bold text-[#f1f1f8] leading-tight mb-2">Seu universo</h2>
                  <p className="text-sm text-[#5a5a7a]">Onde e o que você cria?</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2.5">
                    Nicho * <span className="normal-case text-[#3a3a5a] font-normal">(pode marcar vários)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {NICHOS.map(n => (
                      <button key={n.label} onClick={() => toggleNicho(n.label)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          nichos.includes(n.label)
                            ? 'bg-iara-600/25 border-iara-500/50 text-iara-300'
                            : 'bg-[#0a0a14] border-[#1a1a2e] text-[#5a5a7a] hover:border-iara-700/40 hover:text-[#9b9bb5]'
                        }`}>
                        <span>{n.emoji}</span> {n.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2.5">
                    Plataformas * <span className="normal-case text-[#3a3a5a] font-normal">(pode marcar várias)</span>
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {PLATAFORMAS.map(p => (
                      <button key={p.value} onClick={() => togglePlataforma(p.value)}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                          plataformas.includes(p.value)
                            ? 'bg-iara-600/20 border-iara-500/50 text-iara-300'
                            : 'bg-[#0a0a14] border-[#1a1a2e] text-[#5a5a7a] hover:border-iara-700/40'
                        }`}>
                        {plataformas.includes(p.value) && (
                          <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-iara-500 flex items-center justify-center">
                            <Check className="w-2 h-2 text-white" />
                          </div>
                        )}
                        {p.icon}
                        <span className="text-[10px] leading-tight text-center">{p.value}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <p className="text-xs font-bold text-iara-400 uppercase tracking-widest mb-3">Passo 3 de 3</p>
                  <h2 className="text-2xl font-bold text-[#f1f1f8] leading-tight mb-2">Sua identidade</h2>
                  <p className="text-sm text-[#5a5a7a]">A Iara vai escrever exatamente do seu jeito.</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2.5">Tom de voz *</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TONS.map(t => (
                      <button key={t.value} onClick={() => setTomDeVoz(t.value)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                          tomDeVoz === t.value
                            ? 'bg-iara-600/20 border-iara-500/50 text-iara-300'
                            : 'bg-[#0a0a14] border-[#1a1a2e] text-[#5a5a7a] hover:border-iara-700/40 hover:text-[#9b9bb5]'
                        }`}>
                        <span className="text-base flex-shrink-0">{t.emoji}</span>
                        <span className="leading-tight">{t.value}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2.5">Objetivo principal *</p>
                  <div className="grid grid-cols-2 gap-2">
                    {OBJETIVOS.map(o => (
                      <button key={o.value} onClick={() => setObjetivo(o.value)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                          objetivo === o.value
                            ? 'bg-iara-600/20 border-iara-500/50 text-iara-300'
                            : 'bg-[#0a0a14] border-[#1a1a2e] text-[#5a5a7a] hover:border-iara-700/40 hover:text-[#9b9bb5]'
                        }`}>
                        <span className="text-base flex-shrink-0">{o.emoji}</span>
                        <span className="leading-tight">{o.value}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: Celebração ── */}
            {step === 4 && (
              <div className="text-center space-y-6 py-4 animate-fade-in">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-iara-600/40 to-accent-purple/30 blur-2xl" />
                  <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-iara-600/30 to-accent-purple/20 border border-iara-700/30 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-iara-400" />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-iara-400 uppercase tracking-widest mb-2">Tudo pronto!</p>
                  <h2 className="text-2xl font-bold text-[#f1f1f8] mb-2 leading-tight">
                    Olá, <span className="iara-gradient-text">{nomeArtistico}</span>! 🎉
                  </h2>
                  <p className="text-sm text-[#5a5a7a]">
                    Seu perfil foi configurado. A Iara já sabe criar conteúdo no seu estilo.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left">
                  {[
                    { label: 'Nicho', value: nichos.join(', ') },
                    { label: 'Tom de voz', value: tomDeVoz.split(' e ')[0] },
                    { label: 'Plataformas', value: plataformas.slice(0, 3).join(', ') },
                    { label: 'Objetivo', value: objetivo.split(' ').slice(0, 3).join(' ') + '…' },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-xl bg-[#0a0a14] border border-[#1a1a2e]">
                      <p className="text-[10px] text-[#3a3a5a] mb-1 uppercase tracking-wider font-semibold">{item.label}</p>
                      <p className="text-xs font-medium text-[#c1c1d8] truncate">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navegação */}
            <div className={`flex mt-7 gap-3 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
              {step > 1 && step < 4 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0a0a14] border border-[#1a1a2e] text-[#5a5a7a] hover:text-[#9b9bb5] text-sm transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              {step < 4 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={!podeProsseguir()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex-1 flex flex-col gap-2">
                <button onClick={handleFinalizar} disabled={salvando}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}>
                  {salvando
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                    : <><Sparkles className="w-4 h-4" /> Entrar na Iara</>
                  }
                </button>
                {erroSalvar && (
                  <p className="text-xs text-red-400 text-center">Erro ao salvar. Tente novamente.</p>
                )}
              </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[#2a2a4a] mt-4">
          Você pode editar tudo em <span className="text-iara-500">Meu Perfil</span>
        </p>
      </div>
    </div>
  )
}
