'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert, Loader2, AlertTriangle, Activity } from 'lucide-react'

type Suspeito = {
  user_id: string
  email: string | null
  eventos: string[]
  count: number
  ultimo: string
  plano: string | null
}

type HeavyUser = { user_id: string; geracoes_7d: number }

export default function AdminSuspeitosPage() {
  const [data, setData] = useState<{
    rate_limit_suspeitos: Suspeito[]
    heavy_users_7d: HeavyUser[]
    janela: string
    gerado_em: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/suspeitos')
      .then(async r => {
        if (r.status === 403) { setErro('Acesso restrito a admin.'); return null }
        if (!r.ok) { setErro(`Erro ${r.status}`); return null }
        return r.json()
      })
      .then(d => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#08080f] text-[#f1f1f8]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-[#6b6b8a] hover:text-iara-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar pro painel admin
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-red-950/40 border border-red-800/40 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold">Suspeitos & abuso</h1>
        </div>
        <p className="text-sm text-[#6b6b8a] mb-8">
          Janela: últimos 7 dias · gerado em {data ? new Date(data.gerado_em).toLocaleString('pt-BR') : '...'}
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-[#6b6b8a] py-12 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando suspeitos...
          </div>
        )}

        {erro && (
          <div className="rounded-xl border border-red-800/40 bg-red-950/30 p-4 text-sm text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {erro}
          </div>
        )}

        {data && !loading && (
          <>
            {/* Rate limit hits */}
            <section className="mb-10">
              <h2 className="text-sm font-bold text-amber-400 mb-3 uppercase tracking-wider">
                Rate-limit / cupom inválido / limite atingido
              </h2>
              <p className="text-xs text-[#6b6b8a] mb-4">
                {data.rate_limit_suspeitos.length} contas com eventos suspeitos. Investigue antes de banir.
              </p>
              {data.rate_limit_suspeitos.length === 0 ? (
                <p className="text-sm text-[#5a5a7a] italic">Nenhum suspeito no período. ✓</p>
              ) : (
                <div className="space-y-2">
                  {data.rate_limit_suspeitos.map((s) => (
                    <div key={s.user_id} className="rounded-xl border border-[#1a1a2e] bg-[#13131f] p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{s.email ?? 'sem email'}</p>
                        <p className="text-[10px] font-mono text-[#5a5a7a] truncate">{s.user_id}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {s.eventos.map(e => (
                            <span key={e} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/30 border border-amber-800/40 text-amber-300">{e}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-2xl font-black text-amber-400">{s.count}</p>
                        <p className="text-[10px] text-[#5a5a7a]">hits</p>
                        <p className="text-[10px] text-[#5a5a7a] mt-1 capitalize">{s.plano ?? 'free'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Heavy users */}
            <section>
              <h2 className="text-sm font-bold text-iara-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Volume anormal (≥50 gerações em 7d)
              </h2>
              <p className="text-xs text-[#6b6b8a] mb-4">
                Pode ser uso legítimo intenso ou compartilhamento. Cruza com IPs/dispositivos antes de agir.
              </p>
              {data.heavy_users_7d.length === 0 ? (
                <p className="text-sm text-[#5a5a7a] italic">Ninguém com uso anormal. ✓</p>
              ) : (
                <div className="space-y-2">
                  {data.heavy_users_7d.map(h => (
                    <div key={h.user_id} className="rounded-xl border border-[#1a1a2e] bg-[#13131f] p-3 flex items-center justify-between">
                      <p className="text-[11px] font-mono text-[#9b9bb5] truncate">{h.user_id}</p>
                      <p className="text-sm font-bold text-iara-400">{h.geracoes_7d} gerações</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
