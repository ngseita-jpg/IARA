'use client'

import { useState, useEffect } from 'react'
import {
  Tag, Plus, X, Loader2, AlertCircle, CheckCircle, ChevronDown,
  ChevronUp, ExternalLink, Users, TrendingUp, DollarSign, Package,
  ToggleLeft, ToggleRight, Trash2,
} from 'lucide-react'

type Afiliado = {
  id: string
  cupom_codigo: string
  status: string
  cliques: number
  vendas_confirmadas: number
  comissao_total: number
  creator_id: string
  creator_profiles: { nome_artistico: string } | null
}

type Produto = {
  id: string
  titulo: string
  descricao: string | null
  url_produto: string
  preco: number | null
  imagem_url: string | null
  comissao_pct: number
  desconto_pct: number
  ativo: boolean
  created_at: string
  afiliados: Afiliado[]
}

const INITIAL_FORM = {
  titulo: '', descricao: '', url_produto: '', preco: '',
  imagem_url: '', comissao_pct: '10', desconto_pct: '10',
}

export default function MarcaAfiliadosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Confirmar venda
  const [vendaModal, setVendaModal] = useState<{ afiliado: Afiliado; produto: Produto } | null>(null)
  const [valorVenda, setValorVenda] = useState('')
  const [obsVenda, setObsVenda] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const r = await fetch('/api/produtos-afiliados')
    const d = await r.json()
    setProdutos(d.produtos ?? [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.titulo || !form.url_produto || !form.comissao_pct || !form.desconto_pct) {
      setErro('Preencha todos os campos obrigatórios.')
      return
    }
    setSaving(true)
    setErro(null)
    const r = await fetch('/api/produtos-afiliados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        preco: form.preco ? Number(form.preco) : null,
        comissao_pct: Number(form.comissao_pct),
        desconto_pct: Number(form.desconto_pct),
      }),
    })
    const d = await r.json()
    if (!r.ok) { setErro(d.error); setSaving(false); return }
    setProdutos(prev => [{ ...d.produto, afiliados: [] }, ...prev])
    setForm(INITIAL_FORM)
    setShowForm(false)
    flash('Produto cadastrado com sucesso!')
    setSaving(false)
  }

  async function toggleAtivo(produto: Produto) {
    await fetch(`/api/produtos-afiliados/${produto.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !produto.ativo }),
    })
    setProdutos(prev => prev.map(p => p.id === produto.id ? { ...p, ativo: !p.ativo } : p))
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este produto? Afiliações existentes serão desfeitas.')) return
    await fetch(`/api/produtos-afiliados/${id}`, { method: 'DELETE' })
    setProdutos(prev => prev.filter(p => p.id !== id))
  }

  async function confirmarVenda() {
    if (!vendaModal || !valorVenda) return
    setConfirmando(true)
    const r = await fetch(`/api/afiliados/${vendaModal.afiliado.id}/vendas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor_venda: Number(valorVenda), observacoes: obsVenda }),
    })
    const d = await r.json()
    if (r.ok) {
      flash(`Venda confirmada! Comissão do criador: R$ ${d.comissao_criador.toFixed(2)}`)
      setVendaModal(null)
      setValorVenda('')
      setObsVenda('')
      load()
    } else {
      setErro(d.error)
    }
    setConfirmando(false)
  }

  function flash(msg: string) {
    setSucesso(msg)
    setTimeout(() => setSucesso(null), 4000)
  }

  const totalAfiliados = produtos.reduce((s, p) => s + (p.afiliados?.length ?? 0), 0)
  const totalVendas = produtos.reduce((s, p) => s + (p.afiliados?.reduce((a, af) => a + af.vendas_confirmadas, 0) ?? 0), 0)
  const totalComissao = produtos.reduce((s, p) => s + (p.afiliados?.reduce((a, af) => a + af.comissao_total, 0) ?? 0), 0)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-marca-400 text-sm font-medium mb-2">
          <Tag className="w-4 h-4" />
          <span>Módulo</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#f1f1f8]">
              Programa de <span className="text-[#C9A84C]">Afiliados</span>
            </h1>
            <p className="mt-1 text-[#9b9bb5] text-sm">
              Cadastre produtos, defina comissões e deixe criadores divulgarem por você.
            </p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#E2C068] text-[#0a0a14] text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Produtos', value: produtos.length, icon: Package, color: 'text-[#C9A84C]' },
          { label: 'Afiliados ativos', value: totalAfiliados, icon: Users, color: 'text-marca-400' },
          { label: 'Vendas confirmadas', value: totalVendas, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Comissões pagas', value: `R$ ${totalComissao.toFixed(2)}`, icon: DollarSign, color: 'text-iara-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#0d0d1a] border border-[#1a1a2e] rounded-2xl p-4">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <div className="text-xl font-bold text-[#f1f1f8]">{s.value}</div>
            <div className="text-xs text-[#6b6b8a] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

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

      {/* Form novo produto */}
      {showForm && (
        <div className="bg-[#0d0d1a] border border-[#C9A84C]/30 rounded-2xl p-6 mb-8">
          <h2 className="text-base font-bold text-[#f1f1f8] mb-5">Cadastrar novo produto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs text-[#9b9bb5] font-medium mb-1 block">Nome do produto *</label>
              <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ex: Câmera Sony ZV-E10" className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/50 focus:outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-[#9b9bb5] font-medium mb-1 block">URL do produto no seu site *</label>
              <input value={form.url_produto} onChange={e => setForm(f => ({ ...f, url_produto: e.target.value }))}
                placeholder="https://sualoja.com.br/produto/..." className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#9b9bb5] font-medium mb-1 block">Preço (R$)</label>
              <input type="number" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))}
                placeholder="299.90" className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#9b9bb5] font-medium mb-1 block">URL da imagem (opcional)</label>
              <input value={form.imagem_url} onChange={e => setForm(f => ({ ...f, imagem_url: e.target.value }))}
                placeholder="https://..." className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#9b9bb5] font-medium mb-1 block">Comissão do criador (%) *</label>
              <div className="relative">
                <input type="number" min="1" max="100" value={form.comissao_pct} onChange={e => setForm(f => ({ ...f, comissao_pct: e.target.value }))}
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] focus:border-[#C9A84C]/50 focus:outline-none pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6b6b8a]">%</span>
              </div>
              <p className="text-[10px] text-[#4a4a6a] mt-1">90% vai ao criador · 10% à Iara Hub</p>
            </div>
            <div>
              <label className="text-xs text-[#9b9bb5] font-medium mb-1 block">Desconto no cupom (%) *</label>
              <div className="relative">
                <input type="number" min="1" max="100" value={form.desconto_pct} onChange={e => setForm(f => ({ ...f, desconto_pct: e.target.value }))}
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] focus:border-[#C9A84C]/50 focus:outline-none pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6b6b8a]">%</span>
              </div>
              <p className="text-[10px] text-[#4a4a6a] mt-1">Desconto que o cliente final recebe no checkout</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-[#9b9bb5] font-medium mb-1 block">Descrição (opcional)</label>
              <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                rows={3} placeholder="Descreva o produto para os criadores..."
                className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-[#C9A84C]/50 focus:outline-none resize-none" />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={handleCreate} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#E2C068] text-[#0a0a14] text-sm font-bold transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Cadastrar produto
            </button>
            <button onClick={() => { setShowForm(false); setForm(INITIAL_FORM) }}
              className="px-5 py-2.5 rounded-xl border border-[#1a1a2e] text-sm text-[#9b9bb5] hover:text-[#f1f1f8] transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de produtos */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-marca-400 animate-spin" /></div>
      ) : produtos.length === 0 ? (
        <div className="text-center py-16 text-[#4a4a6a]">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum produto cadastrado. Crie o primeiro acima.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {produtos.map(produto => {
            const isExp = expanded === produto.id
            const afs = produto.afiliados ?? []
            return (
              <div key={produto.id} className="bg-[#0d0d1a] border border-[#1a1a2e] rounded-2xl overflow-hidden">
                {/* Produto header */}
                <div className="flex items-center gap-4 p-5">
                  {produto.imagem_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={produto.imagem_url} alt={produto.titulo} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-[#1a1a2e]" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-[#f1f1f8] truncate">{produto.titulo}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${produto.ativo ? 'bg-green-950/40 text-green-400 border border-green-800/30' : 'bg-[#1a1a2e] text-[#5a5a7a] border border-[#2a2a3e]'}`}>
                        {produto.ativo ? 'Ativo' : 'Pausado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {produto.preco && <span className="text-sm text-[#9b9bb5]">R$ {produto.preco.toFixed(2)}</span>}
                      <span className="text-xs text-[#C9A84C] font-semibold">{produto.comissao_pct}% comissão</span>
                      <span className="text-xs text-iara-400 font-semibold">{produto.desconto_pct}% desconto</span>
                      <span className="text-xs text-[#6b6b8a]">{afs.length} afiliado{afs.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={produto.url_produto} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg text-[#5a5a7a] hover:text-[#f1f1f8] hover:bg-[#1a1a2e] transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={() => toggleAtivo(produto)}
                      className="p-2 rounded-lg text-[#5a5a7a] hover:text-[#f1f1f8] hover:bg-[#1a1a2e] transition-colors">
                      {produto.ativo ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(produto.id)}
                      className="p-2 rounded-lg text-[#5a5a7a] hover:text-red-400 hover:bg-red-950/20 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setExpanded(isExp ? null : produto.id)}
                      className="p-2 rounded-lg text-[#5a5a7a] hover:text-[#f1f1f8] hover:bg-[#1a1a2e] transition-colors">
                      {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Afiliados */}
                {isExp && (
                  <div className="border-t border-[#1a1a2e] p-5">
                    {afs.length === 0 ? (
                      <p className="text-sm text-[#4a4a6a] text-center py-4">Nenhum criador afiliado ainda.</p>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-[#6b6b8a] font-semibold uppercase tracking-wider mb-3">Afiliados</p>
                        {afs.map(af => (
                          <div key={af.id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[#0a0a14] border border-[#1a1a2e]">
                            <div>
                              <p className="text-sm font-semibold text-[#f1f1f8]">{af.creator_profiles?.nome_artistico ?? 'Criador'}</p>
                              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                <span className="text-xs font-mono text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded">{af.cupom_codigo}</span>
                                <span className="text-xs text-[#6b6b8a]">{af.cliques} cliques</span>
                                <span className="text-xs text-[#6b6b8a]">{af.vendas_confirmadas} vendas</span>
                                <span className="text-xs text-green-400 font-semibold">R$ {af.comissao_total.toFixed(2)}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => { setVendaModal({ afiliado: af, produto }); setValorVenda(''); setObsVenda('') }}
                              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-900/30 text-green-400 border border-green-800/30 hover:bg-green-900/50 transition-colors"
                            >
                              Confirmar venda
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal confirmar venda */}
      {vendaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0d0d1a] border border-[#1a1a2e] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#f1f1f8] mb-1">Confirmar venda</h3>
            <p className="text-xs text-[#6b6b8a] mb-5">
              Afiliado: <strong className="text-[#f1f1f8]">{vendaModal.afiliado.creator_profiles?.nome_artistico}</strong> · Cupom: <span className="font-mono text-[#C9A84C]">{vendaModal.afiliado.cupom_codigo}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#9b9bb5] font-medium mb-1 block">Valor da venda (R$) *</label>
                <input type="number" value={valorVenda} onChange={e => setValorVenda(e.target.value)}
                  placeholder="Ex: 299.90"
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-green-500/40 focus:outline-none" />
                {valorVenda && Number(valorVenda) > 0 && (
                  <div className="mt-2 p-3 rounded-lg bg-green-950/20 border border-green-800/20 text-xs space-y-1">
                    <div className="flex justify-between text-[#9b9bb5]">
                      <span>Comissão bruta ({vendaModal.produto.comissao_pct}%)</span>
                      <span>R$ {(Number(valorVenda) * vendaModal.produto.comissao_pct / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-400 font-semibold">
                      <span>→ Criador recebe (90%)</span>
                      <span>R$ {(Number(valorVenda) * vendaModal.produto.comissao_pct / 100 * 0.9).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-iara-400">
                      <span>→ Iara Hub (10%)</span>
                      <span>R$ {(Number(valorVenda) * vendaModal.produto.comissao_pct / 100 * 0.1).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-[#9b9bb5] font-medium mb-1 block">Observações (opcional)</label>
                <input value={obsVenda} onChange={e => setObsVenda(e.target.value)}
                  placeholder="Pedido #12345, data..."
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-green-500/40 focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={confirmarVenda} disabled={!valorVenda || confirmando}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors disabled:opacity-40">
                {confirmando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirmar
              </button>
              <button onClick={() => setVendaModal(null)}
                className="px-4 py-2.5 rounded-xl border border-[#1a1a2e] text-sm text-[#9b9bb5] hover:text-[#f1f1f8] transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
