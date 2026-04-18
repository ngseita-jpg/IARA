'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Tag, ExternalLink, Copy, CheckCircle, Loader2, AlertCircle,
  TrendingUp, DollarSign, MousePointerClick, Package, X, Share2,
} from 'lucide-react'

type Produto = {
  id: string
  titulo: string
  descricao: string | null
  url_produto: string
  preco: number | null
  imagem_url: string | null
  comissao_pct: number
  desconto_pct: number
  brand_profiles: { nome_empresa: string } | null
}

type Afiliacao = {
  id: string
  cupom_codigo: string
  status: string
  cliques: number
  vendas_confirmadas: number
  comissao_total: number
  suspeito: boolean
  produto_id: string
  produtos_afiliados: {
    titulo: string
    url_produto: string
    comissao_pct: number
    desconto_pct: number
    brand_profiles: { nome_empresa: string } | null
  } | null
}

type Tab = 'explorar' | 'afiliados'

export default function CriadorAfiliadosPage() {
  const [tab, setTab] = useState<Tab>('explorar')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [afiliações, setAfiliações] = useState<Afiliacao[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState<string | null>(null)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const afiliadosPorProduto = new Map(afiliações.map(a => [a.produto_id, a]))

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/produtos-afiliados')
    const d = await r.json()
    setProdutos(d.produtos ?? [])
    setAfiliações(d.minhasAfiliations ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAfiliar(produto_id: string) {
    setJoining(produto_id)
    setErro(null)
    const r = await fetch('/api/afiliados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produto_id }),
    })
    const d = await r.json()
    if (r.ok || r.status === 409) {
      await load()
      setTab('afiliados')
      flash('Você está afiliado! Compartilhe seu cupom para começar a ganhar.')
    } else {
      setErro(d.error)
    }
    setJoining(null)
  }

  async function copiar(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopiado(key)
    setTimeout(() => setCopiado(null), 2000)
  }

  function flash(msg: string) {
    setSucesso(msg)
    setTimeout(() => setSucesso(null), 5000)
  }

  function getLinkAfiliado(cupom: string) {
    return `https://iarahubapp.com.br/r/${cupom}`
  }

  const totalGanhos = afiliações.reduce((s, a) => s + a.comissao_total, 0)
  const totalCliques = afiliações.reduce((s, a) => s + a.cliques, 0)
  const totalVendas = afiliações.reduce((s, a) => s + a.vendas_confirmadas, 0)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-iara-400 text-sm font-medium mb-2">
          <Tag className="w-4 h-4" />
          <span>Módulo</span>
        </div>
        <h1 className="text-3xl font-bold text-[#f1f1f8]">
          Programa de <span className="iara-gradient-text">Afiliados</span>
        </h1>
        <p className="mt-1 text-[#9b9bb5] text-sm">
          Divulgue produtos de marcas e ganhe comissão em cada venda feita com seu cupom.
        </p>
      </div>

      {/* Stats */}
      {afiliações.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total ganho', value: `R$ ${totalGanhos.toFixed(2)}`, icon: DollarSign, color: 'text-green-400' },
            { label: 'Cliques', value: totalCliques, icon: MousePointerClick, color: 'text-iara-400' },
            { label: 'Vendas confirmadas', value: totalVendas, icon: TrendingUp, color: 'text-[#C9A84C]' },
          ].map(s => (
            <div key={s.label} className="bg-[#0d0d1a] border border-[#1a1a2e] rounded-2xl p-4">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className="text-xl font-bold text-[#f1f1f8]">{s.value}</div>
              <div className="text-xs text-[#6b6b8a] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback */}
      {erro && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-900/20 border border-red-700/30 text-red-400 mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{erro}</span>
          <button onClick={() => setErro(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {sucesso && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-900/20 border border-green-700/30 text-green-400 mb-6">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{sucesso}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0a0a14] border border-[#1a1a2e] rounded-xl p-1 mb-6 w-fit">
        {(['explorar', 'afiliados'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-iara-600/20 text-iara-300 border border-iara-600/30'
                : 'text-[#6b6b8a] hover:text-[#9b9bb5]'
            }`}
          >
            {t === 'explorar' ? 'Explorar produtos' : `Minhas afiliações${afiliações.length > 0 ? ` (${afiliações.length})` : ''}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-iara-400 animate-spin" /></div>
      ) : tab === 'explorar' ? (
        /* ── EXPLORAR ── */
        produtos.length === 0 ? (
          <div className="text-center py-16 text-[#4a4a6a]">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum produto disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {produtos.map(produto => {
              const jaAfiliado = afiliadosPorProduto.has(produto.id)
              const afiliacao = afiliadosPorProduto.get(produto.id)
              return (
                <div key={produto.id} className="bg-[#0d0d1a] border border-[#1a1a2e] rounded-2xl overflow-hidden hover:border-iara-700/50 transition-colors">
                  {produto.imagem_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={produto.imagem_url} alt={produto.titulo} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-[#f1f1f8]">{produto.titulo}</h3>
                        <p className="text-xs text-[#6b6b8a] mt-0.5">por {produto.brand_profiles?.nome_empresa ?? 'Marca'}</p>
                      </div>
                      {produto.preco && (
                        <span className="text-sm font-bold text-[#f1f1f8] flex-shrink-0">R$ {produto.preco.toFixed(2)}</span>
                      )}
                    </div>

                    {produto.descricao && (
                      <p className="text-sm text-[#9b9bb5] mb-3 line-clamp-2">{produto.descricao}</p>
                    )}

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-950/40 text-green-400 border border-green-800/30">
                        {produto.comissao_pct}% de comissão
                      </span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-iara-900/40 text-iara-400 border border-iara-700/30">
                        {produto.desconto_pct}% de desconto pro cliente
                      </span>
                    </div>

                    {jaAfiliado ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-iara-900/20 border border-iara-700/30">
                        <CheckCircle className="w-4 h-4 text-iara-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#9b9bb5]">Seu cupom</p>
                          <p className="font-mono font-bold text-iara-300 text-sm">{afiliacao?.cupom_codigo}</p>
                        </div>
                        <button
                          onClick={() => { setTab('afiliados') }}
                          className="text-xs text-iara-400 hover:text-iara-300 font-semibold"
                        >
                          Ver →
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAfiliar(produto.id)}
                          disabled={joining === produto.id}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-iara-600 hover:bg-iara-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
                        >
                          {joining === produto.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                          Afiliar e divulgar
                        </button>
                        <a href={produto.url_produto} target="_blank" rel="noopener noreferrer"
                          className="p-2.5 rounded-xl border border-[#1a1a2e] text-[#6b6b8a] hover:text-[#f1f1f8] hover:bg-[#1a1a2e] transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* ── MINHAS AFILIAÇÕES ── */
        afiliações.length === 0 ? (
          <div className="text-center py-16 text-[#4a4a6a]">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-3">Você ainda não se afiliou a nenhum produto.</p>
            <button onClick={() => setTab('explorar')} className="text-sm text-iara-400 hover:text-iara-300 underline">
              Explorar produtos →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {afiliações.map(af => {
              const prod = af.produtos_afiliados
              const link = getLinkAfiliado(af.cupom_codigo)
              return (
                <div key={af.id} className="bg-[#0d0d1a] border border-[#1a1a2e] rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-bold text-[#f1f1f8]">{prod?.titulo ?? 'Produto'}</h3>
                      <p className="text-xs text-[#6b6b8a] mt-0.5">
                        {prod?.brand_profiles?.nome_empresa ?? 'Marca'} · {prod?.comissao_pct}% de comissão
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      af.status === 'ativo'
                        ? 'bg-green-950/40 text-green-400 border border-green-800/30'
                        : 'bg-[#1a1a2e] text-[#5a5a7a] border border-[#2a2a3e]'
                    }`}>
                      {af.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Cliques', value: af.cliques },
                      { label: 'Vendas', value: af.vendas_confirmadas },
                      { label: 'Ganhos', value: `R$ ${af.comissao_total.toFixed(2)}` },
                    ].map(s => (
                      <div key={s.label} className="text-center p-3 rounded-xl bg-[#0a0a14] border border-[#1a1a2e]">
                        <div className="text-base font-bold text-[#f1f1f8]">{s.value}</div>
                        <div className="text-[10px] text-[#6b6b8a] mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Alerta de suspeita */}
                  {af.suspeito && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-950/30 border border-amber-800/30 mb-3">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-400">Atenção: conversão suspeita</p>
                        <p className="text-xs text-[#9b9bb5] mt-0.5">
                          Este produto tem {af.cliques} cliques e 0 vendas confirmadas. A marca pode não estar reportando suas vendas. Considere entrar em contato com ela.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cupom + link */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#C9A84C]/8 border border-[#C9A84C]/20">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-[#6b6b8a] uppercase tracking-wider font-semibold">Seu cupom</p>
                        <p className="font-mono font-bold text-[#E2C068] text-lg tracking-widest">{af.cupom_codigo}</p>
                        <p className="text-[10px] text-[#6b6b8a] mt-0.5">
                          O cliente usa este código no checkout e ganha {prod?.desconto_pct}% de desconto
                        </p>
                      </div>
                      <button
                        onClick={() => copiar(af.cupom_codigo, `cupom-${af.id}`)}
                        className="p-2 rounded-lg bg-[#C9A84C]/15 hover:bg-[#C9A84C]/25 text-[#C9A84C] transition-colors"
                      >
                        {copiado === `cupom-${af.id}` ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0a0a14] border border-[#1a1a2e]">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-[#6b6b8a] uppercase tracking-wider font-semibold">Link rastreado</p>
                        <p className="text-xs text-[#9b9bb5] truncate">{link}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => copiar(link, `link-${af.id}`)}
                          className="p-2 rounded-lg hover:bg-[#1a1a2e] text-[#6b6b8a] hover:text-[#f1f1f8] transition-colors"
                        >
                          {copiado === `link-${af.id}` ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        {typeof navigator !== 'undefined' && navigator.share && (
                          <button
                            onClick={() => navigator.share({ title: prod?.titulo, url: link })}
                            className="p-2 rounded-lg hover:bg-[#1a1a2e] text-[#6b6b8a] hover:text-iara-400 transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
