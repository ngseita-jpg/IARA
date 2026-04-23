'use client'

import { useState } from 'react'
import { FileText, Sparkles, Loader2, Copy, Check, AlertCircle } from 'lucide-react'

export default function BriefingPage() {
  const [produto, setProduto] = useState('')
  const [objetivo, setObjetivo] = useState('awareness')
  const [publicoAlvo, setPublicoAlvo] = useState('')
  const [budget, setBudget] = useState('5k-20k')
  const [contexto, setContexto] = useState('')
  const [gerando, setGerando] = useState(false)
  const [briefing, setBriefing] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [uso, setUso] = useState<{ atual: number; limite: number | null } | null>(null)

  async function gerar() {
    if (!produto.trim()) return
    setGerando(true); setErro(null); setBriefing('')
    try {
      const res = await fetch('/api/marca/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produto,
          objetivo,
          publico_alvo: publicoAlvo,
          budget_total: budget,
          contexto,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao gerar briefing')
        return
      }
      setBriefing(data.briefing)
      setUso(data.uso)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro de conexão')
    } finally {
      setGerando(false)
    }
  }

  function copiar() {
    navigator.clipboard.writeText(briefing)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[10px] font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: '#E2C068' }}>
          <Sparkles className="w-3 h-3" />
          Gerador de Briefing IA
        </div>
        <h1 className="font-display font-black text-[clamp(28px,4vw,40px)] leading-tight tracking-display mb-2">
          Briefing de campanha profissional{' '}
          <span className="font-editorial font-normal" style={{ color: '#E2C068' }}>em 30 segundos</span>
        </h1>
        <p className="text-[#9b9bb5] max-w-xl text-[15px]">
          Responda 5 perguntas. A Iara entrega um briefing completo com KPIs, perfil do criador ideal, entregáveis, pitch magnetic e range de valor realista pra mercado BR 2026.
        </p>
      </div>

      {/* Formulário */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a]/80 p-6 sm:p-8 mb-6 space-y-5">
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-1.5">Produto ou serviço *</label>
          <input
            value={produto}
            onChange={e => setProduto(e.target.value)}
            placeholder="Ex: Linha de skincare natural veggie"
            className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/60 focus:outline-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-1.5">Objetivo principal *</label>
            <select value={objetivo} onChange={e => setObjetivo(e.target.value)}
              className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] focus:border-[#C9A84C]/60 focus:outline-none">
              <option value="awareness">Awareness — dar a conhecer a marca</option>
              <option value="lancamento">Lançamento de produto novo</option>
              <option value="vendas">Vendas diretas + cupom</option>
              <option value="afiliacao">Programa de afiliação recorrente</option>
              <option value="reposicionamento">Reposicionamento de marca</option>
              <option value="blackfriday">Black Friday / evento pontual</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-1.5">Budget total</label>
            <select value={budget} onChange={e => setBudget(e.target.value)}
              className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] focus:border-[#C9A84C]/60 focus:outline-none">
              <option value="1k-5k">R$ 1.000 – R$ 5.000 (1-2 nanos)</option>
              <option value="5k-20k">R$ 5.000 – R$ 20.000 (3-5 micros)</option>
              <option value="20k-50k">R$ 20.000 – R$ 50.000 (1 médio + suportes)</option>
              <option value="50k-100k">R$ 50.000 – R$ 100.000 (1 macro)</option>
              <option value="100k+">R$ 100.000+ (celebridade / campanha ampla)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-1.5">Público-alvo (opcional — IA sugere se vazio)</label>
          <input
            value={publicoAlvo}
            onChange={e => setPublicoAlvo(e.target.value)}
            placeholder="Ex: mulheres 25-40 classe A/B interessadas em sustentabilidade"
            className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-1.5">Contexto extra (opcional)</label>
          <textarea
            value={contexto}
            onChange={e => setContexto(e.target.value)}
            rows={3}
            placeholder="Ex: temos uma black friday em 15 dias, precisamos recuperar vendas da linha X que caiu 30%..."
            className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/60 focus:outline-none resize-none"
          />
        </div>

        <button
          onClick={gerar}
          disabled={gerando || !produto.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-[#0a0a14] transition-all disabled:opacity-40 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#E2C068,#C9A84C,#a855f7)' }}
        >
          {gerando ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando briefing profissional...</> : <><Sparkles className="w-4 h-4" /> Gerar Briefing</>}
        </button>

        {erro && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {erro}
          </div>
        )}
      </div>

      {/* Resultado */}
      {briefing && (
        <div className="rounded-2xl border border-[#C9A84C]/30 bg-gradient-to-br from-[#1a1410]/80 to-[#0d0d1a]/80 p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: '#E2C068' }} />
              <p className="text-[10px] tracking-[0.3em] uppercase font-semibold" style={{ color: '#C9A84C' }}>
                Briefing pronto para envio
              </p>
            </div>
            <button onClick={copiar} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#C9A84C]/40 text-[#E2C068] text-xs font-semibold hover:bg-[#C9A84C]/10 transition-colors">
              {copiado ? <><Check className="w-3 h-3" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar</>}
            </button>
          </div>
          <div
            className="prose prose-invert max-w-none text-[14px] leading-[1.75]"
            dangerouslySetInnerHTML={{
              __html: briefing
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/^## (.+)$/gm, '<h3 style="color:#E2C068;font-size:16px;font-weight:700;margin:24px 0 10px;">$1</h3>')
                .replace(/^### (.+)$/gm, '<h4 style="color:#d8d8e4;font-size:14px;font-weight:600;margin:16px 0 6px;">$1</h4>')
                .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#f1f1f8;">$1</strong>')
                .replace(/^- (.+)$/gm, '<li style="margin:4px 0;">$1</li>')
                .replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, m => `<ul style="margin:8px 0 12px 20px;list-style:disc;color:#c1c1d8;">${m}</ul>`)
                .replace(/\n\n+/g, '</p><p style="margin:10px 0;color:#c1c1d8;">')
                .replace(/^/, '<p style="margin:10px 0;color:#c1c1d8;">') + '</p>',
            }}
          />
          {uso && uso.limite !== null && (
            <p className="text-[11px] text-[#5a5a7a] mt-6 pt-4 border-t border-white/5">
              Uso do mês: {uso.atual}/{uso.limite} briefings
            </p>
          )}
        </div>
      )}
    </div>
  )
}
