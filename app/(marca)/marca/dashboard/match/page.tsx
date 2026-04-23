'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Loader2, AlertCircle, Star, ExternalLink, Users, TrendingUp } from 'lucide-react'

type Match = {
  id: string
  score: number
  racional: string
  pontos_fortes: string[]
  criador: {
    id: string
    nome_artistico: string | null
    nicho: string | null
    sub_nicho: string | null
    plataformas: string[] | null
    pontos: number | null
    nivel: number | null
    sobre: string | null
  }
}

export default function MatchPage() {
  const [campanha, setCampanha] = useState('')
  const [nichoFoco, setNichoFoco] = useState('')
  const [plataformaFoco, setPlataformaFoco] = useState('')
  const [numResultados, setNumResultados] = useState(10)
  const [gerando, setGerando] = useState(false)
  const [matches, setMatches] = useState<Match[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [totalAvaliado, setTotalAvaliado] = useState(0)

  async function buscar() {
    if (campanha.trim().length < 20) {
      setErro('Descreva a campanha com pelo menos 20 caracteres')
      return
    }
    setGerando(true); setErro(null); setMatches([])
    try {
      const res = await fetch('/api/marca/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campanha,
          nicho_foco: nichoFoco || undefined,
          plataforma_foco: plataformaFoco || undefined,
          num_resultados: numResultados,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao buscar matches')
        return
      }
      setMatches(data.matches ?? [])
      setTotalAvaliado(data.total_catalogo_avaliado ?? 0)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro de conexão')
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-purple/30 bg-accent-purple/10 text-[10px] font-semibold tracking-[0.2em] uppercase text-accent-purple mb-3">
          <Sparkles className="w-3 h-3" />
          Match Inteligente IA
        </div>
        <h1 className="font-display font-black text-[clamp(28px,4vw,40px)] leading-tight tracking-display mb-2">
          Os criadores{' '}
          <span className="font-editorial font-normal" style={{ color: '#E2C068' }}>certos</span>{' '}
          pra sua campanha.
        </h1>
        <p className="text-[#9b9bb5] max-w-xl text-[15px]">
          Descreve sua campanha. A Iara lê o catálogo inteiro de criadores, cruza nicho, audiência e tom, e te devolve os top {numResultados} alinhados — com racional por que cada um.
        </p>
      </div>

      {/* Formulário */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a]/80 p-6 sm:p-8 mb-6 space-y-5">
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-1.5">Descreva sua campanha *</label>
          <textarea
            value={campanha}
            onChange={e => setCampanha(e.target.value)}
            rows={4}
            placeholder="Ex: Lançamento de creme facial anti-idade premium R$ 280, queremos micro-influenciadores de skincare/bem-estar que falem com mulheres 30-45 classe A/B. Precisamos de reels testando o produto por 15 dias e carrossel educativo final."
            className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-accent-purple/60 focus:outline-none resize-none"
          />
          <p className="text-[10px] text-[#5a5a7a] mt-1">Quanto mais detalhe (nicho, objetivo, tom desejado), melhor o match.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-1.5">Filtro nicho (opc.)</label>
            <input
              value={nichoFoco}
              onChange={e => setNichoFoco(e.target.value)}
              placeholder="Ex: beleza, fitness"
              className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-3 py-2.5 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-accent-purple/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-1.5">Plataforma foco</label>
            <select value={plataformaFoco} onChange={e => setPlataformaFoco(e.target.value)}
              className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-3 py-2.5 text-sm text-[#f1f1f8] focus:border-accent-purple/60 focus:outline-none">
              <option value="">Qualquer</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="YouTube">YouTube</option>
              <option value="LinkedIn">LinkedIn</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-1.5">Qtd resultados</label>
            <select value={numResultados} onChange={e => setNumResultados(Number(e.target.value))}
              className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-3 py-2.5 text-sm text-[#f1f1f8] focus:border-accent-purple/60 focus:outline-none">
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={15}>Top 15</option>
              <option value={20}>Top 20</option>
            </select>
          </div>
        </div>

        <button
          onClick={buscar}
          disabled={gerando}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1,#ec4899)' }}
        >
          {gerando ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando catálogo...</> : <><Sparkles className="w-4 h-4" /> Encontrar matches</>}
        </button>

        {erro && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {erro}
          </div>
        )}
      </div>

      {/* Resultados */}
      {matches.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] tracking-[0.3em] uppercase font-semibold text-accent-purple mb-3">
            {matches.length} match{matches.length !== 1 ? 'es' : ''} encontrado{matches.length !== 1 ? 's' : ''} · {totalAvaliado} criadores avaliados
          </p>
          {matches.map((m, i) => (
            <div key={m.id} className="rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a]/80 p-5 hover:border-accent-purple/30 transition-colors">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black"
                    style={{
                      background: i < 3 ? 'linear-gradient(135deg,#E2C068,#a855f7)' : 'rgba(168,85,247,0.15)',
                      color: i < 3 ? '#0a0a14' : '#a855f7',
                    }}>
                    #{i + 1}
                  </div>
                  <div className="flex items-center gap-0.5 mt-2">
                    <Star className="w-3 h-3 text-[#E2C068] fill-[#E2C068]" />
                    <span className="text-xs font-bold text-[#E2C068] tabular-nums">{m.score}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
                    <h3 className="font-display font-bold text-[#f1f1f8] text-[17px] truncate">
                      {m.criador.nome_artistico ?? 'Criador sem nome'}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-[#6b6b8a]">
                      <TrendingUp className="w-3 h-3" />
                      Nv. {m.criador.nivel ?? 0} · {m.criador.pontos ?? 0} pts
                    </div>
                  </div>
                  <p className="text-xs text-[#9b9bb5] mb-2">
                    {[m.criador.nicho, m.criador.sub_nicho].filter(Boolean).join(' · ')}
                    {m.criador.plataformas?.length ? ' · ' + m.criador.plataformas.join(', ') : ''}
                  </p>
                  <p className="text-sm text-[#c1c1d8] leading-relaxed mb-3">
                    <strong className="text-accent-purple">Por que é um match:</strong> {m.racional}
                  </p>
                  {m.pontos_fortes?.length > 0 && (
                    <ul className="space-y-1 text-xs text-[#9b9bb5]">
                      {m.pontos_fortes.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-accent-purple mt-0.5">✓</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                <Link
                  href={`/marca/dashboard/criadores?id=${m.criador.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-accent-purple hover:bg-accent-purple/10 transition-colors"
                >
                  Ver perfil completo
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <Link
                  href={`/marca/dashboard/vagas?convidar=${m.criador.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)' }}
                >
                  <Users className="w-3 h-3" />
                  Convidar pra campanha
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
