'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  User,
  Sparkles,
  Save,
  Check,
  Loader2,
  AlertCircle,
  Mic,
  Trophy,
} from 'lucide-react'
import { getBadgeInfo } from '@/lib/badges'

const NICHOS = [
  'Fitness e Saúde',
  'Finanças e Investimentos',
  'Lifestyle',
  'Beleza e Moda',
  'Gastronomia',
  'Tecnologia',
  'Educação',
  'Entretenimento',
  'Esportes',
  'Games',
  'Viagem',
  'Negócios e Empreendedorismo',
  'Humor e Comédia',
  'Música',
  'Arte e Design',
  'Outro',
]

const PLATAFORMAS = [
  { value: 'Instagram', icon: '📸' },
  { value: 'YouTube', icon: '▶️' },
  { value: 'TikTok', icon: '🎵' },
  { value: 'LinkedIn', icon: '💼' },
  { value: 'Twitter/X', icon: '𝕏' },
  { value: 'Kwai', icon: '🎬' },
  { value: 'Pinterest', icon: '📌' },
  { value: 'Podcast', icon: '🎙️' },
]

const OBJETIVOS = [
  'Crescer minha audiência',
  'Monetizar meu conteúdo',
  'Construir autoridade no meu nicho',
  'Fechar parcerias com marcas',
  'Educar minha audiência',
  'Me divertir e criar',
]

type Profile = {
  nome_artistico: string
  nicho: string
  tom_de_voz: string
  plataformas: string[]
  objetivo: string
  sobre: string
  pontos?: number
  nivel?: number
  treinos_voz?: number
  voz_perfil?: string
  voz_score_medio?: number
}

const EMPTY: Profile = {
  nome_artistico: '',
  nicho: '',
  tom_de_voz: '',
  plataformas: [],
  objetivo: '',
  sobre: '',
  pontos: 0,
  nivel: 0,
  treinos_voz: 0,
  voz_perfil: '',
  voz_score_medio: undefined,
}

function calcCompletion(p: Profile): number {
  const fields = [
    p.nome_artistico,
    p.nicho,
    p.tom_de_voz,
    p.plataformas.length > 0 ? 'ok' : '',
    p.objetivo,
    p.sobre,
  ]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / fields.length) * 100)
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/perfil')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setProfile({
            nome_artistico:  data.nome_artistico ?? '',
            nicho:           data.nicho ?? '',
            tom_de_voz:      data.tom_de_voz ?? '',
            plataformas:     data.plataformas ?? [],
            objetivo:        data.objetivo ?? '',
            sobre:           data.sobre ?? '',
            pontos:          data.pontos ?? 0,
            nivel:           data.nivel ?? 0,
            treinos_voz:     data.treinos_voz ?? 0,
            voz_perfil:      data.voz_perfil ?? '',
            voz_score_medio: data.voz_score_medio,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function togglePlataforma(val: string) {
    setProfile((prev) => ({
      ...prev,
      plataformas: prev.plataformas.includes(val)
        ? prev.plataformas.filter((p) => p !== val)
        : [...prev.plataformas, val],
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar perfil')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setSaving(false)
    }
  }

  const completion = calcCompletion(profile)
  const badge = getBadgeInfo(profile.pontos ?? 0, profile.nicho || undefined)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 text-iara-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-iara-400 text-sm font-medium mb-2">
          <User className="w-4 h-4" />
          <span>Configurações</span>
        </div>
        <h1 className="text-3xl font-bold text-[#f1f1f8]">
          Seu <span className="iara-gradient-text">Perfil</span>
        </h1>
        <p className="mt-2 text-[#9b9bb5]">
          Quanto mais completo, mais personalizados ficam todos os módulos de IA.
        </p>
      </div>

      {/* Badge de nível */}
      <div className="iara-card p-4 mb-4 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${badge.cor.bg} border ${badge.cor.border} flex items-center justify-center text-2xl flex-shrink-0`}>
          {badge.cor.emoji}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className={`font-bold ${badge.cor.text}`}>{badge.badge}</p>
            <span className="text-xs text-[#5a5a7a]">· {badge.pontos} pontos</span>
          </div>
          {badge.nextThreshold && (
            <>
              <div className="h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${badge.cor.bg.replace('/30', '/60')}`}
                  style={{ width: `${badge.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-[#5a5a7a]">
                {badge.pontosParaProximo} pts para {badge.proximoBadge}
              </p>
            </>
          )}
        </div>
        <div className="text-right text-xs text-[#5a5a7a] flex-shrink-0">
          <p>{profile.treinos_voz ?? 0} treinos de voz</p>
          {profile.voz_score_medio && <p className="text-iara-400 font-medium">Score: {profile.voz_score_medio}/100</p>}
        </div>
      </div>

      {/* Perfil de voz */}
      {profile.voz_perfil ? (
        <div className="iara-card p-4 mb-4 flex items-start gap-3 border-accent-purple/20">
          <div className="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
            <Mic className="w-4 h-4 text-accent-purple" />
          </div>
          <div>
            <p className="text-xs font-semibold text-accent-purple mb-1 uppercase tracking-wider">Perfil de voz (gerado pela IA)</p>
            <p className="text-sm text-[#d0d0e8]">{profile.voz_perfil}</p>
          </div>
        </div>
      ) : (
        <Link href="/dashboard/oratorio" className="iara-card p-4 mb-4 flex items-center gap-3 border-dashed border-accent-purple/20 hover:border-accent-purple/40 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
            <Mic className="w-4 h-4 text-[#5a5a7a]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#9b9bb5]">Perfil de voz não configurado</p>
            <p className="text-xs text-[#5a5a7a]">Faça uma análise de oratória para a IA aprender seu estilo vocal →</p>
          </div>
        </Link>
      )}

      {/* Completion bar */}
      <div className="iara-card p-4 mb-8 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-[#9b9bb5]">Perfil completo</span>
            <span className={`text-xs font-bold ${completion === 100 ? 'text-green-400' : 'text-iara-400'}`}>
              {completion}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-iara-600 to-accent-purple transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
        {completion === 100 && (
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-green-400" />
          </div>
        )}
        {completion < 100 && (
          <div className="w-8 h-8 rounded-full bg-iara-900/50 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-iara-400" />
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Nome artístico */}
        <div>
          <label className="iara-label">Nome artístico / como te chamam</label>
          <input
            type="text"
            value={profile.nome_artistico}
            onChange={(e) => setProfile((p) => ({ ...p, nome_artistico: e.target.value }))}
            placeholder="Ex: João Vittor, @marketingdaana, Nath Finanças..."
            className="iara-input"
          />
        </div>

        {/* Nicho */}
        <div>
          <label className="iara-label">Nicho de conteúdo</label>
          <div className="relative">
            <select
              value={profile.nicho}
              onChange={(e) => setProfile((p) => ({ ...p, nicho: e.target.value }))}
              className="iara-input appearance-none pr-10 cursor-pointer"
            >
              <option value="">Selecione seu nicho...</option>
              {NICHOS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#5a5a7a] text-xs">▼</div>
          </div>
        </div>

        {/* Plataformas */}
        <div>
          <label className="iara-label">Plataformas onde você cria conteúdo</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PLATAFORMAS.map((p) => {
              const active = profile.plataformas.includes(p.value)
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePlataforma(p.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                    active
                      ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
                      : 'bg-[#0f0f1e] border-iara-900/40 text-[#5a5a7a] hover:border-iara-700/40 hover:text-[#9b9bb5]'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span className="truncate">{p.value}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Objetivo */}
        <div>
          <label className="iara-label">Objetivo principal</label>
          <div className="relative">
            <select
              value={profile.objetivo}
              onChange={(e) => setProfile((p) => ({ ...p, objetivo: e.target.value }))}
              className="iara-input appearance-none pr-10 cursor-pointer"
            >
              <option value="">Selecione seu objetivo...</option>
              {OBJETIVOS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#5a5a7a] text-xs">▼</div>
          </div>
        </div>

        {/* Tom de voz */}
        <div>
          <label className="iara-label">
            Tom de voz e estilo{' '}
            <span className="text-[#5a5a7a] font-normal">— como você se comunica?</span>
          </label>
          <textarea
            value={profile.tom_de_voz}
            onChange={(e) => setProfile((p) => ({ ...p, tom_de_voz: e.target.value }))}
            placeholder="Ex: descontraído e direto ao ponto, falo como se fosse uma conversa entre amigos. Uso bastante humor e gírias. Nunca formal."
            rows={3}
            className="iara-input resize-none"
          />
        </div>

        {/* Sobre você */}
        <div>
          <label className="iara-label">
            Sobre você{' '}
            <span className="text-[#5a5a7a] font-normal">— quem é você e para quem cria?</span>
          </label>
          <textarea
            value={profile.sobre}
            onChange={(e) => setProfile((p) => ({ ...p, sobre: e.target.value }))}
            placeholder="Ex: Sou personal trainer especializado em emagrecimento para mães acima de 35 anos. Crio conteúdo prático e sem julgamentos sobre alimentação e treinos em casa."
            rows={4}
            className="iara-input resize-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="iara-btn-primary w-full py-3 text-base"
        >
          {saving ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
          ) : saved ? (
            <><Check className="w-5 h-5 text-green-300" /> Perfil salvo!</>
          ) : (
            <><Save className="w-5 h-5" /> Salvar perfil</>
          )}
        </button>

        {saved && (
          <p className="text-center text-xs text-green-400 animate-fade-in">
            ✓ Seu perfil já está sendo usado em todos os módulos de IA
          </p>
        )}
      </form>
    </div>
  )
}
