'use client'

import { useState } from 'react'
import { Eye, X, Smartphone, Monitor } from 'lucide-react'
import { useModalA11y } from '@/hooks/useModalA11y'

type Modo = 'youtube_desktop' | 'youtube_mobile' | 'instagram_feed'

const MODOS: { id: Modo; label: string; icon: React.ElementType }[] = [
  { id: 'youtube_desktop', label: 'YouTube Desktop', icon: Monitor },
  { id: 'youtube_mobile',  label: 'YouTube Mobile',  icon: Smartphone },
  { id: 'instagram_feed',  label: 'Instagram Feed',  icon: Smartphone },
]

/**
 * Botão "Ver em mockup" — abre modal mostrando a thumbnail dentro
 * de uma simulação visual de feed (YouTube ou Instagram).
 *
 * Útil pra validar contraste, legibilidade e impacto antes de publicar.
 */
export function ThumbnailMockupButton({ thumbnailPng, tituloVideo }: {
  thumbnailPng: string
  tituloVideo: string
}) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        aria-label="Ver em mockup"
        title="Ver como aparece no feed"
        className="flex items-center gap-2 px-4 min-h-11 rounded-xl border border-[#1a1a2e] text-[#9b9bb5] text-sm font-medium hover:border-iara-700/40 hover:text-white transition-all"
      >
        <Eye className="w-4 h-4" />
        Ver em mockup
      </button>

      {aberto && (
        <MockupModal
          thumbnailPng={thumbnailPng}
          tituloVideo={tituloVideo}
          onClose={() => setAberto(false)}
        />
      )}
    </>
  )
}

function MockupModal({
  thumbnailPng, tituloVideo, onClose,
}: {
  thumbnailPng: string
  tituloVideo: string
  onClose: () => void
}) {
  const [modo, setModo] = useState<Modo>('youtube_desktop')

  useModalA11y(true, onClose)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full sm:max-w-3xl max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#1a1a2e] bg-[#0e0e1e] shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-10 w-11 h-11 flex items-center justify-center rounded-xl text-[#6b6b8a] hover:text-white hover:bg-[#1a1a2e]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 border-b border-[#1a1a2e]">
          <h2 className="text-base font-bold text-white mb-1">Como vai aparecer no feed</h2>
          <p className="text-xs text-[#6b6b8a]">Mockup pra você validar legibilidade e impacto antes de publicar.</p>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-[#1a1a2e]">
          {MODOS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setModo(id)}
              className={`flex items-center gap-1.5 px-4 min-h-11 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                modo === id
                  ? 'text-iara-300 border-iara-500'
                  : 'text-[#6b6b8a] border-transparent hover:text-[#9b9bb5]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {modo === 'youtube_desktop' && (
            <YouTubeDesktop png={thumbnailPng} titulo={tituloVideo} />
          )}
          {modo === 'youtube_mobile' && (
            <YouTubeMobile png={thumbnailPng} titulo={tituloVideo} />
          )}
          {modo === 'instagram_feed' && (
            <InstagramFeed png={thumbnailPng} titulo={tituloVideo} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Mockups ───────────────────────────────────────────────────────────────────

function YouTubeDesktop({ png, titulo }: { png: string; titulo: string }) {
  return (
    <div className="bg-[#0f0f0f] rounded-xl p-4 sm:p-6">
      <p className="text-[10px] uppercase tracking-wider text-[#5a5a5a] mb-3">Sugestões de vídeo</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Sua thumb destacada */}
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={png} alt="Sua thumbnail" className="w-full aspect-video rounded-xl object-cover" />
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-iara-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white line-clamp-2 leading-snug">{titulo || 'Seu título aqui'}</p>
              <p className="text-xs text-[#a8a8a8] mt-1">Seu canal · 12 mil visualizações · 2 horas atrás</p>
            </div>
          </div>
        </div>
        {/* Mock concorrentes (placeholder) */}
        {[1, 2].map(i => (
          <div key={i} className="space-y-2 opacity-50">
            <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a]" />
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-[#2a2a2a] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-3 bg-[#2a2a2a] rounded w-3/4 mb-2" />
                <div className="h-2 bg-[#1a1a1a] rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function YouTubeMobile({ png, titulo }: { png: string; titulo: string }) {
  return (
    <div className="max-w-sm mx-auto bg-[#0f0f0f] rounded-3xl p-3 border border-[#1a1a1a]">
      {/* Frame de celular */}
      <div className="rounded-2xl overflow-hidden">
        {/* Header app */}
        <div className="bg-[#0f0f0f] px-3 py-2 flex items-center gap-2">
          <span className="text-red-500 font-black text-base">▶</span>
          <span className="text-white font-bold text-sm">YouTube</span>
        </div>

        {/* Sua thumb em destaque */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={png} alt="Sua thumbnail" className="w-full aspect-video object-cover" />
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">12:34</span>
        </div>

        <div className="p-3 flex gap-2">
          <div className="w-8 h-8 rounded-full bg-iara-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white line-clamp-2 leading-snug">{titulo || 'Seu título'}</p>
            <p className="text-xs text-[#a8a8a8] mt-1">Seu canal · 2h atrás</p>
          </div>
        </div>

        {/* Mock vídeo seguinte */}
        <div className="border-t border-[#1a1a1a] opacity-50">
          <div className="aspect-video bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a]" />
          <div className="p-3 flex gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2a2a2a]" />
            <div className="flex-1">
              <div className="h-3 bg-[#2a2a2a] rounded w-4/5 mb-1.5" />
              <div className="h-2 bg-[#1a1a1a] rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InstagramFeed({ png, titulo }: { png: string; titulo: string }) {
  return (
    <div className="max-w-sm mx-auto bg-black rounded-3xl p-3 border border-[#1a1a1a]">
      <div className="rounded-2xl overflow-hidden bg-black">
        {/* Header app */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-[#1a1a1a]">
          <span className="text-white font-bold text-base" style={{ fontFamily: 'cursive' }}>Instagram</span>
          <div className="flex gap-3 text-white text-base">♡ ✉</div>
        </div>

        {/* Header do post */}
        <div className="px-3 py-2.5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-iara-500 to-accent-purple p-0.5">
            <div className="w-full h-full rounded-full bg-iara-600" />
          </div>
          <p className="text-sm font-bold text-white">seu_perfil</p>
          <span className="text-[#737373] text-xs">·</span>
          <p className="text-xs text-[#737373]">2h</p>
        </div>

        {/* A thumbnail (em IG geralmente é quadrada — vamos cropar) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={png} alt="Post" className="w-full aspect-video object-cover" />

        {/* Bottom actions */}
        <div className="p-3">
          <div className="flex gap-3 mb-2 text-white text-xl">
            ♡ 💬 ↗ <span className="ml-auto">⊞</span>
          </div>
          <p className="text-sm text-white"><span className="font-bold">seu_perfil</span> {titulo || 'Seu título aqui'}</p>
          <p className="text-xs text-[#737373] mt-1">ver todos os 124 comentários</p>
        </div>
      </div>
    </div>
  )
}
