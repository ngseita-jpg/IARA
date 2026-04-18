'use client'

import { useEffect, useState } from 'react'
import { History, Trash2, Loader2, X, RotateCcw, Clock } from 'lucide-react'

export type HistoricoItem = {
  id: string
  titulo: string
  parametros: Record<string, unknown>
  conteudo: unknown
  created_at: string
}

type Props = {
  tipo: 'roteiro' | 'carrossel' | 'stories' | 'thumbnail'
  aberto: boolean
  onFechar: () => void
  onCarregar: (item: HistoricoItem) => void
}

const TIPO_LABEL: Record<string, string> = {
  roteiro: 'roteiros',
  carrossel: 'carrosseis',
  stories: 'stories',
  thumbnail: 'thumbnails',
}

function formatarData(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function HistoricoPanel({ tipo, aberto, onFechar, onCarregar }: Props) {
  const [items, setItems] = useState<HistoricoItem[]>([])
  const [carregando, setCarregando] = useState(false)
  const [deletando, setDeletando] = useState<string | null>(null)

  useEffect(() => {
    if (aberto) carregarHistorico()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto])

  async function carregarHistorico() {
    setCarregando(true)
    try {
      const res = await fetch(`/api/historico?tipo=${tipo}`)
      const data = await res.json()
      setItems(data.items ?? [])
    } catch {
      // silencioso
    } finally {
      setCarregando(false)
    }
  }

  async function handleDeletar(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setDeletando(id)
    try {
      await fetch(`/api/historico?id=${id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((i) => i.id !== id))
    } finally {
      setDeletando(null)
    }
  }

  if (!aberto) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onFechar}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-[#0d0d1a] border-l border-[#1a1a2e] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a2e]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-iara-400" />
            <span className="text-sm font-semibold text-[#f1f1f8]">
              Histórico de {TIPO_LABEL[tipo]}
            </span>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-lg hover:bg-[#1a1a2e] text-[#6b6b8a] hover:text-[#f1f1f8] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          {carregando ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 text-iara-400 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-[#4a4a6a]">
              <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum {tipo} gerado ainda.</p>
              <p className="text-xs mt-1 text-[#3a3a5a]">Os próximos serão salvos automaticamente.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { onCarregar(item); onFechar() }}
                  className="group relative p-3.5 rounded-xl bg-[#0f0f20] border border-[#1a1a2e] hover:border-iara-700/40 cursor-pointer transition-all hover:bg-[#12122a]"
                >
                  <p className="text-sm font-medium text-[#e1e1f0] truncate pr-8">
                    {item.titulo}
                  </p>
                  {item.parametros && Object.keys(item.parametros).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(item.parametros).slice(0, 3).map(([k, v]) =>
                        v ? (
                          <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a2e] text-[#6b6b8a] border border-[#2a2a4a]">
                            {String(v).slice(0, 24)}
                          </span>
                        ) : null
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-[#4a4a6a]">
                    <Clock className="w-3 h-3" />
                    {formatarData(item.created_at)}
                  </div>

                  {/* Ações */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      title="Carregar"
                      onClick={(e) => { e.stopPropagation(); onCarregar(item); onFechar() }}
                      className="p-1 rounded-lg bg-iara-900/60 hover:bg-iara-700/50 text-iara-400 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                    <button
                      title="Remover do histórico"
                      onClick={(e) => handleDeletar(item.id, e)}
                      disabled={deletando === item.id}
                      className="p-1 rounded-lg bg-red-950/60 hover:bg-red-800/40 text-red-400/70 hover:text-red-400 transition-colors"
                    >
                      {deletando === item.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Trash2 className="w-3 h-3" />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[#1a1a2e]">
          <p className="text-xs text-[#3a3a5a] text-center">
            Últimos 30 · Salvo automaticamente após cada geração
          </p>
        </div>
      </div>
    </>
  )
}

// Hook helper para salvar no histórico — retorna pontos_ganhos ou 0
export async function salvarHistorico(
  tipo: string,
  titulo: string,
  conteudo: unknown,
  parametros?: Record<string, unknown>
): Promise<number> {
  try {
    const res = await fetch('/api/historico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, titulo, conteudo, parametros }),
    })
    if (res.ok) {
      const data = await res.json()
      return data.pontos_ganhos ?? 0
    }
  } catch {
    // silencioso — histórico não pode quebrar o fluxo principal
  }
  return 0
}
