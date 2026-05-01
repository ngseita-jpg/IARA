'use client'

import { useEffect, useState, useCallback } from 'react'
import { Shield, Loader2, RefreshCw, Filter, X, AlertTriangle, ChevronDown } from 'lucide-react'
import Link from 'next/link'

type Evento = {
  id: number
  user_id: string | null
  evento: string
  ip: string | null
  user_agent: string | null
  rota: string | null
  status_http: number | null
  meta: Record<string, unknown> | null
  created_at: string
}

type Stats = { evento: string; count: number }

const COR_EVENTO: Record<string, { bg: string; border: string; text: string }> = {
  signup:                       { bg: 'bg-emerald-950/30', border: 'border-emerald-900/40', text: 'text-emerald-400' },
  checkout_iniciado:            { bg: 'bg-iara-900/30',    border: 'border-iara-700/40',    text: 'text-iara-300' },
  checkout_completo:            { bg: 'bg-emerald-950/30', border: 'border-emerald-900/40', text: 'text-emerald-400' },
  plano_alterado:               { bg: 'bg-iara-900/30',    border: 'border-iara-700/40',    text: 'text-iara-300' },
  conta_deletada:               { bg: 'bg-red-950/30',     border: 'border-red-900/40',     text: 'text-red-400' },
  delete_account_senha_invalida:{ bg: 'bg-amber-950/30',   border: 'border-amber-900/40',   text: 'text-amber-400' },
  rate_limit_atingido:          { bg: 'bg-amber-950/30',   border: 'border-amber-900/40',   text: 'text-amber-400' },
  login_ok:                     { bg: 'bg-emerald-950/30', border: 'border-emerald-900/40', text: 'text-emerald-400' },
  login_falha:                  { bg: 'bg-red-950/30',     border: 'border-red-900/40',     text: 'text-red-400' },
  senha_alterada:               { bg: 'bg-amber-950/30',   border: 'border-amber-900/40',   text: 'text-amber-400' },
  afiliado_suspeito_flagged:    { bg: 'bg-amber-950/30',   border: 'border-amber-900/40',   text: 'text-amber-400' },
}

const corEvento = (e: string) => COR_EVENTO[e] ?? { bg: 'bg-[#0f0f1e]', border: 'border-[#1a1a2e]', text: 'text-[#9b9bb5]' }

function fmtData(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function AuditLogPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [stats, setStats] = useState<Stats[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtroEvento, setFiltroEvento] = useState('')
  const [filtroIp, setFiltroIp] = useState('')
  const [filtroUserId, setFiltroUserId] = useState('')
  const [expandida, setExpandida] = useState<number | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const params = new URLSearchParams()
      if (filtroEvento) params.set('evento', filtroEvento)
      if (filtroIp)     params.set('ip', filtroIp)
      if (filtroUserId) params.set('user_id', filtroUserId)
      const res = await fetch(`/api/admin/audit-log?${params}`)
      if (res.status === 403) {
        setErro('Acesso negado — apenas admin.')
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error('Erro ao carregar')
      const data = await res.json()
      setEventos(data.eventos ?? [])
      setStats(data.stats_7dias ?? [])
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }, [filtroEvento, filtroIp, filtroUserId])

  useEffect(() => { carregar() }, [carregar])

  function limparFiltros() {
    setFiltroEvento('')
    setFiltroIp('')
    setFiltroUserId('')
  }

  const temFiltro = filtroEvento || filtroIp || filtroUserId

  return (
    <div className="min-h-screen px-4 py-8 md:py-12" style={{ background: '#08080f' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-iara-600/30 to-accent-purple/20 border border-iara-700/40 flex items-center justify-center">
            <Shield className="w-5 h-5 text-iara-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Audit Log</h1>
            <p className="text-xs text-[#6b6b8a]">Eventos sensíveis dos últimos 90 dias</p>
          </div>
          <button
            onClick={carregar}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#13131f] border border-[#1a1a2e] hover:border-iara-700/40 text-[#9b9bb5] hover:text-white text-xs transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Atualizar
          </button>
        </div>

        {erro && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-300 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Stats top eventos 7 dias */}
        {!erro && stats.length > 0 && (
          <div className="mb-6 rounded-2xl border border-[#1a1a2e] bg-[#0a0a14] p-5">
            <p className="text-[10px] tracking-[0.3em] uppercase font-semibold text-[#6b6b8a] mb-3">Top eventos · últimos 7 dias</p>
            <div className="flex flex-wrap gap-2">
              {stats.map(s => {
                const c = corEvento(s.evento)
                return (
                  <button
                    key={s.evento}
                    onClick={() => setFiltroEvento(s.evento === filtroEvento ? '' : s.evento)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${c.bg} ${c.border} ${c.text} ${
                      filtroEvento === s.evento ? 'ring-1 ring-white/20' : 'hover:opacity-80'
                    }`}
                  >
                    {s.evento} <span className="opacity-60">· {s.count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-6 rounded-2xl border border-[#1a1a2e] bg-[#0a0a14] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-3.5 h-3.5 text-[#6b6b8a]" />
            <p className="text-xs font-semibold text-[#9b9bb5]">Filtros</p>
            {temFiltro && (
              <button onClick={limparFiltros} className="ml-auto text-xs text-iara-400 hover:text-iara-300 flex items-center gap-1">
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#6b6b8a] mb-1.5">Evento</label>
              <input
                value={filtroEvento}
                onChange={e => setFiltroEvento(e.target.value)}
                placeholder="ex: checkout_completo"
                className="w-full rounded-lg bg-[#0f0f1e] border border-[#1a1a2e] px-3 py-2 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-700/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#6b6b8a] mb-1.5">IP</label>
              <input
                value={filtroIp}
                onChange={e => setFiltroIp(e.target.value)}
                placeholder="ex: 192.168.1.1"
                className="w-full rounded-lg bg-[#0f0f1e] border border-[#1a1a2e] px-3 py-2 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-700/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#6b6b8a] mb-1.5">User ID</label>
              <input
                value={filtroUserId}
                onChange={e => setFiltroUserId(e.target.value)}
                placeholder="UUID do usuário"
                className="w-full rounded-lg bg-[#0f0f1e] border border-[#1a1a2e] px-3 py-2 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-700/40 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Lista eventos */}
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#13131f] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1a1a2e] flex items-center justify-between">
            <p className="text-xs font-semibold text-[#9b9bb5]">
              {loading ? 'Carregando…' : `${eventos.length} evento${eventos.length === 1 ? '' : 's'}`}
            </p>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-iara-400" />
            </div>
          ) : eventos.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-[#6b6b8a]">Nenhum evento encontrado</p>
              {temFiltro && (
                <button onClick={limparFiltros} className="mt-2 text-xs text-iara-400 hover:underline">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#1a1a2e]">
              {eventos.map(ev => {
                const c = corEvento(ev.evento)
                const aberto = expandida === ev.id
                return (
                  <div key={ev.id} className="p-4 hover:bg-[#0f0f1e]/50 transition-colors">
                    <button
                      onClick={() => setExpandida(aberto ? null : ev.id)}
                      className="w-full flex items-start gap-3 text-left"
                    >
                      <span className={`px-2 py-1 rounded-md border text-[10px] font-bold whitespace-nowrap flex-shrink-0 ${c.bg} ${c.border} ${c.text}`}>
                        {ev.evento}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#9b9bb5] font-mono truncate">
                          {ev.rota ?? '—'} {ev.status_http ? `· ${ev.status_http}` : ''}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-[#5a5a7a]">
                          <span>{fmtData(ev.created_at)}</span>
                          {ev.ip && <span className="font-mono">· {ev.ip}</span>}
                          {ev.user_id && <span className="font-mono truncate">· {ev.user_id.slice(0, 8)}…</span>}
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-[#3a3a5a] flex-shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`} />
                    </button>
                    {aberto && (
                      <div className="mt-3 ml-2 pl-4 border-l border-[#1a1a2e] space-y-2">
                        {ev.user_id && (
                          <div className="text-xs">
                            <span className="text-[#6b6b8a]">User ID:</span>{' '}
                            <button
                              onClick={() => setFiltroUserId(ev.user_id!)}
                              className="font-mono text-iara-400 hover:underline"
                            >{ev.user_id}</button>
                          </div>
                        )}
                        {ev.ip && (
                          <div className="text-xs">
                            <span className="text-[#6b6b8a]">IP:</span>{' '}
                            <button
                              onClick={() => setFiltroIp(ev.ip!)}
                              className="font-mono text-iara-400 hover:underline"
                            >{ev.ip}</button>
                          </div>
                        )}
                        {ev.user_agent && (
                          <div className="text-xs">
                            <span className="text-[#6b6b8a]">User-Agent:</span>{' '}
                            <span className="font-mono text-[#9b9bb5]">{ev.user_agent}</span>
                          </div>
                        )}
                        {ev.meta && Object.keys(ev.meta).length > 0 && (
                          <div className="text-xs">
                            <span className="text-[#6b6b8a]">Meta:</span>
                            <pre className="mt-1 p-3 rounded-lg bg-[#08080f] border border-[#1a1a2e] text-[#9b9bb5] font-mono text-[11px] overflow-x-auto">
{JSON.stringify(ev.meta, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/dashboard" className="text-xs text-[#6b6b8a] hover:text-iara-400 transition-colors">
            ← Voltar pro dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
