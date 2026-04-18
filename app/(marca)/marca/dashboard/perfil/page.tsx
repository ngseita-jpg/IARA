'use client'

import { useState, useEffect } from 'react'
import { Building2, Globe, Instagram, Save, Loader2, Check, AlertCircle } from 'lucide-react'

const SEGMENTOS = [
  { value: 'moda_beleza',     label: 'Moda e Beleza',       emoji: '👗' },
  { value: 'alimentacao',     label: 'Alimentação',         emoji: '🍕' },
  { value: 'tecnologia',      label: 'Tecnologia',          emoji: '⚡' },
  { value: 'saude_bem_estar', label: 'Saúde e Bem-estar',   emoji: '💪' },
  { value: 'educacao',        label: 'Educação',            emoji: '📚' },
  { value: 'entretenimento',  label: 'Entretenimento',      emoji: '🎬' },
  { value: 'financas',        label: 'Finanças',            emoji: '💰' },
  { value: 'viagem',          label: 'Viagem e Turismo',    emoji: '✈️' },
  { value: 'games',           label: 'Games',               emoji: '🎮' },
  { value: 'casa_decoracao',  label: 'Casa e Decoração',    emoji: '🏠' },
  { value: 'esportes',        label: 'Esportes',            emoji: '🏆' },
  { value: 'pet',             label: 'Pet',                 emoji: '🐾' },
  { value: 'automotivo',      label: 'Automotivo',          emoji: '🚗' },
  { value: 'sustentabilidade',label: 'Sustentabilidade',    emoji: '🌱' },
  { value: 'outro',           label: 'Outro',               emoji: '🌟' },
]

const PORTES = [
  { value: 'startup',  label: 'Startup',         desc: 'Até 10 funcionários' },
  { value: 'pequena',  label: 'Pequena empresa', desc: '11–50 funcionários' },
  { value: 'media',    label: 'Média empresa',   desc: '51–200 funcionários' },
  { value: 'grande',   label: 'Grande empresa',  desc: '200+ funcionários' },
  { value: 'agencia',  label: 'Agência',         desc: 'Gerencia múltiplas marcas' },
]

const NICHOS = [
  'Lifestyle', 'Fitness e saúde', 'Gastronomia', 'Moda e beleza',
  'Finanças e negócios', 'Tecnologia', 'Educação', 'Entretenimento',
  'Viagem', 'Esportes', 'Games', 'Maternidade e família', 'Outro',
]

const PLATAFORMAS = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn', 'Pinterest', 'Twitch']

const ORCAMENTOS = [
  { value: 'ate_5k',    label: 'Até R$5.000' },
  { value: '5k_20k',   label: 'R$5.000 – R$20.000' },
  { value: '20k_50k',  label: 'R$20.000 – R$50.000' },
  { value: '50k_mais', label: 'Acima de R$50.000' },
]

type Status = 'idle' | 'saving' | 'saved' | 'error'

export default function MarcaPerfilPage() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<Status>('idle')

  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [segmento, setSegmento] = useState('')
  const [porte, setPorte] = useState('')
  const [site, setSite] = useState('')
  const [instagram, setInstagram] = useState('')
  const [sobre, setSobre] = useState('')
  const [nichosInteresse, setNichosInteresse] = useState<string[]>([])
  const [plataformasFoco, setPlataformasFoco] = useState<string[]>([])
  const [orcamentoMedio, setOrcamentoMedio] = useState('')

  useEffect(() => {
    fetch('/api/marca/perfil')
      .then(r => r.json())
      .then(({ profile }) => {
        if (profile) {
          setNomeEmpresa(profile.nome_empresa ?? '')
          setCnpj(profile.cnpj ?? '')
          setSegmento(profile.segmento ?? '')
          setPorte(profile.porte ?? '')
          setSite(profile.site ?? '')
          setInstagram(profile.instagram ?? '')
          setSobre(profile.sobre ?? '')
          setNichosInteresse(profile.nichos_interesse ?? [])
          setPlataformasFoco(profile.plataformas_foco ?? [])
          setOrcamentoMedio(profile.orcamento_medio ?? '')
        }
        setLoading(false)
      })
  }, [])

  function toggleNicho(n: string) {
    setNichosInteresse(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])
  }

  function togglePlataforma(p: string) {
    setPlataformasFoco(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function handleSave() {
    setStatus('saving')
    try {
      const res = await fetch('/api/marca/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_empresa: nomeEmpresa.trim() || null,
          cnpj: cnpj.trim() || null,
          segmento: segmento || null,
          porte: porte || null,
          site: site.trim() || null,
          instagram: instagram.trim() || null,
          sobre: sobre.trim() || null,
          nichos_interesse: nichosInteresse,
          plataformas_foco: plataformasFoco,
          orcamento_medio: orcamentoMedio || null,
          onboarding_completo: true,
        }),
      })
      if (!res.ok) throw new Error()
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-iara-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-[#5a5a7a] mb-2">
          <span>Área da Marca</span>
          <span>/</span>
          <span className="text-[#9b9bb5]">Minha Empresa</span>
        </div>
        <h1 className="text-3xl font-bold text-[#f1f1f8]">
          Minha <span className="iara-gradient-text">Empresa</span>
        </h1>
        <p className="text-sm text-[#5a5a7a] mt-1">
          Mantenha as informações da sua empresa atualizadas
        </p>
      </div>

      <div className="space-y-8">
        {/* Dados da empresa */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-iara-400" />
            <h2 className="text-sm font-bold text-[#9b9bb5] uppercase tracking-wider">Dados da empresa</h2>
          </div>
          <div className="space-y-4 rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] p-5">
            <div>
              <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
                Nome da empresa
              </label>
              <input
                value={nomeEmpresa}
                onChange={e => setNomeEmpresa(e.target.value)}
                placeholder="Ex: Marca Brasil Ltda"
                className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/15 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">
                CNPJ <span className="text-[#3a3a5a] normal-case font-normal">(opcional)</span>
              </label>
              <input
                value={cnpj}
                onChange={e => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/15 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-3">Segmento</label>
              <div className="grid grid-cols-3 gap-2">
                {SEGMENTOS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSegmento(s.value)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-medium transition-all border ${
                      segmento === s.value
                        ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
                        : 'border-[#1a1a2e] text-[#6b6b8a] hover:border-iara-900/50 hover:text-[#9b9bb5]'
                    }`}
                  >
                    <span className="text-base">{s.emoji}</span>
                    <span className="text-center leading-tight">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-3">Porte</label>
              <div className="space-y-2">
                {PORTES.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPorte(p.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                      porte === p.value
                        ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
                        : 'border-[#1a1a2e] text-[#9b9bb5] hover:border-iara-900/50'
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className={`text-xs ${porte === p.value ? 'text-iara-500' : 'text-[#3a3a5a]'}`}>{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Presença online */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-iara-400" />
            <h2 className="text-sm font-bold text-[#9b9bb5] uppercase tracking-wider">Presença online</h2>
          </div>
          <div className="space-y-4 rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] p-5">
            <div>
              <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Site</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3a3a5a]" />
                <input
                  value={site}
                  onChange={e => setSite(e.target.value)}
                  placeholder="https://suamarca.com.br"
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 pl-11 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/15 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Instagram</label>
              <div className="relative">
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3a3a5a]" />
                <input
                  value={instagram}
                  onChange={e => setInstagram(e.target.value)}
                  placeholder="@suamarca"
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 pl-11 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/15 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Sobre a empresa</label>
              <textarea
                value={sobre}
                onChange={e => setSobre(e.target.value)}
                placeholder="Descreva brevemente o que sua empresa faz e o público que atende..."
                rows={4}
                className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/15 transition-all resize-none"
              />
            </div>
          </div>
        </section>

        {/* Preferências */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-iara-400" />
            <h2 className="text-sm font-bold text-[#9b9bb5] uppercase tracking-wider">Preferências de campanha</h2>
          </div>
          <div className="space-y-5 rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] p-5">
            <div>
              <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-3">
                Nichos de criador de interesse
              </label>
              <div className="flex flex-wrap gap-2">
                {NICHOS.map(n => (
                  <button
                    key={n}
                    onClick={() => toggleNicho(n)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                      nichosInteresse.includes(n)
                        ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
                        : 'border-[#1a1a2e] text-[#6b6b8a] hover:border-iara-900/50 hover:text-[#9b9bb5]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-3">
                Plataformas de foco
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATAFORMAS.map(p => (
                  <button
                    key={p}
                    onClick={() => togglePlataforma(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                      plataformasFoco.includes(p)
                        ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
                        : 'border-[#1a1a2e] text-[#6b6b8a] hover:border-iara-900/50 hover:text-[#9b9bb5]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-3">
                Orçamento médio por campanha
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ORCAMENTOS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setOrcamentoMedio(o.value)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border text-left ${
                      orcamentoMedio === o.value
                        ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
                        : 'border-[#1a1a2e] text-[#9b9bb5] hover:border-iara-900/50'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={status === 'saving'}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}
          >
            {status === 'saving' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            ) : (
              <><Save className="w-4 h-4" /> Salvar alterações</>
            )}
          </button>
          {status === 'saved' && (
            <div className="flex items-center gap-1.5 text-green-400 text-sm">
              <Check className="w-4 h-4" /> Salvo!
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-1.5 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" /> Erro ao salvar
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
