'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Gift, Link2, Copy, Check, CheckCircle2, Loader2, DollarSign,
  Users, Clock, TrendingUp, ExternalLink, AlertCircle,
} from 'lucide-react'

type Indicacao = {
  id: number
  status: 'pendente' | 'ativada' | 'cancelada' | 'expirada'
  plano: string | null
  valor_primeira_venda: number | null
  valor_recorrente_mensal: number | null
  meses_recorrencia_pagos: number
  meses_recorrencia_total: number
  valor_total_apurado: number | null
  created_at: string
  ativada_at: string | null
}

type Pagamento = {
  id: number
  referencia_mes: string
  valor_total: number
  status: 'pendente' | 'pago' | 'falhou'
  pago_at: string | null
  created_at: string
}

type Dados = {
  ref_code: string
  link_completo: string
  pix: { chave: string | null; tipo: string | null }
  saldo: {
    indicacoes_ativas: number
    indicacoes_pendentes: number
    total_apurado: number
    total_pago: number
    saldo_pendente: number
  }
  indicacoes: Indicacao[]
  pagamentos: Pagamento[]
}

function brl(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function IndicacoesPage() {
  const [dados, setDados] = useState<Dados | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [editandoPix, setEditandoPix] = useState(false)
  const [pixChave, setPixChave] = useState('')
  const [pixTipo, setPixTipo] = useState('cpf')
  const [salvandoPix, setSalvandoPix] = useState(false)

  useEffect(() => {
    fetch('/api/indicacoes')
      .then(r => r.json())
      .then(d => { setDados(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function copiarLink() {
    if (!dados) return
    await navigator.clipboard.writeText(dados.link_completo)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function salvarPix() {
    setSalvandoPix(true)
    try {
      const res = await fetch('/api/indicacoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pix_chave: pixChave, pix_tipo: pixTipo }),
      })
      if (res.ok && dados) {
        setDados({ ...dados, pix: { chave: pixChave, tipo: pixTipo } })
        setEditandoPix(false)
      }
    } finally {
      setSalvandoPix(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-iara-500" />
      </div>
    )
  }

  if (!dados) {
    return <div className="p-8 text-center text-[#9b9bb5]">Erro ao carregar dados</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-purple/30 bg-accent-purple/10 text-accent-purple text-[10px] font-bold tracking-[0.22em] uppercase mb-4">
          <Gift className="w-3 h-3" />
          Indique e Ganhe
        </div>
        <h1 className="font-display font-black text-[clamp(28px,4.5vw,44px)] leading-[1.05] tracking-display mb-3">
          Seu link, sua renda.
        </h1>
        <p className="text-[#9b9bb5] max-w-xl">
          Ganhe <strong className="text-[#f1f1f8]">50% do primeiro mês</strong> de cada amigo que assinar e mais{' '}
          <strong className="text-[#f1f1f8]">10% por 12 meses</strong> enquanto ele continuar pagando.{' '}
          <Link href="/termos/afiliados" className="text-iara-400 hover:text-iara-300 underline">Ver termos →</Link>
        </p>
      </div>

      {/* Link de indicação */}
      <section className="mb-6 rounded-3xl border border-iara-700/25 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.05))' }}>
        <div className="p-6 sm:p-8">
          <p className="text-[10px] tracking-[0.3em] uppercase font-semibold text-iara-400 mb-3">Seu link exclusivo</p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[280px] flex items-center gap-2 px-4 py-3.5 rounded-xl bg-[#0a0a14] border border-[#1a1a2e] font-mono text-sm text-[#f1f1f8]">
              <Link2 className="w-4 h-4 text-iara-400 flex-shrink-0" />
              <span className="truncate">{dados.link_completo}</span>
            </div>
            <button
              onClick={copiarLink}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}
            >
              {copied ? <><Check className="w-4 h-4" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar</>}
            </button>
          </div>
          <p className="text-[11px] text-[#5a5a7a] mt-3">
            Cookie válido por 30 dias. Cada clique conta, mesmo que o cadastro aconteça dias depois.
          </p>
        </div>
      </section>

      {/* Cards de saldo */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <CardSaldo
          icon={Users}
          label="Indicações ativas"
          valor={String(dados.saldo.indicacoes_ativas)}
          sub={`${dados.saldo.indicacoes_pendentes} pendentes`}
          cor="#818cf8"
        />
        <CardSaldo
          icon={TrendingUp}
          label="Total apurado"
          valor={brl(dados.saldo.total_apurado)}
          sub="desde o início"
          cor="#a855f7"
        />
        <CardSaldo
          icon={DollarSign}
          label="Saldo pendente"
          valor={brl(Math.max(0, dados.saldo.saldo_pendente))}
          sub="a receber no dia 10"
          cor="#10b981"
          destaque
        />
        <CardSaldo
          icon={CheckCircle2}
          label="Já recebido"
          valor={brl(dados.saldo.total_pago)}
          sub="acumulado pago"
          cor="#ec4899"
        />
      </section>

      {/* Chave PIX */}
      <section className="mb-8 rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a]/60 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase font-semibold text-[#6b6b8a] mb-2">Chave PIX de recebimento</p>
            {dados.pix.chave ? (
              <div>
                <p className="font-mono text-sm text-[#f1f1f8]">{dados.pix.chave}</p>
                <p className="text-[11px] text-[#6b6b8a] mt-1 uppercase">{dados.pix.tipo}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">Cadastre sua chave PIX pra receber os pagamentos</p>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setEditandoPix(true)
              setPixChave(dados.pix.chave ?? '')
              setPixTipo(dados.pix.tipo ?? 'cpf')
            }}
            className="px-4 py-2 rounded-lg border border-iara-700/40 text-iara-400 text-xs font-semibold hover:bg-iara-900/20 transition-colors"
          >
            {dados.pix.chave ? 'Alterar' : 'Cadastrar'}
          </button>
        </div>

        {editandoPix && (
          <div className="mt-5 pt-5 border-t border-[#1a1a2e] grid sm:grid-cols-[200px_1fr_auto] gap-3">
            <select
              value={pixTipo}
              onChange={e => setPixTipo(e.target.value)}
              className="rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-3 py-2.5 text-sm text-[#f1f1f8] focus:border-iara-500/60 focus:outline-none"
            >
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">Email</option>
              <option value="celular">Celular</option>
              <option value="aleatoria">Aleatória</option>
            </select>
            <input
              value={pixChave}
              onChange={e => setPixChave(e.target.value)}
              placeholder="Sua chave PIX"
              className="rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-2.5 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={salvarPix}
                disabled={salvandoPix || !pixChave}
                className="px-4 py-2.5 rounded-xl bg-iara-500 text-white text-sm font-semibold disabled:opacity-50"
              >
                {salvandoPix ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </button>
              <button
                onClick={() => setEditandoPix(false)}
                className="px-4 py-2.5 rounded-xl border border-[#1a1a2e] text-[#9b9bb5] text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Lista de indicações */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-[#f1f1f8] text-xl mb-4">Minhas indicações</h2>
        {dados.indicacoes.length === 0 ? (
          <div className="rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a]/60 p-10 text-center">
            <Users className="w-10 h-10 text-[#3a3a5a] mx-auto mb-3" />
            <p className="text-[#9b9bb5] text-sm mb-1">Nenhuma indicação ainda</p>
            <p className="text-[#6b6b8a] text-xs">Compartilha seu link ali em cima e começa a ganhar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dados.indicacoes.map(i => (
              <LinhaIndicacao key={i.id} indicacao={i} />
            ))}
          </div>
        )}
      </section>

      {/* Histórico de pagamentos */}
      {dados.pagamentos.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-[#f1f1f8] text-xl mb-4">Pagamentos recebidos</h2>
          <div className="rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a]/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-[#1a1a2e] bg-[#0a0a14]">
                <tr className="text-left text-[10px] uppercase tracking-widest text-[#6b6b8a]">
                  <th className="px-5 py-3">Mês</th>
                  <th className="px-5 py-3">Valor</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {dados.pagamentos.map(p => (
                  <tr key={p.id} className="border-b border-[#1a1a2e] last:border-0">
                    <td className="px-5 py-3 text-[#f1f1f8] font-semibold">{p.referencia_mes}</td>
                    <td className="px-5 py-3 tabular-nums">{brl(p.valor_total)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-3 text-[#9b9bb5]">
                      {p.pago_at ? new Date(p.pago_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Footer com link dos termos */}
      <div className="mt-12 pt-8 border-t border-white/5 text-center">
        <Link href="/termos/afiliados" className="text-sm text-[#6b6b8a] hover:text-[#9b9bb5] transition-colors inline-flex items-center gap-1.5">
          Termos do programa <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}

function CardSaldo({
  icon: Icon, label, valor, sub, cor, destaque,
}: {
  icon: typeof Gift; label: string; valor: string; sub: string; cor: string; destaque?: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-4 border ${destaque ? 'border-green-700/40' : 'border-[#1a1a2e]'}`}
      style={{
        background: destaque
          ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(8,8,15,0.9))'
          : 'rgba(13,13,26,0.6)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color: cor }} />
        <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a]">{label}</p>
      </div>
      <p className="font-display font-black text-[#f1f1f8] text-[22px] leading-none tabular-nums">{valor}</p>
      <p className="text-[11px] text-[#6b6b8a] mt-1">{sub}</p>
    </div>
  )
}

function LinhaIndicacao({ indicacao: i }: { indicacao: Indicacao }) {
  const cores: Record<string, { border: string; bg: string; txt: string; label: string }> = {
    pendente:   { border: 'border-amber-700/25', bg: 'bg-amber-950/10', txt: 'text-amber-400', label: 'Aguardando ativação' },
    ativada:    { border: 'border-green-700/25', bg: 'bg-green-950/10', txt: 'text-green-400', label: 'Pagando comissão' },
    cancelada:  { border: 'border-red-700/25',   bg: 'bg-red-950/10',   txt: 'text-red-400',   label: 'Cancelada' },
    expirada:   { border: 'border-[#1a1a2e]',    bg: 'bg-[#0d0d1a]/60', txt: 'text-[#6b6b8a]', label: 'Expirada' },
  }
  const c = cores[i.status] ?? cores.pendente

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4 flex items-center justify-between gap-4 flex-wrap`}>
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-3 h-3 text-[#5a5a7a]" />
          <p className="text-xs text-[#9b9bb5]">
            {new Date(i.created_at).toLocaleDateString('pt-BR')}
          </p>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${c.txt}`}>· {c.label}</span>
        </div>
        <p className="text-sm font-semibold text-[#f1f1f8]">
          {i.plano ? `Plano ${i.plano}` : 'Aguardando escolha de plano'}
        </p>
        {i.status === 'ativada' && (
          <p className="text-[11px] text-[#6b6b8a] mt-1">
            Recorrência: {i.meses_recorrencia_pagos}/{i.meses_recorrencia_total} meses pagos
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-widest text-[#6b6b8a]">Ganho total</p>
        <p className="font-display font-black text-[#f1f1f8] text-lg tabular-nums">
          {brl(Number(i.valor_total_apurado ?? 0))}
        </p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pendente: 'bg-amber-950/30 border-amber-800/40 text-amber-400',
    pago:     'bg-green-950/30 border-green-800/40 text-green-400',
    falhou:   'bg-red-950/30 border-red-800/40 text-red-400',
  }
  const labels: Record<string, string> = {
    pendente: 'Aguardando',
    pago:     'Pago',
    falhou:   'Falhou',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-lg border text-[10px] font-semibold uppercase tracking-widest ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
