'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Search, Filter, Star, TrendingUp, Loader2, RefreshCw } from 'lucide-react'

const NICHOS = [
  'Lifestyle', 'Fitness e saúde', 'Gastronomia', 'Moda e beleza',
  'Finanças e negócios', 'Tecnologia', 'Educação', 'Entretenimento',
  'Viagem', 'Esportes', 'Games', 'Maternidade e família', 'Outro',
]

const PLATAFORMAS = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn']

type Criador = {
  id: string
  nome_artistico: string | null
  nicho: string | null
  plataformas: string[] | null
  pontos: number | null
  nivel: number | null
  sobre: string | null
  voz_score_medio: number | null
}

const NIVEL_LABELS = ['', 'Iniciante', 'Crescente', 'Estabelecido', 'Influente', 'Elite']
const NIVEL_COLORS = ['', 'text-[#6b6b8a]', 'text-green-400', 'text-blue-400', 'text-[#E2C068]', 'text-amber-400']
const NIVEL_BG = ['', 'bg-[#1a1a2e]', 'bg-green-900/20', 'bg-blue-900/20', 'bg-[#C9A84C]/8', 'bg-amber-900/20']
const NIVEL_BORDER = ['', 'border-[#2a2a3e]', 'border-green-800/30', 'border-blue-800/30', 'border-[#C9A84C]/20', 'border-amber-700/30']

export default function CriadoresPage() {
  const [criadores, setCriadores] = useState<Criador[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [nichoFiltro, setNichoFiltro] = useState('')
  const [plataformaFiltro, setPlataformaFiltro] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const fetchCriadores = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (busca) params.set('q', busca)
    if (nichoFiltro) params.set('nicho', nichoFiltro)
    if (plataformaFiltro) params.set('plataforma', plataformaFiltro)

    const res = await fetch(`/api/marca/criadores?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      setCriadores(data.criadores ?? [])
    }
    setLoading(false)
  }, [busca, nichoFiltro, plataformaFiltro])

  useEffect(() => {
    const timer = setTimeout(() => { fetchCriadores() }, 300)
    return () => clearTimeout(timer)
  }, [fetchCriadores])

  function limparFiltros() {
    setBusca('')
    setNichoFiltro('')
    setPlataformaFiltro('')
  }

  const temFiltros = busca || nichoFiltro || plataformaFiltro

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-[#5a5a7a] mb-2">
          <span>Área da Marca</span>
          <span>/</span>
          <span className="text-[#9b9bb5]">Buscar Criadores</span>
        </div>
        <h1 className="text-3xl font-bold text-[#f1f1f8]">
          Buscar <span className="marca-gradient-text">Criadores</span>
        </h1>
        <p className="text-sm text-[#5a5a7a] mt-1">
          Encontre criadores ideais para sua próxima campanha
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3a3a5a]" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full rounded-xl border border-[#1a1a2e] bg-[#0f0f1e] px-4 py-3 pl-11 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/40 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/10 transition-all"
          />
        </div>
        <button
          onClick={() => setMostrarFiltros(v => !v)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
            mostrarFiltros || temFiltros
              ? 'bg-[#C9A84C]/15 border-[#C9A84C]/35 text-marca-300'
              : 'border-[#1a1a2e] bg-[#0f0f1e] text-[#9b9bb5] hover:border-[#C9A84C]/20'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {temFiltros && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#E2C068] ml-0.5" />
          )}
        </button>
      </div>

      {/* Filters panel */}
      {mostrarFiltros && (
        <div className="mb-5 p-4 rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Nicho</p>
            <div className="flex flex-wrap gap-2">
              {NICHOS.map(n => (
                <button
                  key={n}
                  onClick={() => setNichoFiltro(nichoFiltro === n ? '' : n)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                    nichoFiltro === n
                      ? 'bg-[#C9A84C]/15 border-[#C9A84C]/35 text-marca-300'
                      : 'border-[#1a1a2e] text-[#6b6b8a] hover:border-[#C9A84C]/20 hover:text-[#9b9bb5]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Plataforma</p>
            <div className="flex flex-wrap gap-2">
              {PLATAFORMAS.map(p => (
                <button
                  key={p}
                  onClick={() => setPlataformaFiltro(plataformaFiltro === p ? '' : p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                    plataformaFiltro === p
                      ? 'bg-[#C9A84C]/15 border-[#C9A84C]/35 text-marca-300'
                      : 'border-[#1a1a2e] text-[#6b6b8a] hover:border-[#C9A84C]/20 hover:text-[#9b9bb5]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          {temFiltros && (
            <button
              onClick={limparFiltros}
              className="flex items-center gap-1.5 text-xs text-[#5a5a7a] hover:text-red-400 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#E2C068] animate-spin" />
        </div>
      ) : criadores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#0f0f1e] border border-[#1a1a2e] flex items-center justify-center">
            <Users className="w-6 h-6 text-[#3a3a5a]" />
          </div>
          <p className="text-sm text-[#5a5a7a]">
            {temFiltros ? 'Nenhum criador encontrado para esses filtros' : 'Ainda não há criadores cadastrados'}
          </p>
          {temFiltros && (
            <button onClick={limparFiltros} className="text-xs text-[#E2C068] hover:text-marca-300 transition-colors">
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-[#5a5a7a] mb-4">{criadores.length} criador{criadores.length !== 1 ? 'es' : ''} encontrado{criadores.length !== 1 ? 's' : ''}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {criadores.map(c => {
              const nivel = c.nivel ?? 1
              const nivelLabel = NIVEL_LABELS[nivel] ?? 'Iniciante'
              const nivelColor = NIVEL_COLORS[nivel] ?? NIVEL_COLORS[1]
              const nivelBg = NIVEL_BG[nivel] ?? NIVEL_BG[1]
              const nivelBorder = NIVEL_BORDER[nivel] ?? NIVEL_BORDER[1]
              const iniciais = (c.nome_artistico ?? 'C')
                .split(' ')
                .map((w: string) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()
              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] p-5 hover:border-[#C9A84C]/20 transition-all duration-200"
                >
                  {/* Avatar + name */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#C9A84C]/20 to-accent-purple/20 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-marca-300">{iniciais}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#f1f1f8] text-sm truncate">
                        {c.nome_artistico ?? 'Criador'}
                      </p>
                      {c.nicho && (
                        <p className="text-xs text-[#6b6b8a] truncate">{c.nicho}</p>
                      )}
                    </div>
                    <div className={`flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold ${nivelBg} border ${nivelBorder} ${nivelColor}`}>
                      {nivelLabel}
                    </div>
                  </div>

                  {/* About */}
                  {c.sobre && (
                    <p className="text-xs text-[#5a5a7a] leading-relaxed mb-4 line-clamp-2">{c.sobre}</p>
                  )}

                  {/* Platforms */}
                  {c.plataformas && c.plataformas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {c.plataformas.map((p: string) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded-lg bg-[#0a0a14] border border-[#1a1a2e] text-[10px] text-[#6b6b8a] font-medium"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-3 border-t border-[#1a1a2e]">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs text-[#9b9bb5] font-medium">{c.pontos ?? 0} pts</span>
                    </div>
                    {c.voz_score_medio && c.voz_score_medio > 0 && (
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs text-[#9b9bb5] font-medium">Oratória {Math.round(c.voz_score_medio)}/100</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
