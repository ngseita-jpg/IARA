'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles, ArrowRight, X, FileText, Layers, Image as ImageIcon,
  Smartphone, Lightbulb, History, Trophy, Check,
} from 'lucide-react'
import { useModalA11y } from '@/hooks/useModalA11y'

const STORAGE_KEY = 'iara_onboarding_visto_v1'

type Passo = {
  emoji: string
  titulo: string
  desc: string
  cta?: { label: string; href: string; icon: React.ElementType }
  dica?: string
}

const PASSOS: Passo[] = [
  {
    emoji: '✨',
    titulo: 'Bem-vindo à Iara!',
    desc: 'Sua assessora com IA pra criar conteúdo profissional em segundos. Vamos te mostrar 3 passos rápidos pra você sentir o valor.',
  },
  {
    emoji: '⚡',
    titulo: 'Comece pela Faísca Criativa',
    desc: 'Travado em ideias? A Iara conversa com você e gera 5 temas alinhados com seu nicho. Em 60 segundos você sai com pauta da semana inteira.',
    cta: { label: 'Faísca Criativa', href: '/dashboard/temas', icon: Lightbulb },
  },
  {
    emoji: '🎨',
    titulo: 'Gere seu primeiro conteúdo',
    desc: 'Roteiro pra Reel, carrossel pro feed, thumbnail YouTube. A IA aprende seu tom e cria no seu jeito. Quanto mais usar, melhor fica.',
    cta: { label: 'Criar Carrossel', href: '/dashboard/carrossel', icon: Layers },
  },
  {
    emoji: '👤',
    titulo: 'Configure sua Persona',
    desc: 'O segredo: 3 minutos preenchendo seu perfil. A IA passa a escrever como SE FOSSE VOCÊ, não genérico.',
    cta: { label: 'Minha Persona', href: '/dashboard/persona', icon: Trophy },
    dica: 'Sem isso, conteúdo sai genérico. COM isso, parece que você escreveu.',
  },
]

const MODULOS_QUICKLINKS: { label: string; href: string; icon: React.ElementType; color: string }[] = [
  { label: 'Roteiros',  href: '/dashboard/roteiros',  icon: FileText,   color: 'text-iara-400' },
  { label: 'Carrossel', href: '/dashboard/carrossel', icon: Layers,     color: 'text-accent-pink' },
  { label: 'Thumbnail', href: '/dashboard/thumbnail', icon: ImageIcon,  color: 'text-teal-400' },
  { label: 'Stories',   href: '/dashboard/stories',   icon: Smartphone, color: 'text-accent-purple' },
  { label: 'Faísca',    href: '/dashboard/temas',     icon: Lightbulb,  color: 'text-iara-300' },
  { label: 'Histórico', href: '/dashboard/historico', icon: History,    color: 'text-amber-400' },
]

/**
 * Tour de boas-vindas — primeira visita ao dashboard.
 * Mostra 4 passos guiados em modal full-screen.
 *
 * Persiste no localStorage que o user já viu (não mostra de novo).
 * Skip a qualquer momento.
 */
export function OnboardingTour() {
  const [aberto, setAberto] = useState(false)
  const [passo, setPasso] = useState(0)

  // Detecta primeira visita (apenas no client após mount)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const visto = localStorage.getItem(STORAGE_KEY)
      if (!visto) {
        // Pequeno delay pra dar fade-in suave após página carregar
        const t = setTimeout(() => setAberto(true), 800)
        return () => clearTimeout(t)
      }
    } catch { /* localStorage indisponível, não bloqueia */ }
  }, [])

  function fechar() {
    try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()) } catch { /* ignore */ }
    setAberto(false)
  }

  if (!aberto) return null

  return <TourModal passo={passo} setPasso={setPasso} onClose={fechar} />
}

function TourModal({ passo, setPasso, onClose }: {
  passo: number
  setPasso: (p: number) => void
  onClose: () => void
}) {
  useModalA11y(true, onClose)
  const p = PASSOS[passo]
  const ehUltimo = passo === PASSOS.length - 1
  const ehPrimeiro = passo === 0

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full sm:max-w-lg max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-iara-700/40 bg-gradient-to-br from-[#13131f] via-[#0e0e1e] to-[#0a0a14] shadow-2xl shadow-purple-900/20">
        {/* Skip */}
        <button
          onClick={onClose}
          aria-label="Pular tour"
          className="absolute top-3 right-3 z-10 w-11 h-11 flex items-center justify-center rounded-xl text-[#6b6b8a] hover:text-white hover:bg-[#1a1a2e] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progresso */}
        <div className="px-6 pt-6">
          <div className="flex items-center gap-1.5 mb-5">
            {PASSOS.map((_, i) => (
              <button
                key={i}
                onClick={() => setPasso(i)}
                aria-label={`Passo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === passo ? 'w-8 bg-gradient-to-r from-iara-500 to-accent-purple'
                  : i < passo ? 'w-4 bg-iara-700/60'
                  : 'w-4 bg-[#1a1a2e]'
                }`}
              />
            ))}
            <span className="ml-auto text-[10px] text-[#6b6b8a] font-mono">
              {passo + 1}/{PASSOS.length}
            </span>
          </div>
        </div>

        {/* Conteúdo do passo */}
        <div className="px-6 pb-2">
          <div className="text-center py-6">
            <div className="text-6xl mb-4 animate-bounce-soft">{p.emoji}</div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-tight">
              {p.titulo}
            </h2>
            <p className="text-sm sm:text-base text-[#9b9bb5] leading-relaxed max-w-md mx-auto">
              {p.desc}
            </p>

            {p.dica && (
              <div className="mt-4 mx-auto max-w-md p-3 rounded-xl bg-amber-950/30 border border-amber-700/30 text-left">
                <p className="text-xs text-amber-300 leading-relaxed">
                  💡 {p.dica}
                </p>
              </div>
            )}
          </div>

          {/* No último passo, mostra grid de módulos pra exploração livre */}
          {ehUltimo && (
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-wider text-[#6b6b8a] font-semibold mb-2 text-center">Ou explore qualquer módulo</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {MODULOS_QUICKLINKS.map(m => {
                  const Icon = m.icon
                  return (
                    <Link
                      key={m.href}
                      href={m.href}
                      onClick={onClose}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[#1a1a2e] bg-[#0a0a14] hover:border-iara-700/40 hover:bg-iara-900/15 transition-all"
                    >
                      <Icon className={`w-5 h-5 ${m.color}`} />
                      <span className="text-[10px] font-semibold text-[#c9c9d8]">{m.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer com navegação */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-[#1a1a2e] bg-[#0a0a14]/80 backdrop-blur-sm rounded-b-3xl flex items-center gap-2">
          {!ehPrimeiro && (
            <button
              onClick={() => setPasso(passo - 1)}
              className="px-3 min-h-11 rounded-xl text-sm text-[#9b9bb5] hover:text-white"
            >
              ← Voltar
            </button>
          )}

          {p.cta && (
            <Link
              href={p.cta.href}
              onClick={onClose}
              className="flex items-center justify-center gap-2 flex-1 min-h-11 rounded-xl bg-gradient-to-r from-iara-600 to-accent-purple text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-purple-900/30"
            >
              <p.cta.icon className="w-4 h-4" />
              {p.cta.label}
            </Link>
          )}

          {!p.cta && (
            <button
              onClick={ehUltimo ? onClose : () => setPasso(passo + 1)}
              className="flex items-center justify-center gap-2 flex-1 min-h-11 rounded-xl bg-gradient-to-r from-iara-600 to-accent-purple text-white text-sm font-bold hover:opacity-90"
            >
              {ehUltimo ? <><Check className="w-4 h-4" /> Vamos lá!</> : <>Continuar <ArrowRight className="w-4 h-4" /></>}
            </button>
          )}

          {!ehUltimo && p.cta && (
            <button
              onClick={() => setPasso(passo + 1)}
              className="px-3 min-h-11 rounded-xl text-sm text-[#6b6b8a] hover:text-white"
            >
              Pular →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
