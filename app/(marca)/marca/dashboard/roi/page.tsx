'use client'

import { useState, useEffect } from 'react'
import {
  Sparkles, Loader2, TrendingUp, MousePointerClick,
  ShoppingCart, DollarSign, Briefcase, Users, RefreshCw,
  AlertCircle,
} from 'lucide-react'

type ProdutoStats = {
  titulo: string
  preco: number | null
  comissao_pct: number
  totalAfiliados: number
  afiliadosAtivos: number
  totalCliques: number
  totalVendas: number
  totalComissao: number
  faturamentoBruto: number
  txConversao: string
  topCriadores: { nome: string; vendas: number; cliques: number }[]
}

type RelatorioData = {
  brand: { nome: string; segmento: string; porte: string }
  vagas: { total: number; abertas: number; candidaturas: number }
  afiliados: {
    produtos: ProdutoStats[]
    totais: { cliques: number; vendas: number; faturamento: number; comissao: number; txConversao: string }
  }
  analise: string
  geradoEm: string
}

function MarkdownAnalise({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith('## ') || line.startsWith('**') && line.endsWith('**'))
          return <h3 key={i} className="text-sm font-bold text-[#f1f1f8] mt-4 mb-1 first:mt-0">{line.replace(/^##\s|^\*\*|\*\*$/g, '')}</h3>
        if (line.startsWith('- '))
          return (
            <div key={i} className="flex gap-2 text-sm text-[#c9c9d8]">
              <span className="text-[#C9A84C] mt-0.5 flex-shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#f1f1f8]">$1</strong>') }} />
            </div>
          )
        if (line.trim() === '') return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm text-[#c9c9d8] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#f1f1f8]">$1</strong>') }} />
        )
      })}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color = '#C9A84C' }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className="rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[#f1f1f8]">{value}</p>
      {sub && <p className="text-xs text-[#5a5a7a] mt-0.5">{sub}</p>}
    </div>
  )
}

function BarChart({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="flex-1 h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function RelatorioROIPage() {
  const [data, setData] = useState<RelatorioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  async function carregar() {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch('/api/marca/roi')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao carregar relatório')
      setData(json)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  const fmtR = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  const dataHora = data?.geradoEm
    ? new Date(data.geradoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #a855f7)' }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#f1f1f8]">Relatório de ROI</h1>
            <p className="text-xs text-[#6b6b8a]">
              {dataHora ? `Gerado em ${dataHora}` : 'Desempenho das suas campanhas'}
            </p>
          </div>
        </div>
        <button onClick={carregar} disabled={loading}
          className="flex items-center gap-1.5 text-xs text-[#6b6b8a] hover:text-[#E2C068] transition-colors cursor-pointer disabled:opacity-40">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
          <p className="text-sm text-[#6b6b8a]">Gerando análise com IA...</p>
        </div>
      )}

      {erro && !loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{erro}</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Métricas gerais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={MousePointerClick} label="Cliques" value={fmt(data.afiliados.totais.cliques)} sub="rastreados via cupom" />
            <StatCard icon={ShoppingCart} label="Vendas" value={fmt(data.afiliados.totais.vendas)} sub="confirmadas" color="#a855f7" />
            <StatCard icon={DollarSign} label="Faturamento" value={fmtR(data.afiliados.totais.faturamento)} sub="bruto gerado" color="#22c55e" />
            <StatCard icon={TrendingUp} label="Conversão" value={`${data.afiliados.totais.txConversao}%`} sub="clique → venda" color="#ec4899" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard icon={Briefcase} label="Vagas criadas" value={String(data.vagas.total)} sub={`${data.vagas.abertas} abertas agora`} />
            <StatCard icon={Users} label="Candidaturas" value={fmt(data.vagas.candidaturas)} sub="recebidas no total" color="#a855f7" />
            <StatCard icon={DollarSign} label="Comissões" value={fmtR(data.afiliados.totais.comissao)} sub="pago aos criadores" color="#C9A84C" />
          </div>

          {/* Análise IA */}
          <div className="rounded-2xl border border-[#C9A84C]/25 p-5"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(168,85,247,0.05) 100%)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-sm font-bold text-[#f1f1f8]">Análise da Iara</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border text-[#E2C068] border-[#C9A84C]/40"
                style={{ background: 'rgba(201,168,76,0.1)' }}>IA</span>
            </div>
            <MarkdownAnalise text={data.analise} />
          </div>

          {/* Produtos */}
          {data.afiliados.produtos.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-[#6b6b8a] uppercase tracking-widest mb-3">Desempenho por produto</h2>
              <div className="space-y-3">
                {data.afiliados.produtos.map((p, i) => {
                  const maxVendas = Math.max(...data.afiliados.produtos.map(x => x.totalVendas), 1)
                  const maxCliques = Math.max(...data.afiliados.produtos.map(x => x.totalCliques), 1)
                  return (
                    <div key={i} className="rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-[#f1f1f8]">{p.titulo}</h3>
                          <p className="text-xs text-[#6b6b8a] mt-0.5">
                            {p.preco ? `R$ ${Number(p.preco).toFixed(2)}` : 'Preço não informado'} · {p.comissao_pct}% comissão · {p.afiliadosAtivos} criadores ativos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#f1f1f8]">{fmtR(p.faturamentoBruto)}</p>
                          <p className="text-xs text-[#6b6b8a]">{p.txConversao}% conv.</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#5a5a7a] w-16">Cliques</span>
                          <BarChart value={p.totalCliques} max={maxCliques} color="#C9A84C" />
                          <span className="text-xs font-semibold text-[#f1f1f8] w-10 text-right">{fmt(p.totalCliques)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#5a5a7a] w-16">Vendas</span>
                          <BarChart value={p.totalVendas} max={maxVendas} color="#a855f7" />
                          <span className="text-xs font-semibold text-[#f1f1f8] w-10 text-right">{fmt(p.totalVendas)}</span>
                        </div>
                      </div>

                      {p.topCriadores.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#1a1a2e]">
                          <p className="text-xs text-[#5a5a7a] mb-2">Top criadores</p>
                          <div className="flex flex-wrap gap-2">
                            {p.topCriadores.map((c, j) => (
                              <div key={j} className="flex items-center gap-1.5 text-xs bg-[#13131f] rounded-xl px-2.5 py-1.5 border border-[#1a1a2e]">
                                <span className="text-[#f1f1f8] font-medium">{c.nome}</span>
                                <span className="text-[#5a5a7a]">·</span>
                                <span className="text-[#C9A84C]">{c.vendas} vendas</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {data.afiliados.produtos.length === 0 && data.vagas.total === 0 && (
            <div className="text-center py-10">
              <p className="text-sm text-[#6b6b8a]">Você ainda não tem dados suficientes para o relatório.</p>
              <p className="text-xs text-[#3a3a5a] mt-1">Crie vagas de campanha ou adicione produtos ao programa de afiliados para ver métricas aqui.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
