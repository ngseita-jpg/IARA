'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  DollarSign, Loader2, Copy, Check, ShieldAlert, RefreshCw,
  ExternalLink, AlertCircle, ArrowLeft, FileText,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/lib/toast'

type Elegivel = {
  user_id: string
  nome: string
  email: string | null
  pix_chave: string | null
  pix_tipo: string | null
  indicacoes_ativas: number
  saldo_pendente: number
  total_apurado: number
}

type Resp = { mes: string; elegiveis: Elegivel[]; total: number }

function brl(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const TIPO_PIX_LABEL: Record<string, string> = {
  cpf: 'CPF', cnpj: 'CNPJ', email: 'Email', celular: 'Celular', aleatoria: 'Aleatória',
}

export default function AdminPagamentosPage() {
  const [data, setData] = useState<Resp | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [pagandoId, setPagandoId] = useState<string | null>(null)
  const [comprovante, setComprovante] = useState<Record<string, string>>({})
  const [copiado, setCopiado] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch('/api/admin/indicacoes-pagamentos')
      if (res.status === 403) {
        setErro('Acesso negado — apenas admin (ngseita@gmail.com).')
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error('Erro ao carregar')
      const j = await res.json() as Resp
      setData(j)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function copiarPix(chave: string, valor: number, key: string) {
    const texto = `${chave}\n${brl(valor)}`
    navigator.clipboard.writeText(texto)
    setCopiado(key)
    toast.success('PIX e valor copiados')
    setTimeout(() => setCopiado(null), 2000)
  }

  async function marcarPago(e: Elegivel) {
    if (!e.pix_chave) {
      toast.error('Afiliado sem PIX cadastrado')
      return
    }
    if (!confirm(`Confirma que pagou ${brl(e.saldo_pendente)} pra ${e.nome} (${e.pix_chave})?\n\nEsse pagamento será registrado e os eventos vão sair da fila.`)) {
      return
    }
    setPagandoId(e.user_id)
    try {
      const res = await fetch('/api/admin/indicacoes-pagamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indicador_user_id: e.user_id,
          valor_total: e.saldo_pendente,
          comprovante_url: comprovante[e.user_id] || undefined,
          observacoes: null,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error ?? 'Erro')
      toast.success(`Pagamento de ${brl(e.saldo_pendente)} registrado`)
      setComprovante(prev => { const c = { ...prev }; delete c[e.user_id]; return c })
      await carregar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar')
    } finally {
      setPagandoId(null)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 md:py-12" style={{ background: '#08080f' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            aria-label="Voltar"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-[#6b6b8a] hover:text-white hover:bg-[#1a1a2e] transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600/30 to-iara-600/20 border border-emerald-700/40 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-white">Pagamentos de Afiliados</h1>
            <p className="text-xs text-[#6b6b8a]">Indicações Iara → Iara · Pagar via PIX manual</p>
          </div>
          <button
            onClick={carregar}
            disabled={loading}
            className="flex items-center gap-2 px-3 min-h-11 rounded-xl bg-[#13131f] border border-[#1a1a2e] hover:border-iara-700/40 text-[#9b9bb5] hover:text-white text-xs transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Atualizar
          </button>
        </div>

        {erro && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-300 text-sm flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Stats */}
        {data && (
          <div className="mb-6 grid sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[#1a1a2e] bg-[#13131f] p-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#6b6b8a] font-semibold mb-2">Mês</p>
              <p className="text-lg font-bold text-white">{data.mes}</p>
            </div>
            <div className="rounded-2xl border border-emerald-700/30 bg-gradient-to-br from-emerald-950/20 to-[#13131f] p-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-semibold mb-2">Total a pagar</p>
              <p className="text-2xl font-black text-emerald-400 tabular-nums">{brl(data.total)}</p>
            </div>
            <div className="rounded-2xl border border-[#1a1a2e] bg-[#13131f] p-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#6b6b8a] font-semibold mb-2">Afiliados elegíveis</p>
              <p className="text-2xl font-black text-white tabular-nums">{data.elegiveis.length}</p>
              <p className="text-[10px] text-[#5a5a7a] mt-1">saldo ≥ R$ 50,00</p>
            </div>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-iara-400" />
          </div>
        ) : !data || data.elegiveis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center rounded-2xl border border-[#1a1a2e] bg-[#13131f]">
            <div className="w-14 h-14 rounded-2xl bg-[#0f0f1e] border border-[#1a1a2e] flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#3a3a5a]" />
            </div>
            <p className="text-sm font-semibold text-[#9b9bb5]">Nenhum afiliado elegível agora</p>
            <p className="text-xs text-[#5a5a7a] max-w-md">
              Afiliados aparecem aqui quando atingem saldo de R$ 50 e cadastram chave PIX no
              <Link href="/dashboard/indicacoes" className="text-iara-400 hover:underline mx-1">painel de indicações</Link>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.elegiveis.map(e => {
              const ehPagando = pagandoId === e.user_id
              const semPix = !e.pix_chave
              return (
                <div
                  key={e.user_id}
                  className={`rounded-2xl border p-5 ${semPix ? 'border-amber-800/40 bg-amber-950/10' : 'border-[#1a1a2e] bg-[#13131f]'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Identidade */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-white">{e.nome}</p>
                        {semPix && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-900/40 border border-amber-700/40 text-amber-300">
                            <AlertCircle className="w-3 h-3" /> sem PIX
                          </span>
                        )}
                      </div>
                      {e.email && <p className="text-xs text-[#6b6b8a] mb-2 break-all">{e.email}</p>}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#5a5a7a]">
                        <span>{e.indicacoes_ativas} indicação{e.indicacoes_ativas === 1 ? '' : 'ões'} ativa{e.indicacoes_ativas === 1 ? '' : 's'}</span>
                        <span>·</span>
                        <span>Total apurado: {brl(e.total_apurado)}</span>
                      </div>
                    </div>

                    {/* PIX + Valor */}
                    <div className="sm:text-right">
                      <p className="text-[10px] uppercase tracking-wider text-[#6b6b8a] font-semibold">Saldo pendente</p>
                      <p className="text-2xl font-black text-emerald-400 tabular-nums">{brl(e.saldo_pendente)}</p>
                      {e.pix_chave && (
                        <div className="mt-2 inline-flex flex-col sm:items-end">
                          <p className="text-[10px] text-[#6b6b8a]">PIX ({TIPO_PIX_LABEL[e.pix_tipo ?? ''] ?? e.pix_tipo}):</p>
                          <p className="text-xs font-mono text-white break-all">{e.pix_chave}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comprovante input + ações */}
                  {!semPix && (
                    <div className="mt-4 pt-4 border-t border-[#1a1a2e] flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        placeholder="URL do comprovante (opcional)"
                        value={comprovante[e.user_id] ?? ''}
                        onChange={ev => setComprovante(prev => ({ ...prev, [e.user_id]: ev.target.value }))}
                        className="flex-1 rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-3 py-2.5 text-sm text-white placeholder:text-[#3a3a5a] focus:border-iara-700/50 focus:outline-none"
                      />
                      <button
                        onClick={() => copiarPix(e.pix_chave!, e.saldo_pendente, e.user_id)}
                        className="flex items-center justify-center gap-1.5 px-3 min-h-11 rounded-xl border border-[#1a1a2e] text-[#9b9bb5] hover:text-white hover:border-iara-700/40 transition-all text-xs"
                      >
                        {copiado === e.user_id
                          ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copiado</>
                          : <><Copy className="w-3.5 h-3.5" /> Copiar PIX+Valor</>}
                      </button>
                      <button
                        onClick={() => marcarPago(e)}
                        disabled={ehPagando}
                        className="flex items-center justify-center gap-1.5 px-4 min-h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {ehPagando ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Marcar pago</>}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Helper */}
        <div className="mt-8 rounded-2xl border border-iara-700/20 bg-iara-900/10 p-4 text-xs text-[#9b9bb5] leading-relaxed">
          <p className="font-bold text-iara-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Como funciona
          </p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Copia <strong>PIX + valor</strong> do afiliado, paga manualmente no seu app/banco</li>
            <li>(Opcional) Cola URL do comprovante (Imgur, Drive, etc) pra ficar registrado</li>
            <li>Clica em <strong>Marcar pago</strong> — eventos saem da fila e o afiliado vê &ldquo;pago&rdquo; no painel dele</li>
          </ol>
          <p className="mt-3 text-[#6b6b8a]">
            <Link href="/admin/audit-log" className="text-iara-400 hover:underline inline-flex items-center gap-1">
              Ver audit log <ExternalLink className="w-3 h-3" />
            </Link>{' '}
            pra histórico completo de pagamentos.
          </p>
        </div>
      </div>
    </div>
  )
}
