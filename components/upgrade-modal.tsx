'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  X, Sparkles, Check, ArrowRight, Zap, Lock,
  FileText, Layers, Image, Smartphone, Mic, BookOpen, Lightbulb,
} from 'lucide-react'

/* ─────────────────────────── types ────────────────────────────────── */

export type TipoModulo =
  | 'roteiro' | 'carrossel' | 'thumbnail' | 'stories'
  | 'oratorio' | 'midia_kit' | 'temas' | 'fotos' | null

const MODULO_INFO: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  roteiro:   { label: 'Roteiros',       icon: FileText,   color: '#818cf8' },
  carrossel: { label: 'Carrossel',      icon: Layers,     color: '#ec4899' },
  thumbnail: { label: 'Thumbnails',     icon: Image,      color: '#2dd4bf' },
  stories:   { label: 'Stories',        icon: Smartphone, color: '#a855f7' },
  oratorio:  { label: 'Oratória',       icon: Mic,        color: '#4ade80' },
  midia_kit: { label: 'Mídia Kit',      icon: BookOpen,   color: '#fbbf24' },
  temas:     { label: 'Faísca Criativa',icon: Lightbulb,  color: '#818cf8' },
  fotos:     { label: 'Banco de Fotos', icon: Image,      color: '#818cf8' },
}

const PLANS = [
  {
    name: 'Plus',
    price: 49,
    color: '#818cf8',
    gradient: 'from-iara-600/20 to-accent-purple/10',
    border: 'border-iara-700/40',
    ring: '',
    items: ['10 roteiros', '7 carrosseis', '7 thumbnails', '7 stories', '3 oratórias', '7 sessões Faísca', '25 fotos'],
    cta: 'Assinar Plus — R$49/mês',
    ctaStyle: 'border border-iara-700/50 text-iara-300 hover:bg-iara-900/40',
  },
  {
    name: 'Premium',
    price: 79,
    color: '#a855f7',
    gradient: 'from-iara-600/30 to-accent-purple/20',
    border: 'border-iara-600/60',
    ring: 'ring-1 ring-iara-600/30',
    badge: 'Mais popular',
    items: ['20 roteiros', '18 carrosseis', '18 thumbnails', '18 stories', '8 oratórias', '15 sessões Faísca', '80 fotos', 'Métricas com IA', 'Suporte prioritário'],
    cta: 'Assinar Premium — R$79/mês',
    ctaStyle: '',
    ctaGradient: 'linear-gradient(135deg,#6366f1,#a855f7)',
  },
]

/* ─────────────────────────── component ────────────────────────────── */

interface Props {
  open: boolean
  modulo?: TipoModulo
  onClose: () => void
}

export function UpgradeModal({ open, modulo, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
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

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        className="relative w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#1a1a2e] shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #0e0e1e 0%, #0a0a16 100%)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#4a4a6a] hover:text-[#f1f1f8] hover:bg-[#1a1a2e] transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(20px)' }} />

        <div className="relative p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            {/* Module icon + lock overlay */}
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
                style={{ background: info ? `${info.color}22` : 'rgba(99,102,241,0.15)', border: `1px solid ${info ? info.color + '40' : 'rgba(99,102,241,0.3)'}` }}>
                <Icon className="w-7 h-7" style={{ color: info?.color ?? '#818cf8' }} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0a0a14] border border-amber-600/40 flex items-center justify-center"
                style={{ background: 'rgba(180,100,20,0.15)' }}>
                <Lock className="w-3 h-3 text-amber-400" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-800/30 bg-amber-950/30 text-amber-400 text-xs font-bold mb-4">
              <Zap className="w-3.5 h-3.5" />
              {info ? `Limite de ${info.label} atingido` : 'Limite do plano gratuito'}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#f1f1f8] mb-3 leading-tight">
              Você estava no ritmo certo.<br />
              <span className="bg-gradient-to-r from-iara-400 to-accent-purple bg-clip-text text-transparent">
                Não para agora.
              </span>
            </h2>
            <p className="text-[#9b9bb5] max-w-md leading-relaxed">
              {info
                ? `Seus ${info.label.toLowerCase()} do mês acabaram. Faça upgrade e continue criando sem interrupção.`
                : 'Você atingiu o limite do plano gratuito. Escolha um plano e continue criando sem interrupção.'}
            </p>
          </div>

          {/* Plans */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-5 border ${plan.border} bg-gradient-to-br ${plan.gradient} ${plan.ring}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                    {plan.badge}
                  </div>
                )}

                <div className="mb-4">
                  <p className="font-bold text-[#f1f1f8] text-lg">{plan.name}</p>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-2xl font-black text-[#f1f1f8]">R${plan.price}</span>
                    <span className="text-[#6b6b8a] text-sm pb-0.5">/mês</span>
                  </div>
                </div>

                <ul className="space-y-1.5 mb-5">
                  {plan.items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs text-[#9b9bb5]">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: plan.color }} />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  onClick={onClose}
                  className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] ${plan.ctaStyle}`}
                  style={plan.ctaGradient ? { background: plan.ctaGradient, color: 'white' } : undefined}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>

          {/* Profissional teaser */}
          <div className="rounded-2xl p-4 border border-accent-purple/20 bg-accent-purple/5 flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-bold text-[#f1f1f8] mb-0.5">Profissional — Tudo ilimitado</p>
              <p className="text-xs text-[#6b6b8a]">Todos os módulos sem limite, suporte VIP e prioridade com marcas</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-lg font-black text-accent-purple">R$197</p>
              <p className="text-[10px] text-[#4a4a6a]">/mês</p>
            </div>
          </div>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-6 text-xs text-[#3a3a5a]">
            <button onClick={onClose} className="hover:text-[#6b6b8a] transition-colors">
              Continuar no gratuito
            </button>
            <span>·</span>
            <Link href="/#planos" onClick={onClose} className="hover:text-iara-400 transition-colors">
              Comparar todos os planos →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
