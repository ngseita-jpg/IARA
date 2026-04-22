'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Check, ArrowRight, Zap, Crown, Gem, User, Lightbulb, FileText, Layers, Image as ImageIcon } from 'lucide-react'
import { IaraLogo } from '@/components/iara-logo'

type Plano = 'plus' | 'premium' | 'profissional'

const PLANO_INFO: Record<Plano, {
  label: string
  preco: string
  cor: string
  icon: typeof Crown
  destaques: string[]
}> = {
  plus: {
    label: 'Plus',
    preco: 'R$ 49,90/mês',
    cor: '#6366f1',
    icon: Zap,
    destaques: [
      '10 roteiros por mês',
      '7 carrosseis, thumbnails e stories',
      '3 análises de oratória',
      '25 fotos no banco',
      'Mídia Kit PDF',
    ],
  },
  premium: {
    label: 'Premium',
    preco: 'R$ 89,00/mês',
    cor: '#a855f7',
    icon: Crown,
    destaques: [
      '20 roteiros por mês',
      '18 carrosseis, thumbnails e stories',
      '8 análises de oratória',
      '80 fotos no banco',
      'Métricas com IA',
      'Suporte prioritário',
    ],
  },
  profissional: {
    label: 'Profissional',
    preco: 'R$ 179,90/mês',
    cor: '#10b981',
    icon: Gem,
    destaques: [
      'Tudo ilimitado',
      'Banco de fotos ilimitado',
      'Histórico ilimitado',
      'Acesso antecipado a novos módulos',
      'Prioridade no match com marcas',
      'Suporte VIP',
    ],
  },
}

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2.5 + Math.random() * 2,
      color: ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)],
      size: 6 + Math.random() * 6,
    }))
  )
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', rotate: 720 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'linear' }}
          style={{ background: p.color, width: p.size, height: p.size }}
          className="absolute rounded-sm"
        />
      ))}
    </div>
  )
}

export function BemVindoClient({
  plano, nome, personaCompleta,
}: {
  plano: Plano
  nome: string
  personaCompleta: boolean
}) {
  const info = PLANO_INFO[plano]
  const Icon = info.icon

  useEffect(() => {
    // Guarda flag local para outras telas saberem que acabou de pagar
    try { localStorage.setItem('iara_acabou_de_pagar', '1') } catch { /* ignore */ }
  }, [])

  return (
    <div className="min-h-screen bg-[#07070f] flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      <Confetti />

      {/* Background glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: `${info.cor}18` }}
      />

      <div className="mb-8 relative z-10">
        <IaraLogo size="sm" layout="horizontal" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="rounded-3xl border border-[#1a1a2e] bg-[#0d0d1a]/90 backdrop-blur-xl shadow-2xl shadow-black/50 p-8 sm:p-10">

          {/* Ícone e confirmação */}
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.2 }}
              className="relative w-24 h-24 mb-6"
            >
              <div
                className="absolute inset-0 rounded-3xl blur-2xl"
                style={{ background: `${info.cor}55` }}
              />
              <div
                className="relative w-24 h-24 rounded-3xl flex items-center justify-center border"
                style={{
                  background: `linear-gradient(135deg, ${info.cor}30, ${info.cor}10)`,
                  borderColor: `${info.cor}60`,
                }}
              >
                <Icon className="w-12 h-12" style={{ color: info.cor }} />
              </div>
            </motion.div>

            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: info.cor }}
            >
              Pagamento confirmado
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-[#f1f1f8] leading-tight mb-3">
              Bem-vindo ao<br />
              <span className="iara-gradient-text">Iara {info.label}</span>, {nome}!
            </h1>
            <p className="text-sm text-[#9b9bb5] max-w-sm">
              Seu acesso já está ativo. {info.preco}, cancele quando quiser.
            </p>
          </div>

          {/* Benefícios desbloqueados */}
          <div
            className="rounded-2xl p-5 mb-6 border"
            style={{
              background: `linear-gradient(135deg, ${info.cor}0f, ${info.cor}05)`,
              borderColor: `${info.cor}30`,
            }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: info.cor }}>
              O que você desbloqueou
            </p>
            <div className="space-y-2.5">
              {info.destaques.map(item => (
                <div key={item} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: info.cor }} />
                  <p className="text-sm text-[#c1c1d8] leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Próximo passo — condicional */}
          {!personaCompleta ? (
            <div className="rounded-2xl p-5 border border-amber-800/30 bg-amber-950/20 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-700/30 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#f1f1f8] mb-1">Configure sua Persona IA agora</p>
                  <p className="text-sm text-[#9b9bb5] leading-relaxed">
                    Leva 2 minutos. Sem isso, a Iara não sabe seu nicho, tom e plataformas — e os conteúdos gerados ficam genéricos.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/persona"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}
              >
                Configurar minha Persona <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[#6b6b8a] mb-3 text-center">Comece experimentando</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Faísca Criativa', icon: Lightbulb, href: '/dashboard/temas',     color: '#f59e0b' },
                  { label: 'Roteiros',        icon: FileText,  href: '/dashboard/roteiros',  color: '#6366f1' },
                  { label: 'Carrossel',       icon: Layers,    href: '/dashboard/carrossel', color: '#a855f7' },
                  { label: 'Thumbnail',       icon: ImageIcon, href: '/dashboard/thumbnail', color: '#ec4899' },
                ].map(f => {
                  const FIcon = f.icon
                  return (
                    <Link
                      key={f.label}
                      href={f.href}
                      className="flex items-center gap-2 p-3 rounded-xl border border-[#1a1a2e] bg-[#0a0a14] hover:border-iara-700/40 transition-colors"
                    >
                      <FIcon className="w-4 h-4 flex-shrink-0" style={{ color: f.color }} />
                      <span className="text-sm font-medium text-[#c1c1d8]">{f.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* CTA primário */}
          <Link
            href="/dashboard"
            className="btn-shimmer flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}
          >
            <Sparkles className="w-4 h-4" />
            Ir para o Dashboard
          </Link>
        </div>

        <p className="text-center text-xs text-[#3a3a5a] mt-5">
          Recibo e gerenciamento de assinatura em <Link href="/conta" className="text-iara-400 hover:text-iara-300">Minha Conta</Link>
        </p>
      </motion.div>
    </div>
  )
}
