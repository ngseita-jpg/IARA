'use client'

import { useState } from 'react'
import {
  BookOpen, Sparkles, RefreshCw, Printer,
  Users, TrendingUp, Star, Package,
  ChevronDown, ChevronUp, Check,
} from 'lucide-react'

// ─── tipos ────────────────────────────────────────────────────────────────────

interface KitGerado {
  bio_comercial: string
  proposta_de_valor: string
  audiencia: string
  formatos_de_conteudo: { formato: string; descricao: string }[]
  cases_e_parcerias: string
  pacotes: string
  cta_final: string
}

interface MetricaRede {
  plataforma: string
  seguidores: number
  alcance_mensal: number
  visualizacoes_mensais: number
  taxa_engajamento: number | null
  posts_mensais: number
}

interface Profile {
  nome_artistico?: string
  nicho?: string
  plataformas?: string[]
  pontos?: number
  voz_score_medio?: number
}

interface BadgeInfo {
  badge: string
  cor: { bg: string; text: string; border: string; emoji: string }
  pontos: number
}

interface KitData {
  kit: KitGerado
  profile: Profile
  metricas: MetricaRede[]
  badge: BadgeInfo | null
  totalSeguidores: number
  contato?: string
  site?: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const PLAT_LABELS: Record<string, string> = {
  instagram: 'Instagram', youtube: 'YouTube', tiktok: 'TikTok',
  linkedin: 'LinkedIn', twitter: 'Twitter/X',
}
const PLAT_ICONS: Record<string, string> = {
  instagram: '📸', youtube: '▶️', tiktok: '🎵', linkedin: '💼', twitter: '🐦',
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('pt-BR')
}

// ─── preview do kit (também usado no print) ───────────────────────────────────

function KitPreview({ data }: { data: KitData }) {
  const { kit, profile, metricas, badge, totalSeguidores, contato, site } = data

  return (
    <div id="kit-preview" className="bg-[#0a0a14] text-[#f1f1f8] print:bg-white print:text-black">

      {/* ── CAPA ── */}
      <div className="relative overflow-hidden rounded-2xl print:rounded-none mb-6 bg-gradient-to-br from-[#1a0a2e] via-[#0d0d1a] to-[#0a0a14] border border-iara-700/20 print:border-0 print:mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-iara-600/10 to-accent-purple/5 pointer-events-none" />
        <div className="relative px-8 py-10 print:px-6 print:py-8">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div>
              <p className="text-iara-400 text-xs font-semibold uppercase tracking-widest mb-2 print:text-purple-600">
                Mídia Kit
              </p>
              <h1 className="text-3xl font-bold text-[#f1f1f8] print:text-black">
                {profile?.nome_artistico ?? 'Criador'}
              </h1>
              {profile?.nicho && (
                <p className="text-[#9b9bb5] mt-1 print:text-gray-600">{profile.nicho}</p>
              )}
            </div>
            {badge && (
              <div className={`px-4 py-2 rounded-xl border ${badge.cor.border} ${badge.cor.bg} print:border-gray-300 print:bg-gray-50`}>
                <p className={`text-sm font-bold ${badge.cor.text} print:text-gray-800`}>
                  {badge.cor.emoji} {badge.badge}
                </p>
                <p className="text-xs text-[#5a5a7a] print:text-gray-500">{badge.pontos} pts · Iara</p>
              </div>
            )}
          </div>

          {/* métricas destaque */}
          {metricas.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0a0a14]/60 rounded-xl p-3 text-center print:bg-gray-50 print:rounded-lg">
                <p className="text-xl font-bold iara-gradient-text print:text-purple-700">{fmt(totalSeguidores)}</p>
                <p className="text-xs text-[#5a5a7a] print:text-gray-500">Seguidores totais</p>
              </div>
              <div className="bg-[#0a0a14]/60 rounded-xl p-3 text-center print:bg-gray-50 print:rounded-lg">
                <p className="text-xl font-bold iara-gradient-text print:text-purple-700">{metricas.length}</p>
                <p className="text-xs text-[#5a5a7a] print:text-gray-500">Plataformas</p>
              </div>
              {metricas.find((m) => m.taxa_engajamento != null) && (
                <div className="bg-[#0a0a14]/60 rounded-xl p-3 text-center print:bg-gray-50 print:rounded-lg">
                  <p className="text-xl font-bold iara-gradient-text print:text-purple-700">
                    {(metricas.filter(m => m.taxa_engajamento != null)
                      .reduce((s, m) => s + (m.taxa_engajamento ?? 0), 0) /
                      metricas.filter(m => m.taxa_engajamento != null).length
                    ).toFixed(1)}%
                  </p>
                  <p className="text-xs text-[#5a5a7a] print:text-gray-500">Eng. médio</p>
                </div>
              )}
              {contato && (
                <div className="bg-[#0a0a14]/60 rounded-xl p-3 text-center print:bg-gray-50 print:rounded-lg">
                  <p className="text-xs font-medium text-iara-400 print:text-purple-600 break-all">{contato}</p>
                  <p className="text-xs text-[#5a5a7a] print:text-gray-500">Contato</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── SEÇÕES ── */}
      <div className="space-y-5 print:space-y-4">

        {/* bio */}
        <section className="iara-card p-6 print:border print:border-gray-200 print:rounded-lg print:bg-white">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#f1f1f8] mb-3 print:text-black">
            <Users className="w-4 h-4 text-iara-400 print:text-purple-600" />
            Sobre
          </h2>
          <div className="text-sm text-[#c4c4d8] leading-relaxed whitespace-pre-wrap print:text-gray-700">
            {kit.bio_comercial}
          </div>
        </section>

        {/* proposta de valor */}
        <section className="iara-card p-6 print:border print:border-gray-200 print:rounded-lg print:bg-white">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#f1f1f8] mb-3 print:text-black">
            <Star className="w-4 h-4 text-yellow-400" />
            Por que trabalhar comigo
          </h2>
          <div className="text-sm text-[#c4c4d8] leading-relaxed whitespace-pre-wrap print:text-gray-700">
            {kit.proposta_de_valor}
          </div>
        </section>

        {/* audiência */}
        <section className="iara-card p-6 print:border print:border-gray-200 print:rounded-lg print:bg-white">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#f1f1f8] mb-3 print:text-black">
            <Users className="w-4 h-4 text-iara-400 print:text-purple-600" />
            Minha audiência
          </h2>
          <div className="text-sm text-[#c4c4d8] leading-relaxed whitespace-pre-wrap print:text-gray-700">
            {kit.audiencia}
          </div>
        </section>

        {/* métricas por rede */}
        {metricas.length > 0 && (
          <section className="iara-card p-6 print:border print:border-gray-200 print:rounded-lg print:bg-white">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#f1f1f8] mb-4 print:text-black">
              <TrendingUp className="w-4 h-4 text-iara-400 print:text-purple-600" />
              Métricas por plataforma
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {metricas.map((m) => {
                const views = m.visualizacoes_mensais ?? m.alcance_mensal ?? 0
                return (
                  <div
                    key={m.plataforma}
                    className="bg-[#0a0a14]/50 rounded-xl p-4 print:bg-gray-50 print:rounded-lg border border-[#1a1a2e] print:border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{PLAT_ICONS[m.plataforma] ?? '📊'}</span>
                      <span className="font-semibold text-sm text-[#f1f1f8] print:text-black">
                        {PLAT_LABELS[m.plataforma] ?? m.plataforma}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {m.seguidores > 0 && (
                        <div>
                          <p className="text-iara-400 font-bold print:text-purple-600">{fmt(m.seguidores)}</p>
                          <p className="text-[#5a5a7a] print:text-gray-500">Seguidores</p>
                        </div>
                      )}
                      {views > 0 && (
                        <div>
                          <p className="text-iara-400 font-bold print:text-purple-600">{fmt(views)}</p>
                          <p className="text-[#5a5a7a] print:text-gray-500">Alcance/Views</p>
                        </div>
                      )}
                      {m.taxa_engajamento != null && (
                        <div>
                          <p className="text-iara-400 font-bold print:text-purple-600">{m.taxa_engajamento}%</p>
                          <p className="text-[#5a5a7a] print:text-gray-500">Engajamento</p>
                        </div>
                      )}
                      {m.posts_mensais > 0 && (
                        <div>
                          <p className="text-iara-400 font-bold print:text-purple-600">{m.posts_mensais}</p>
                          <p className="text-[#5a5a7a] print:text-gray-500">Posts/mês</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* formatos de conteúdo */}
        {kit.formatos_de_conteudo?.length > 0 && (
          <section className="iara-card p-6 print:border print:border-gray-200 print:rounded-lg print:bg-white">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#f1f1f8] mb-4 print:text-black">
              <BookOpen className="w-4 h-4 text-iara-400 print:text-purple-600" />
              Formatos de conteúdo
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {kit.formatos_de_conteudo.map((f, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-3 bg-[#0a0a14]/50 rounded-xl border border-[#1a1a2e] print:bg-gray-50 print:border-gray-200"
                >
                  <Check className="w-4 h-4 text-iara-400 flex-shrink-0 mt-0.5 print:text-purple-600" />
                  <div>
                    <p className="text-sm font-semibold text-[#f1f1f8] print:text-black">{f.formato}</p>
                    <p className="text-xs text-[#9b9bb5] mt-0.5 print:text-gray-600">{f.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* cases e parcerias */}
        <section className="iara-card p-6 print:border print:border-gray-200 print:rounded-lg print:bg-white">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#f1f1f8] mb-3 print:text-black">
            <Star className="w-4 h-4 text-yellow-400" />
            Parcerias e cases
          </h2>
          <div className="text-sm text-[#c4c4d8] leading-relaxed whitespace-pre-wrap print:text-gray-700">
            {kit.cases_e_parcerias}
          </div>
        </section>

        {/* pacotes */}
        <section className="iara-card p-6 print:border print:border-gray-200 print:rounded-lg print:bg-white">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#f1f1f8] mb-3 print:text-black">
            <Package className="w-4 h-4 text-iara-400 print:text-purple-600" />
            Pacotes de parceria
          </h2>
          <div className="text-sm text-[#c4c4d8] leading-relaxed whitespace-pre-wrap print:text-gray-700">
            {kit.pacotes}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl p-6 bg-gradient-to-br from-iara-600/20 to-accent-purple/10 border border-iara-700/20 print:border print:border-purple-200 print:bg-purple-50 print:rounded-lg">
          <div className="text-sm text-[#c4c4d8] leading-relaxed whitespace-pre-wrap print:text-gray-700 mb-3">
            {kit.cta_final}
          </div>
          {(contato || site) && (
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              {contato && <span className="text-iara-400 font-medium print:text-purple-700">✉ {contato}</span>}
              {site && <span className="text-iara-400 font-medium print:text-purple-700">🔗 {site}</span>}
            </div>
          )}
        </section>

      </div>

      {/* rodapé */}
      <div className="mt-6 text-center text-xs text-[#5a5a7a] print:text-gray-400">
        Mídia kit gerado com Iara · iara.ai
      </div>
    </div>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function MidiaKitPage() {
  const [formAberto, setFormAberto] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [kitData, setKitData] = useState<KitData | null>(null)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    parcerias_anteriores: '',
    pacotes: '',
    bio_comercial_extra: '',
    contato: '',
    site: '',
  })

  async function handleGerar() {
    setGerando(true)
    setErro('')

    try {
      const res = await fetch('/api/midia-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const d = await res.json()
        setErro(d.error ?? 'Erro ao gerar mídia kit')
        return
      }

      const data = await res.json()
      setKitData(data)
      setFormAberto(false)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setGerando(false)
    }
  }

  function handleImprimir() {
    window.print()
  }

  return (
    <>
      {/* CSS de impressão */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          #kit-preview { max-width: 100% !important; }
          .iara-card {
            background: white !important;
            border: 1px solid #e5e7eb !important;
          }
        }
      `}</style>

      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8 no-print">
          <div className="flex items-center gap-2 text-iara-400 text-sm font-medium mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Apresentação profissional</span>
          </div>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#f1f1f8]">
                Mídia Kit <span className="iara-gradient-text">com IA</span>
              </h1>
              <p className="mt-1 text-[#9b9bb5] text-sm">
                A IA monta seu kit profissional usando perfil, métricas e voz. Pronto para enviar para marcas.
              </p>
            </div>
            {kitData && (
              <div className="flex gap-2">
                <button
                  onClick={() => setFormAberto((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1a1a2e] text-[#9b9bb5] text-sm hover:bg-[#1a1a2e] transition-colors"
                >
                  {formAberto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {formAberto ? 'Fechar formulário' : 'Editar dados'}
                </button>
                <button
                  onClick={handleImprimir}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-iara-600 to-accent-purple text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <Printer className="w-4 h-4" /> Exportar / Imprimir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Formulário */}
        {formAberto && (
          <div className="iara-card p-6 mb-8 no-print">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-iara-400" />
              <p className="text-sm font-semibold text-[#f1f1f8]">
                Complete as informações — perfil, métricas e voz serão puxados automaticamente
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="iara-label block mb-1.5">E-mail ou WhatsApp para contato</label>
                  <input
                    type="text"
                    value={form.contato}
                    onChange={(e) => setForm((f) => ({ ...f, contato: e.target.value }))}
                    placeholder="seuemail@gmail.com ou (11) 99999-9999"
                    className="iara-input w-full"
                  />
                </div>
                <div>
                  <label className="iara-label block mb-1.5">Site ou link principal</label>
                  <input
                    type="text"
                    value={form.site}
                    onChange={(e) => setForm((f) => ({ ...f, site: e.target.value }))}
                    placeholder="seusite.com.br ou linktr.ee/seuperfil"
                    className="iara-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="iara-label block mb-1.5">
                  Parcerias e cases anteriores{' '}
                  <span className="text-[#5a5a7a] font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={form.parcerias_anteriores}
                  onChange={(e) => setForm((f) => ({ ...f, parcerias_anteriores: e.target.value }))}
                  placeholder="Ex: Campanha para Marca X — Reel com 200K views. Recebido da Marca Y — 3 stories. Embaixadora da Marca Z por 6 meses."
                  className="iara-input w-full resize-none"
                />
              </div>

              <div>
                <label className="iara-label block mb-1.5">
                  Pacotes e preços{' '}
                  <span className="text-[#5a5a7a] font-normal">(opcional — a IA sugere se não informar)</span>
                </label>
                <textarea
                  rows={3}
                  value={form.pacotes}
                  onChange={(e) => setForm((f) => ({ ...f, pacotes: e.target.value }))}
                  placeholder="Ex: Pack Stories (5 slides) — R$800. Reel patrocinado — R$2.500. Menção + link na bio (30 dias) — R$1.200."
                  className="iara-input w-full resize-none"
                />
              </div>

              <div>
                <label className="iara-label block mb-1.5">
                  Algo que quer destacar{' '}
                  <span className="text-[#5a5a7a] font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.bio_comercial_extra}
                  onChange={(e) => setForm((f) => ({ ...f, bio_comercial_extra: e.target.value }))}
                  placeholder="Ex: Especialista certificada em nutrição esportiva. Produção própria com câmera profissional. Entregas em até 7 dias."
                  className="iara-input w-full resize-none"
                />
              </div>

              {erro && (
                <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-xl px-4 py-3">
                  {erro}
                </p>
              )}

              <button
                onClick={handleGerar}
                disabled={gerando}
                className="iara-btn-primary w-full py-3 text-base"
              >
                {gerando
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando seu mídia kit…</>
                  : <><Sparkles className="w-4 h-4" /> {kitData ? 'Regenerar mídia kit' : 'Gerar mídia kit'}</>
                }
              </button>

              {!kitData && (
                <p className="text-xs text-[#5a5a7a] text-center">
                  A IA vai usar seu perfil, métricas e análise de voz para personalizar tudo
                </p>
              )}
            </div>
          </div>
        )}

        {/* Preview do Kit */}
        {kitData && (
          <div className="max-w-3xl">
            <KitPreview data={kitData} />
          </div>
        )}

        {/* Estado vazio */}
        {!kitData && !formAberto && (
          <div className="iara-card p-12 text-center">
            <BookOpen className="w-10 h-10 text-iara-700 mx-auto mb-3" />
            <p className="text-[#5a5a7a]">Preencha o formulário para gerar seu mídia kit</p>
          </div>
        )}
      </div>
    </>
  )
}
