'use client'

import { useEffect, useState } from 'react'
import { Download, Heart, MessageCircle, RefreshCw, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react'

type Post = {
  id: string
  ig_post_id: string
  permalink: string | null
  media_type: string | null
  thumbnail_url: string | null
  caption: string | null
  posted_at: string | null
  like_count: number
  comments_count: number
}

type Conexao = {
  posts_importados_em: string | null
  token_expires_at: string | null
  platform_username: string | null
} | null

export function InstagramPostsImportados() {
  const [posts, setPosts] = useState<Post[]>([])
  const [conexao, setConexao] = useState<Conexao>(null)
  const [loading, setLoading] = useState(true)
  const [importando, setImportando] = useState(false)
  const [msg, setMsg] = useState<{ texto: string; tipo: 'ok' | 'erro' | 'aviso' } | null>(null)

  async function carregar() {
    try {
      const res = await fetch('/api/instagram/importar-posts')
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts ?? [])
        setConexao(data.conexao ?? null)
      }
    } finally {
      setLoading(false)
    }
  }

  async function importar() {
    setImportando(true)
    setMsg(null)
    try {
      const res = await fetch('/api/instagram/importar-posts', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMsg({ texto: data.msg ?? 'Posts importados!', tipo: 'ok' })
        await carregar()
      } else if (data.rate_limited) {
        setMsg({ texto: data.error, tipo: 'aviso' })
      } else if (data.expirado) {
        setMsg({ texto: 'Sua conexão expirou. Vá no card acima e reconecte o Instagram.', tipo: 'erro' })
      } else if (data.setup_pendente) {
        setMsg({ texto: 'Setup pendente no servidor. Avise o suporte.', tipo: 'erro' })
      } else {
        setMsg({ texto: data.error ?? 'Falha ao importar.', tipo: 'erro' })
      }
    } catch {
      setMsg({ texto: 'Falha de conexão. Tente em alguns minutos.', tipo: 'erro' })
    } finally {
      setImportando(false)
      setTimeout(() => setMsg(null), 6000)
    }
  }

  useEffect(() => { carregar() }, [])

  // So aparece se o user tem Instagram conectado
  if (loading) return null
  if (!conexao) return null

  const ultimaImport = conexao.posts_importados_em
    ? new Date(conexao.posts_importados_em).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null

  // Posts ordenados por engajamento (curtidas + comentarios) pra UI mostrar os top
  const ordenados = [...posts].sort(
    (a, b) => (b.like_count + b.comments_count * 5) - (a.like_count + a.comments_count * 5),
  )

  return (
    <div className="iara-card p-5 mb-8 border border-pink-800/30 bg-gradient-to-br from-pink-950/10 to-purple-950/10">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-[#f1f1f8] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
            Posts importados do Instagram
            {conexao.platform_username && (
              <span className="text-xs text-[#9b9bb5] font-normal">@{conexao.platform_username}</span>
            )}
          </h3>
          <p className="text-xs text-[#9b9bb5] mt-1">
            {posts.length > 0
              ? `${posts.length} posts no cache. Iara usa esses dados pra entender seu padrão de conteúdo que bomba.`
              : 'Importe seus últimos posts pra Iara analisar padrões de engajamento.'}
            {ultimaImport && <span className="text-[#5a5a7a]"> · Última: {ultimaImport}</span>}
          </p>
        </div>
        <button
          onClick={importar}
          disabled={importando}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-600/20 border border-pink-600/40 text-pink-300 text-xs font-medium hover:bg-pink-600/30 disabled:opacity-50 transition-colors"
        >
          {importando ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          {importando ? 'Importando...' : posts.length > 0 ? 'Atualizar' : 'Importar agora'}
        </button>
      </div>

      {msg && (
        <div className={`mb-4 flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
          msg.tipo === 'ok' ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/30'
            : msg.tipo === 'aviso' ? 'bg-amber-900/30 text-amber-300 border border-amber-700/30'
            : 'bg-red-900/30 text-red-300 border border-red-700/30'
        }`}>
          {msg.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <span>{msg.texto}</span>
        </div>
      )}

      {posts.length > 0 && (
        <>
          <p className="text-[10px] uppercase tracking-wider text-[#5a5a7a] font-bold mb-2">Top engajamento</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {ordenados.slice(0, 12).map((p) => (
              <a
                key={p.id}
                href={p.permalink ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-lg overflow-hidden bg-[#0a0a14] border border-[#1a1a2e] hover:border-pink-600/40 transition-colors"
                title={p.caption ?? ''}
              >
                {p.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#5a5a7a] text-xs">
                    {p.media_type ?? 'post'}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-white">
                    <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" />{formatNum(p.like_count)}</span>
                    <span className="flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5" />{formatNum(p.comments_count)}</span>
                  </div>
                </div>
                <ExternalLink className="absolute top-1 right-1 w-3 h-3 text-white/0 group-hover:text-white/80 transition-colors" />
              </a>
            ))}
          </div>
          {posts.length > 12 && (
            <p className="text-[11px] text-[#5a5a7a] mt-2">
              + {posts.length - 12} outros posts no cache (Iara analisa todos).
            </p>
          )}
        </>
      )}
    </div>
  )
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}
