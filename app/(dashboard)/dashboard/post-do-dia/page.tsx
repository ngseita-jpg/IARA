'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sparkles, Loader2, Sun, Copy, Check, Download, AlertCircle, RefreshCw,
} from 'lucide-react'

type Slide = {
  numero: number
  tipo: 'capa' | 'desenvolvimento' | 'cta'
  titulo: string
  texto: string
  descricao_imagem: string | null
  imagem_url?: string
}

type Post = {
  id: string
  data: string
  tema: string
  slides_json: Slide[]
  legenda: string
  hashtags: string[]
  imagens_geradas: number
}

export default function PostDoDiaPage() {
  const [post, setPost] = useState<Post | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [copiouLegenda, setCopiouLegenda] = useState(false)
  const [copiouTags, setCopiouTags] = useState(false)
  const [planoFree, setPlanoFree] = useState(false)

  const carregarHoje = useCallback(async () => {
    try {
      const res = await fetch('/api/post-do-dia')
      if (res.ok) {
        const data = await res.json()
        if (data.post) setPost(data.post)
      }
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregarHoje() }, [carregarHoje])

  async function gerar() {
    setGerando(true)
    setErro(null)
    try {
      const res = await fetch('/api/post-do-dia/gerar', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        if (data.cta === 'upgrade') setPlanoFree(true)
        setErro(data.error ?? 'Erro ao gerar')
        return
      }
      setPost(data.post)
    } catch {
      setErro('Erro de rede')
    } finally {
      setGerando(false)
    }
  }

  async function copiar(texto: string, qual: 'legenda' | 'tags') {
    await navigator.clipboard.writeText(texto)
    if (qual === 'legenda') {
      setCopiouLegenda(true)
      setTimeout(() => setCopiouLegenda(false), 1800)
    } else {
      setCopiouTags(true)
      setTimeout(() => setCopiouTags(false), 1800)
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-iara-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08080f] pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Post do Dia</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Carrossel pronto pra postar hoje — texto, imagens e legenda gerados pela Iara, alinhados com seu Brand Kit.
          </p>
        </div>

        {/* CTA upgrade pra plano free */}
        {planoFree && (
          <div className="iara-card p-6 border border-iara-600/50 mb-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-iara-400 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-1">Disponível no Plus, Premium ou Profissional</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Post do Dia gera carrossel completo (texto + imagens IA + legenda) automaticamente. Faz parte dos planos pagos.
                </p>
                <a
                  href="/conta"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-iara-600 to-iara-400 rounded-lg text-white text-sm font-medium hover:opacity-90 transition"
                >
                  Ver planos
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Erro */}
        {erro && !planoFree && (
          <div className="iara-card p-4 border border-red-500/40 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div className="text-red-300 text-sm">{erro}</div>
          </div>
        )}

        {/* Estado vazio + botão */}
        {!post && !planoFree && (
          <div className="iara-card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-iara-600 to-iara-400 flex items-center justify-center">
              <Sun className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Acorde sabendo o que postar</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              Toca aqui e a Iara gera 5 slides de carrossel personalizados — com imagens IA no estilo do seu Brand Kit, legenda e hashtags prontas.
            </p>
            <button
              onClick={gerar}
              disabled={gerando}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {gerando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando seu post...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Gerar post de hoje
                </>
              )}
            </button>
            {gerando && (
              <p className="text-gray-500 text-xs mt-4">
                Pode levar até 60s — IA escrevendo + 3 imagens FLUX renderizando.
              </p>
            )}
          </div>
        )}

        {/* Post gerado */}
        {post && (
          <div className="space-y-6">
            {/* Tema + regerar */}
            <div className="iara-card p-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tema do dia</div>
                <h2 className="text-xl font-bold text-white">{post.tema}</h2>
                <div className="text-xs text-gray-500 mt-1">
                  {post.imagens_geradas} {post.imagens_geradas === 1 ? 'imagem gerada' : 'imagens geradas'} · {post.slides_json.length} slides
                </div>
              </div>
            </div>

            {/* Slides em grid */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Slides</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {post.slides_json.map((slide) => (
                  <SlideCard key={slide.numero} slide={slide} />
                ))}
              </div>
            </div>

            {/* Legenda */}
            <div className="iara-card p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-300">Legenda</h3>
                <button
                  onClick={() => copiar(post.legenda, 'legenda')}
                  className="inline-flex items-center gap-1.5 text-xs text-iara-400 hover:text-iara-600 transition"
                >
                  {copiouLegenda ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiouLegenda ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="text-gray-200 text-sm whitespace-pre-wrap">{post.legenda}</p>
            </div>

            {/* Hashtags */}
            <div className="iara-card p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-300">Hashtags</h3>
                <button
                  onClick={() => copiar(post.hashtags.map(t => `#${t}`).join(' '), 'tags')}
                  className="inline-flex items-center gap-1.5 text-xs text-iara-400 hover:text-iara-600 transition"
                >
                  {copiouTags ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiouTags ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {post.hashtags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-md bg-iara-600/20 text-iara-400 text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Já gerei hoje */}
            <div className="text-center text-xs text-gray-500 pt-4">
              Você já gerou seu post de hoje. Volta amanhã pra um novo!
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SlideCard({ slide }: { slide: Slide }) {
  return (
    <div className="iara-card overflow-hidden">
      <div className="aspect-square bg-[#1a1a2a] relative flex items-center justify-center p-3">
        {slide.imagem_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.imagem_url}
            alt={slide.titulo}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-iara-600/40 to-iara-400/20" />
        )}
        <div className="relative text-center z-10">
          <div className="text-[10px] uppercase tracking-widest text-white/60 mb-1">
            {slide.numero}/5 · {slide.tipo}
          </div>
          <div className="text-white text-sm font-bold leading-tight drop-shadow-lg">
            {slide.titulo}
          </div>
        </div>
      </div>
      <div className="p-3">
        <p className="text-gray-300 text-xs leading-relaxed line-clamp-4">{slide.texto}</p>
      </div>
    </div>
  )
}
