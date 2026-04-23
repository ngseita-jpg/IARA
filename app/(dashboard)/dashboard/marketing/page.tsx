'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles, Send, Loader2, ChevronDown, ChevronUp,
  History, Zap,
} from 'lucide-react'
import { ADMIN_EMAILS } from '@/lib/admin'

type Agente = {
  id: string
  nome: string
  papel: string
  emoji: string
  cor: string
}

const AGENTES_UI: Agente[] = [
  { id: 'estrategista',          nome: 'Estrategista',          papel: 'Visão macro, posicionamento',    emoji: '🎯', cor: '#6366f1' },
  { id: 'diretor_conteudo',      nome: 'Diretor de Conteúdo',   papel: 'Conceito criativo, campanhas',   emoji: '🎨', cor: '#a855f7' },
  { id: 'analista_performance',  nome: 'Analista de Performance', papel: 'Métricas, funil, experimentos', emoji: '📊', cor: '#ec4899' },
  { id: 'growth_hacker',         nome: 'Growth Hacker',         papel: 'Táticas não-óbvias, parcerias',  emoji: '🔥', cor: '#f59e0b' },
  { id: 'copywriter',            nome: 'Copywriter',            papel: 'Hook, headline, CTA',            emoji: '✍️', cor: '#06b6d4' },
  { id: 'social_media',          nome: 'Social Media',          papel: 'Instagram, TikTok, LinkedIn',    emoji: '📱', cor: '#10b981' },
  { id: 'especialista_preco',    nome: 'Especialista em Preço', papel: 'Pricing, pacotes, testes',       emoji: '💰', cor: '#8b5cf6' },
]

const ACOES_RAPIDAS = [
  { id: 'campanha',    titulo: 'Campanha pra nicho específico',  exemplo: 'Como vender o Iara pra nutricionistas nos próximos 30 dias?' },
  { id: 'preco',       titulo: 'Revisão de pricing',              exemplo: 'Faz sentido testar Premium em R$ 149? Ou Plus em R$ 69,90?' },
  { id: 'funil',       titulo: 'Destravar o funil',               exemplo: 'Tenho 2% de conversão landing→trial. Como subir pra 5%?' },
  { id: 'concorrente', titulo: 'Analisar concorrente',            exemplo: 'Como me diferenciar do Jasper e Copy.ai no mercado BR?' },
  { id: 'publico',     titulo: 'Explorar novo público',           exemplo: 'Vale atacar advogados como nicho prioritário nos próximos 90d?' },
  { id: 'livre',       titulo: 'Brainstorm livre',                exemplo: 'Me ajuda a pensar no que rodar de campanha de lançamento.' },
]

type Sessao = {
  id: number
  tipo_pedido: string
  objetivo: string
  status: string
  sintese: string | null
  custo_estimado_brl: number
  created_at: string
}

type Resposta = { agente: string; resposta: string }

export default function MarketingPage() {
  const router = useRouter()
  const [autorizado, setAutorizado] = useState<boolean | null>(null)
  const [objetivo, setObjetivo] = useState('')
  const [tipoPedido, setTipoPedido] = useState('livre')

  // Verifica se o user logado é admin — se não for, volta pro dashboard
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email
      if (email && ADMIN_EMAILS.includes(email)) {
        setAutorizado(true)
      } else {
        router.replace('/dashboard')
      }
    })
  }, [router])
  const [gerando, setGerando] = useState(false)
  const [sessaoAtiva, setSessaoAtiva] = useState<number | null>(null)
  const [respostasAtivas, setRespostasAtivas] = useState<Resposta[]>([])
  const [sinteseAtiva, setSinteseAtiva] = useState<string>('')
  const [custoAtivo, setCustoAtivo] = useState(0)
  const [historico, setHistorico] = useState<Sessao[]>([])
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const [agenteExpandido, setAgenteExpandido] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/marketing/brainstorm')
      .then(r => r.json())
      .then(d => setHistorico(d.sessoes ?? []))
      .catch(() => {})
  }, [])

  async function gerarBrainstorm() {
    if (!objetivo.trim() || gerando) return
    setGerando(true)
    setErro(null)
    setSessaoAtiva(null)
    setRespostasAtivas([])
    setSinteseAtiva('')
    setAgenteExpandido(null)

    try {
      const res = await fetch('/api/marketing/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objetivo, tipo_pedido: tipoPedido }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar')
      setSessaoAtiva(data.sessao_id)
      setRespostasAtivas(data.respostas)
      setSinteseAtiva(data.sintese)
      setCustoAtivo(data.custo_estimado_brl ?? 0)

      // Refresca histórico
      const histRes = await fetch('/api/marketing/brainstorm')
      const histData = await histRes.json()
      setHistorico(histData.sessoes ?? [])
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setGerando(false)
    }
  }

  async function carregarSessao(id: number) {
    const res = await fetch(`/api/marketing/sessao/${id}`)
    const data = await res.json()
    if (data.sessao) {
      setSessaoAtiva(id)
      setObjetivo(data.sessao.objetivo)
      setTipoPedido(data.sessao.tipo_pedido)
      setRespostasAtivas(data.respostas ?? [])
      setSinteseAtiva(data.sessao.sintese ?? '')
      setCustoAtivo(data.sessao.custo_estimado_brl ?? 0)
      setHistoricoAberto(false)
      setAgenteExpandido(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function selecionarAcaoRapida(acao: typeof ACOES_RAPIDAS[0]) {
    setTipoPedido(acao.id)
    setObjetivo(acao.exemplo)
  }

  // Bloqueia render enquanto verifica ou se não autorizado (enquanto redireciona)
  if (!autorizado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-iara-500" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 editorial-punct">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-iara-700/30 text-[10px] font-semibold text-iara-300 mb-4 tracking-[0.22em] uppercase">
          <Sparkles className="w-3 h-3" />
          Marketing Squad · Admin
        </div>
        <h1 className="font-display font-black text-[clamp(32px,5vw,52px)] leading-[1.02] tracking-display mb-3">
          7 agentes.{' '}
          <span className="font-editorial font-normal text-iara-300/95">Uma mesa</span> de marketing à sua disposição.
        </h1>
        <p className="text-[#9b9bb5] text-[15px] max-w-2xl leading-relaxed">
          Estrategista, Diretor Criativo, Analista, Growth Hacker, Copywriter, Social Media, Especialista em Preço. Faz pergunta — os 7 pensam em paralelo e um Editor-chefe consolida em plano de 30 dias.
        </p>
      </div>

      {/* Input */}
      <section className="rounded-3xl border border-iara-700/25 bg-gradient-to-br from-iara-950/20 to-[#0d0d1a]/80 p-6 sm:p-8 mb-8">
        <label className="text-[10px] tracking-[0.3em] uppercase font-semibold text-iara-400 mb-3 block">
          Briefing do fundador
        </label>
        <textarea
          value={objetivo}
          onChange={e => setObjetivo(e.target.value)}
          placeholder="Ex: Como vender o Iara pra dentistas nos próximos 60 dias com budget de R$ 3k/mês em ads?"
          rows={3}
          disabled={gerando}
          className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-[15px] text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/15 transition-all resize-none"
        />

        <div className="mt-4 mb-5">
          <p className="text-[10px] tracking-[0.25em] uppercase font-semibold text-[#6b6b8a] mb-2">Ações rápidas</p>
          <div className="flex flex-wrap gap-2">
            {ACOES_RAPIDAS.map(a => (
              <button
                key={a.id}
                onClick={() => selecionarAcaoRapida(a)}
                disabled={gerando}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all disabled:opacity-50 ${
                  tipoPedido === a.id
                    ? 'bg-iara-600/25 border-iara-500/50 text-iara-200'
                    : 'bg-[#0a0a14] border-[#1a1a2e] text-[#9b9bb5] hover:border-iara-700/40'
                }`}
              >
                {a.titulo}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-[11px] text-[#5a5a7a]">
            🎯 7 agentes × Claude Sonnet + síntese em Haiku · custo ~R$ 0,30 por sessão
          </p>
          <button
            onClick={gerarBrainstorm}
            disabled={gerando || objetivo.trim().length < 10}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }}
          >
            {gerando ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Convocando os 7 agentes...</>
            ) : (
              <><Send className="w-4 h-4" /> Rodar squad</>
            )}
          </button>
        </div>

        {erro && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-sm">
            ⚠ {erro}
          </div>
        )}
      </section>

      {/* Resultado */}
      {sessaoAtiva && (
        <>
          {/* Síntese em destaque */}
          {sinteseAtiva && (
            <section className="rounded-3xl border border-accent-purple/40 p-6 sm:p-8 mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(99,102,241,0.04))' }}>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-accent-purple" />
                <p className="text-[10px] tracking-[0.3em] uppercase font-semibold text-accent-purple">
                  Síntese do Editor-chefe · plano de 30 dias
                </p>
              </div>
              <div className="prose prose-invert max-w-none text-[15px] leading-[1.75]">
                <MarkdownLite text={sinteseAtiva} />
              </div>
              <p className="text-[10px] text-[#5a5a7a] mt-6 pt-4 border-t border-white/5">
                Custo desta sessão: R$ {custoAtivo.toFixed(4)} · Sessão #{sessaoAtiva}
              </p>
            </section>
          )}

          {/* Respostas individuais por agente */}
          <section className="mb-8">
            <h2 className="text-[10px] tracking-[0.3em] uppercase font-semibold text-[#6b6b8a] mb-4">
              Respostas individuais dos 7 agentes
            </h2>
            <div className="space-y-2">
              {respostasAtivas.map(r => {
                const agente = AGENTES_UI.find(a => a.id === r.agente)
                if (!agente) return null
                const aberto = agenteExpandido === r.agente
                return (
                  <div
                    key={r.agente}
                    className="rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a]/60 overflow-hidden transition-all"
                    style={{ borderColor: aberto ? agente.cor + '66' : undefined }}
                  >
                    <button
                      onClick={() => setAgenteExpandido(aberto ? null : r.agente)}
                      className="w-full flex items-center justify-between gap-4 p-5 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: agente.cor + '22', border: `1px solid ${agente.cor}55` }}
                        >
                          {agente.emoji}
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-[#f1f1f8]">{agente.nome}</p>
                          <p className="text-xs text-[#6b6b8a]">{agente.papel}</p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-[#5a5a7a] flex-shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`}
                        style={{ color: aberto ? agente.cor : undefined }}
                      />
                    </button>
                    {aberto && (
                      <div className="px-5 pb-6 -mt-1 animate-fade-in">
                        <div className="prose prose-invert max-w-none text-[14px] leading-[1.7] text-[#c1c1d8]">
                          <MarkdownLite text={r.resposta} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}

      {/* Histórico */}
      <section className="rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a]/60 overflow-hidden">
        <button
          onClick={() => setHistoricoAberto(v => !v)}
          className="w-full flex items-center justify-between gap-3 p-5"
        >
          <div className="flex items-center gap-3">
            <History className="w-4 h-4 text-[#9b9bb5]" />
            <p className="text-[14px] font-semibold text-[#f1f1f8]">
              Histórico de sessões ({historico.length})
            </p>
          </div>
          {historicoAberto ? <ChevronUp className="w-4 h-4 text-[#6b6b8a]" /> : <ChevronDown className="w-4 h-4 text-[#6b6b8a]" />}
        </button>
        {historicoAberto && historico.length > 0 && (
          <div className="border-t border-[#1a1a2e] animate-fade-in">
            {historico.map(s => (
              <button
                key={s.id}
                onClick={() => carregarSessao(s.id)}
                className={`w-full flex items-center justify-between gap-3 p-4 hover:bg-iara-900/15 transition-colors text-left border-b border-[#1a1a2e] last:border-0 ${
                  sessaoAtiva === s.id ? 'bg-iara-900/20' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#c1c1d8] truncate">{s.objetivo}</p>
                  <p className="text-[10px] text-[#5a5a7a] mt-0.5">
                    {new Date(s.created_at).toLocaleDateString('pt-BR')} · {s.tipo_pedido} · R$ {Number(s.custo_estimado_brl).toFixed(4)}
                  </p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider ${
                    s.status === 'pronto'
                      ? 'bg-green-950/30 text-green-400 border border-green-800/40'
                      : 'bg-amber-950/30 text-amber-400 border border-amber-800/40'
                  }`}
                >
                  {s.status}
                </span>
              </button>
            ))}
          </div>
        )}
        {historicoAberto && historico.length === 0 && (
          <p className="p-5 border-t border-[#1a1a2e] text-sm text-[#6b6b8a] text-center">
            Nenhuma sessão ainda. Roda o primeiro brainstorm aí em cima.
          </p>
        )}
      </section>
    </div>
  )
}

// Renderizador MUITO simples de markdown — headings, bold, lista, parágrafos
function MarkdownLite({ text }: { text: string }) {
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^## (.+)$/gm, '<h3 style="font-size:15px;font-weight:700;margin:20px 0 10px;color:#f1f1f8;">$1</h3>')
    .replace(/^### (.+)$/gm, '<h4 style="font-size:13px;font-weight:600;margin:14px 0 6px;color:#d8d8e4;">$1</h4>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#f1f1f8;">$1</strong>')
    .replace(/^- (.+)$/gm, '<li style="margin:4px 0;">$1</li>')
    .replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, match => `<ul style="margin:8px 0 12px 20px;list-style:disc;">${match}</ul>`)
    .replace(/\n\n+/g, '</p><p style="margin:10px 0;">')

  html = `<p style="margin:10px 0;">${html}</p>`

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
