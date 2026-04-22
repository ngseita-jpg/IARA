'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Sparkles, Check, ArrowRight, Zap, Lock, Loader2, Crown,
  FileText, Layers, Image, Smartphone, Mic, BookOpen, Lightbulb,
} from 'lucide-react'

export type TipoModulo =
  | 'roteiro' | 'carrossel' | 'thumbnail' | 'stories'
  | 'oratorio' | 'midia_kit' | 'temas' | 'fotos' | null

const MODULO_INFO: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  roteiro:   { label: 'Roteiros',        icon: FileText,   color: '#818cf8' },
  carrossel: { label: 'Carrossel',       icon: Layers,     color: '#ec4899' },
  thumbnail: { label: 'Thumbnails',      icon: Image,      color: '#2dd4bf' },
  stories:   { label: 'Stories',         icon: Smartphone, color: '#a855f7' },
  oratorio:  { label: 'Oratória',        icon: Mic,        color: '#4ade80' },
  midia_kit: { label: 'Mídia Kit',       icon: BookOpen,   color: '#fbbf24' },
  temas:     { label: 'Faísca Criativa', icon: Lightbulb,  color: '#818cf8' },
  fotos:     { label: 'Banco de Fotos',  icon: Image,      color: '#818cf8' },
}

const PLANS = [
  {
    id: 'plus' as const,
    name: 'Plus',
    price: '49,90',
    tagline: 'Para quem está crescendo',
    accentColor: '#818cf8',
    cardBg: 'bg-[#0f0f1e]',
    border: 'border-iara-700/30',
    badgeText: null,
    items: [
      '10 roteiros/mês',
      '7 carrosseis/mês',
      '7 thumbnails/mês',
      '7 stories/mês',
      '3 análises de oratória',
      '7 sessões Faísca IA',
      '25 fotos no banco',
    ],
    cta: 'Assinar Plus',
    ctaBg: 'bg-iara-900/60 hover:bg-iara-800/60 border border-iara-700/50',
    ctaText: 'text-iara-300',
    featured: false,
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    price: '89,00',
    tagline: 'O favorito dos criadores',
    accentColor: '#a855f7',
    cardBg: 'bg-[#0f0f1e]',
    border: 'border-violet-600/50',
    badgeText: 'Mais popular',
    items: [
      '20 roteiros/mês',
      '18 carrosseis/mês',
      '18 thumbnails/mês',
      '18 stories/mês',
      '8 análises de oratória',
      '15 sessões Faísca IA',
      '80 fotos no banco',
      'Métricas com IA',
      'Suporte prioritário',
    ],
    cta: 'Assinar Premium',
    ctaBg: '',
    ctaGradient: 'linear-gradient(135deg,#6366f1,#a855f7)',
    ctaText: 'text-white',
    featured: true,
  },
  {
    id: 'profissional' as const,
    name: 'Profissional',
    price: '179,90',
    tagline: 'Para quem vive de criação',
    accentColor: '#10b981',
    cardBg: 'bg-[#0a1a12]',
    border: 'border-emerald-600/40',
    badgeText: 'Sem limites',
    items: [
      'Tudo ilimitado — sem exceção',
      'Roteiros, carrosseis, stories ∞',
      'Thumbnails e Faísca IA ∞',
      'Banco de fotos ilimitado',
      'Oratória ilimitada',
      'Suporte VIP direto',
      'Prioridade com marcas parceiras',
      'Acesso antecipado a novidades',
    ],
    cta: 'Assinar Profissional',
    ctaBg: '',
    ctaGradient: 'linear-gradient(135deg,#059669,#10b981)',
    ctaText: 'text-white',
    featured: false,
    elite: true,
  },
]

interface Props {
  open: boolean
  modulo?: TipoModulo
  onClose: () => void
}

export function UpgradeModal({ open, modulo, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const info = modulo ? MODULO_INFO[modulo] : null
  const Icon = info?.icon ?? Sparkles

  async function handleCheckout(plano: string) {
    setLoading(plano)
    try {
      // Tracking de início de checkout
      const precos: Record<string, number> = { plus: 49.90, premium: 89.00, profissional: 179.90 }
      try {
        const { trackStartCheckout } = await import('@/lib/analytics-events')
        trackStartCheckout(plano, precos[plano] ?? 0)
      } catch { /* ignore */ }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(null)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        className="relative w-full sm:max-w-3xl max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#1a1a2e] shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #0e0e1e 0%, #0a0a16 100%)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#4a4a6a] hover:text-[#f1f1f8] hover:bg-[#1a1a2e] transition-all z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(20px)' }} />

        <div className="relative p-5 sm:p-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl"
                style={{ background: info ? `${info.color}22` : 'rgba(99,102,241,0.15)', border: `1px solid ${info ? info.color + '40' : 'rgba(99,102,241,0.3)'}` }}>
                <Icon className="w-6 h-6" style={{ color: info?.color ?? '#818cf8' }} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(180,100,20,0.2)', border: '1px solid rgba(180,100,20,0.4)' }}>
                <Lock className="w-2.5 h-2.5 text-amber-400" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-800/30 bg-amber-950/30 text-amber-400 text-xs font-bold mb-3">
              <Zap className="w-3 h-3" />
              {info ? `Limite de ${info.label} atingido` : 'Desbloqueie seu potencial'}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#f1f1f8] mb-2 leading-tight">
              Não deixe o ritmo parar.
            </h2>
            <p className="text-sm text-[#6b6b8a] max-w-sm">
              Escolha o plano certo e continue criando sem interrupção.
            </p>
          </div>

          {/* Plans grid */}
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-4 border ${plan.border} ${plan.cardBg} flex flex-col ${plan.featured ? 'ring-1 ring-violet-600/30' : ''} ${plan.elite ? 'ring-1 ring-emerald-600/25' : ''}`}
              >
                {/* Badge */}
                {plan.badgeText && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold text-white shadow-lg whitespace-nowrap"
                    style={{ background: plan.elite ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#6366f1,#a855f7)' }}
                  >
                    {plan.elite && <Crown className="w-2.5 h-2.5 inline mr-1 -mt-0.5" />}
                    {plan.badgeText}
                  </div>
                )}

                {/* Plan info */}
                <div className="mb-3 mt-1">
                  <p className="font-bold text-[#f1f1f8]" style={{ color: plan.accentColor }}>{plan.name}</p>
                  <p className="text-[10px] text-[#6b6b8a] mb-2">{plan.tagline}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-black text-[#f1f1f8]">R${plan.price}</span>
                    <span className="text-[#6b6b8a] text-xs pb-0.5">/mês</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-1.5 mb-4 flex-1">
                  {plan.items.map(item => (
                    <li key={item} className="flex items-start gap-1.5 text-[11px] text-[#9b9bb5]">
                      <Check className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: plan.accentColor }} />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={!!loading}
                  className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer ${plan.ctaBg} ${plan.ctaText}`}
                  style={plan.ctaGradient ? { background: plan.ctaGradient } : undefined}
                >
                  {loading === plan.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <><span>{plan.cta}</span><ArrowRight className="w-3 h-3" /></>
                  }
                </button>
              </div>
            ))}
          </div>

          {/* Value proposition banner */}
          <div className="rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 flex items-center gap-3 mb-4">
            <Sparkles className="w-4 h-4 text-iara-400 flex-shrink-0" />
            <p className="text-xs text-[#6b6b8a]">
              <span className="text-[#9b9bb5] font-semibold">Economize 6h+ por semana.</span>{' '}
              Cancele quando quiser. Sem taxa de cancelamento.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center">
            <button onClick={onClose} className="text-xs text-[#3a3a5a] hover:text-[#6b6b8a] transition-colors cursor-pointer">
              Continuar no plano gratuito por enquanto
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
