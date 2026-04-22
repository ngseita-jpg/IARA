'use client'

import { useEffect, useState } from 'react'
import { Plus, Copy, ToggleLeft, ToggleRight, Check, Tag, Loader2, Trash2 } from 'lucide-react'

type PromoCode = {
  id: string
  code: string
  active: boolean
  times_redeemed: number
  max_redemptions: number | null
  coupon: {
    percent_off: number
    name: string
  }
  created: number
}

export default function CuponsAdmin() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState({ desconto: '10', codigo: '', uso_maximo: '' })
  const [copiado, setCopiado] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  async function carregar() {
    setLoading(true)
    const res = await fetch('/api/admin/cupons')
    if (res.ok) {
      const data = await res.json()
      setCodes(data.codes)
    }
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.codigo.trim()) return
    setCriando(true)
    try {
      const res = await fetch('/api/admin/cupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          desconto: Number(form.desconto),
          codigo: form.codigo.trim(),
          uso_maximo: form.uso_maximo ? Number(form.uso_maximo) : undefined,
        }),
      })
      if (res.ok) {
        setForm({ desconto: '10', codigo: '', uso_maximo: '' })
        await carregar()
      }
    } finally {
      setCriando(false)
    }
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    setToggling(id)
    await fetch('/api/admin/cupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ativo: !ativo }),
    })
    await carregar()
    setToggling(null)
  }

  function copiar(code: string) {
    navigator.clipboard.writeText(code)
    setCopiado(code)
    setTimeout(() => setCopiado(null), 2000)
  }

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: '#08080f' }}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Tag className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Cupons de Desconto</h1>
          </div>
          <p className="text-[#6b6b8a] text-sm ml-12">Gerencie códigos para influenciadores e parcerias</p>
        </div>

        {/* Criar cupom */}
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#13131f] p-6 mb-6">
          <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Novo cupom</h2>
          <form onSubmit={handleCriar} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#6b6b8a] mb-1.5 block">Desconto</label>
                <select
                  value={form.desconto}
                  onChange={e => setForm(f => ({ ...f, desconto: e.target.value }))}
                  className="w-full rounded-xl bg-[#0e0e1a] border border-[#1a1a2e] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600/60"
                >
                  <option value="10">10% de desconto</option>
                  <option value="100">100% gratuito</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#6b6b8a] mb-1.5 block">Usos máximos (opcional)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Ilimitado"
                  value={form.uso_maximo}
                  onChange={e => setForm(f => ({ ...f, uso_maximo: e.target.value }))}
                  className="w-full rounded-xl bg-[#0e0e1a] border border-[#1a1a2e] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600/60 placeholder:text-[#3a3a5a]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#6b6b8a] mb-1.5 block">Código</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ex: BRENDA10, GRÁTIS2024"
                  value={form.codigo}
                  onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                  className="flex-1 rounded-xl bg-[#0e0e1a] border border-[#1a1a2e] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600/60 placeholder:text-[#3a3a5a] font-mono"
                />
                <button
                  type="submit"
                  disabled={criando || !form.codigo.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}
                >
                  {criando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Criar
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Lista */}
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#13131f] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1a1a2e] flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Cupons ativos</h2>
            <span className="text-xs text-[#6b6b8a]">{codes.length} cupons</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center py-16 text-[#3a3a5a] text-sm">
              Nenhum cupom criado ainda
            </div>
          ) : (
            <div className="divide-y divide-[#1a1a2e]">
              {codes.map(c => (
                <div key={c.id} className="px-6 py-4 flex items-center gap-4">
                  {/* Badge desconto */}
                  <div
                    className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-black text-white"
                    style={{
                      background: c.coupon.percent_off === 100
                        ? 'linear-gradient(135deg,#10b981,#059669)'
                        : 'linear-gradient(135deg,#6366f1,#a855f7)',
                    }}
                  >
                    <span className="text-lg leading-none">{c.coupon.percent_off}%</span>
                    <span className="text-[9px] opacity-80">OFF</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-white text-base">{c.code}</span>
                      <button
                        onClick={() => copiar(c.code)}
                        className="p-1 rounded-lg hover:bg-[#1a1a2e] text-[#6b6b8a] hover:text-white transition-colors cursor-pointer"
                      >
                        {copiado === c.code ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      {!c.active && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/50 text-red-400 border border-red-900/30">
                          Inativo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#6b6b8a]">
                      <span>{c.coupon.name}</span>
                      <span>·</span>
                      <span>{c.times_redeemed} uso{c.times_redeemed !== 1 ? 's' : ''}{c.max_redemptions ? ` / ${c.max_redemptions}` : ''}</span>
                      <span>·</span>
                      <span>{new Date(c.created * 1000).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleAtivo(c.id, c.active)}
                    disabled={toggling === c.id}
                    className="p-1.5 rounded-lg hover:bg-[#1a1a2e] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {toggling === c.id
                      ? <Loader2 className="w-5 h-5 animate-spin text-[#6b6b8a]" />
                      : c.active
                        ? <ToggleRight className="w-5 h-5 text-indigo-400" />
                        : <ToggleLeft className="w-5 h-5 text-[#3a3a5a]" />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#2a2a3a] mt-6">
          Área restrita · Iara Hub Admin
        </p>
      </div>
    </div>
  )
}
