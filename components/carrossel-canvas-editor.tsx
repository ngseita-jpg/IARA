'use client'

/**
 * Editor visual tipo Canva para carrosseis.
 * - Cada layer (texto/foto/shape) é arrastável e redimensionável
 * - Inspector lateral permite edição rica (fonte, cor, tamanho, etc)
 * - Clicar duas vezes num texto entra em modo edição in-place
 * - Selecionar uma palavra e mudar só ela (formatação por run)
 * - Undo/Redo com atalhos Ctrl+Z / Ctrl+Shift+Z
 * - Export final: renderiza no canvas escondido em 1080×1080 e baixa PNG
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  X, Type, Palette, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Undo2, Redo2, Download, Trash2, Copy,
  ChevronLeft, ChevronRight, Plus, Eye,
  ArrowUp, ArrowDown, Share2, Loader2,
} from 'lucide-react'
import {
  type Slide2, type Layer, type TextLayer, type PhotoLayer, type Run,
  newId, runsToText,
} from '@/lib/carrossel-canvas-types'
import {
  preloadImages, renderSlide2, canvasToBlob, type ImageCache, CANVAS_SIZE,
} from '@/lib/carrossel-canvas-renderer'
import {
  FONTES as CATALOGO_FONTES, CATEGORIAS, buildGoogleFontsUrl, ensureFontsLoaded,
  cssFamilyFor, type CategoriaFonte,
} from '@/lib/carrossel-fontes'

// ─── Paleta 50 cores (compartilhada) ─────────────────────────────────────
const CORES_50 = [
  '#ffffff', '#f8f5f0', '#e8e0d5', '#d4c9b8', '#9ca3af', '#4b5563',
  '#000000', '#08080f', '#1a1a2e', '#2a2a3e', '#475569', '#6b7280',
  '#e2c068', '#c9a84c', '#f59e0b', '#fb923c', '#ff6b00', '#fb7185',
  '#ec4899', '#f9a8d4', '#fbcfe8', '#d946ef', '#a855f7', '#7e22ce',
  '#c4b5fd', '#ddd6fe', '#6366f1', '#3b82f6', '#2563eb', '#1e3a8a',
  '#bfdbfe', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#65a30d',
  '#4ade80', '#bef264', '#a7f3d0', '#bbf7d0', '#fbbf24', '#ca8a04',
  '#a34f3c', '#78350f', '#4a2617', '#7f1d1d', '#ef4444', '#dc2626',
  '#f87171', '#fdba74',
]

// URL única do Google Fonts que carrega todo o catálogo em 1 request
const GOOGLE_FONTS_URL = buildGoogleFontsUrl()

type Props = {
  slides: Slide2[]
  imagensBase64: string[]              // array base64 das imagens originais
  onFechar: () => void
  onSalvar?: (slides: Slide2[]) => void  // callback pra persistir mudanças
  watermark?: boolean
}

export function CarrosselCanvasEditor({ slides: slidesInit, imagensBase64, onFechar, onSalvar, watermark = false }: Props) {
  // ─── State ─────────────────────────────────────────────────────────
  const [slides, setSlides] = useState<Slide2[]>(slidesInit)
  const [slideIdx, setSlideIdx] = useState(0)
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)   // texto em modo edição in-place
  const [imageCache, setImageCache] = useState<ImageCache>(new Map())
  const [imagensCache, setImagensCache] = useState<string[]>([])            // dataURLs pra exibição HTML
  const [exportando, setExportando] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Histórico (undo/redo)
  const [history, setHistory] = useState<Slide2[][]>([slidesInit])
  const [historyIdx, setHistoryIdx] = useState(0)
  const hydrating = useRef(false)

  // Drag state
  const [dragState, setDragState] = useState<{
    layerId: string; startX: number; startY: number;
    origX: number; origY: number; origW: number; origH: number;
    mode: 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br'
  } | null>(null)

  // Canvas display size — RESPONSIVO: medido do container via ResizeObserver.
  // Fallback inicial: 520px desktop, ajusta no primeiro layout.
  const stageContainerRef = useRef<HTMLDivElement>(null)
  const [canvasDisplaySize, setCanvasDisplaySize] = useState(520)

  useEffect(() => {
    if (!stageContainerRef.current) return
    const el = stageContainerRef.current

    const measure = () => {
      const rect = el.getBoundingClientRect()
      // Subtraímos padding interno e bottom-bar de navegação (~80px no mobile)
      const padding = 32
      const reservedBottom = 80
      const available = Math.min(rect.width - padding, rect.height - reservedBottom)
      // Mín 280 (extra-small phones), max 720 (não fica monstruoso em desktops largos)
      const next = Math.max(280, Math.min(720, available))
      setCanvasDisplaySize(Math.floor(next))
    }
    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('orientationchange', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('orientationchange', measure)
    }
  }, [])

  const slide = slides[slideIdx]
  const selectedLayer = slide?.layers.find(l => l.id === selectedLayerId) ?? null

  // ─── Pre-load imagens ─────────────────────────────────────────────
  useEffect(() => {
    let alive = true
    ;(async () => {
      const cache = await preloadImages(imagensBase64)
      if (!alive) return
      setImageCache(cache)
      setImagensCache(imagensBase64.map(b => b.startsWith('data:') ? b : `data:image/jpeg;base64,${b}`))
    })()
    return () => { alive = false }
  }, [imagensBase64])

  // ─── Undo/Redo ────────────────────────────────────────────────────
  const pushHistory = useCallback((next: Slide2[]) => {
    if (hydrating.current) return
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIdx + 1)
      trimmed.push(JSON.parse(JSON.stringify(next)))
      // limite de 30 estados
      return trimmed.slice(-30)
    })
    setHistoryIdx(prev => Math.min(prev + 1, 29))
  }, [historyIdx])

  const undo = useCallback(() => {
    if (historyIdx === 0) return
    hydrating.current = true
    const prev = history[historyIdx - 1]
    setSlides(JSON.parse(JSON.stringify(prev)))
    setHistoryIdx(historyIdx - 1)
    setTimeout(() => { hydrating.current = false }, 0)
  }, [historyIdx, history])

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return
    hydrating.current = true
    const next = history[historyIdx + 1]
    setSlides(JSON.parse(JSON.stringify(next)))
    setHistoryIdx(historyIdx + 1)
    setTimeout(() => { hydrating.current = false }, 0)
  }, [historyIdx, history])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editingTextId) return // quando editando texto, não atropela
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLayerId && !editingTextId) { e.preventDefault(); deleteLayer(selectedLayerId) }
      } else if (e.key === 'Escape') {
        setSelectedLayerId(null); setEditingTextId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo, selectedLayerId, editingTextId])

  // ─── Mutações ─────────────────────────────────────────────────────
  function updateLayer(layerId: string, fn: (l: Layer) => Layer) {
    const next = slides.map((s, i) => {
      if (i !== slideIdx) return s
      return { ...s, layers: s.layers.map(l => l.id === layerId ? fn(l) : l) }
    })
    setSlides(next)
    pushHistory(next)
  }

  function updateSlide(fn: (s: Slide2) => Slide2) {
    const next = slides.map((s, i) => i === slideIdx ? fn(s) : s)
    setSlides(next)
    pushHistory(next)
  }

  function deleteLayer(layerId: string) {
    const next = slides.map((s, i) =>
      i === slideIdx ? { ...s, layers: s.layers.filter(l => l.id !== layerId) } : s
    )
    setSlides(next)
    pushHistory(next)
    setSelectedLayerId(null)
  }

  function duplicateLayer(layerId: string) {
    const layer = slide.layers.find(l => l.id === layerId)
    if (!layer) return
    const copy: Layer = { ...layer, id: newId(layer.type), x: layer.x + 2, y: layer.y + 2 } as Layer
    const next = slides.map((s, i) =>
      i === slideIdx ? { ...s, layers: [...s.layers, copy] } : s
    )
    setSlides(next)
    pushHistory(next)
    setSelectedLayerId(copy.id)
  }

  function moveLayerZ(layerId: string, direction: 'up' | 'down') {
    const idx = slide.layers.findIndex(l => l.id === layerId)
    if (idx === -1) return
    const newIdx = direction === 'up' ? Math.min(idx + 1, slide.layers.length - 1) : Math.max(idx - 1, 0)
    if (newIdx === idx) return
    const newLayers = [...slide.layers]
    ;[newLayers[idx], newLayers[newIdx]] = [newLayers[newIdx], newLayers[idx]]
    const next = slides.map((s, i) => i === slideIdx ? { ...s, layers: newLayers } : s)
    setSlides(next)
    pushHistory(next)
  }

  function addTextLayer() {
    const tl: TextLayer = {
      id: newId('t'),
      type: 'text',
      x: 10, y: 40, w: 80, h: 20,
      align: 'left', vAlign: 'top',
      runs: [{ text: 'Novo texto', color: '#ffffff', fontSize: 56, fontFamily: 'Inter', bold: true }],
      lineHeight: 1.2,
      shadow: true,
    }
    const next = slides.map((s, i) =>
      i === slideIdx ? { ...s, layers: [...s.layers, tl] } : s
    )
    setSlides(next)
    pushHistory(next)
    setSelectedLayerId(tl.id)
    setTimeout(() => setEditingTextId(tl.id), 50)
  }

  function addPhotoLayer(imgIdx: number) {
    const pl: PhotoLayer = {
      id: newId('p'),
      type: 'photo',
      x: 20, y: 20, w: 60, h: 60,
      imageIdx: imgIdx,
      rounded: 20,
    }
    const next = slides.map((s, i) =>
      i === slideIdx ? { ...s, layers: [...s.layers, pl] } : s
    )
    setSlides(next)
    pushHistory(next)
    setSelectedLayerId(pl.id)
  }

  // ─── Drag handlers ─────────────────────────────────────────────
  function onLayerPointerDown(
    e: React.PointerEvent,
    layerId: string,
    mode: 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' = 'move',
  ) {
    if (editingTextId) return
    const layer = slide.layers.find(l => l.id === layerId)
    if (!layer) return
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setSelectedLayerId(layerId)
    setDragState({
      layerId,
      startX: e.clientX, startY: e.clientY,
      origX: layer.x, origY: layer.y,
      origW: layer.w, origH: layer.h,
      mode,
    })
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragState) return
    const dx = ((e.clientX - dragState.startX) / canvasDisplaySize) * 100
    const dy = ((e.clientY - dragState.startY) / canvasDisplaySize) * 100
    updateLayer(dragState.layerId, l => {
      const next = { ...l }
      if (dragState.mode === 'move') {
        next.x = Math.max(0, Math.min(100 - l.w, dragState.origX + dx))
        next.y = Math.max(0, Math.min(100 - l.h, dragState.origY + dy))
      } else if (dragState.mode === 'resize-br') {
        next.w = Math.max(5, Math.min(100 - l.x, dragState.origW + dx))
        next.h = Math.max(3, Math.min(100 - l.y, dragState.origH + dy))
      } else if (dragState.mode === 'resize-tl') {
        const newW = Math.max(5, dragState.origW - dx)
        const newH = Math.max(3, dragState.origH - dy)
        next.x = dragState.origX + (dragState.origW - newW)
        next.y = dragState.origY + (dragState.origH - newH)
        next.w = newW
        next.h = newH
      } else if (dragState.mode === 'resize-tr') {
        const newH = Math.max(3, dragState.origH - dy)
        next.y = dragState.origY + (dragState.origH - newH)
        next.w = Math.max(5, Math.min(100 - l.x, dragState.origW + dx))
        next.h = newH
      } else if (dragState.mode === 'resize-bl') {
        const newW = Math.max(5, dragState.origW - dx)
        next.x = dragState.origX + (dragState.origW - newW)
        next.w = newW
        next.h = Math.max(3, Math.min(100 - l.y, dragState.origH + dy))
      }
      return next
    })
  }

  function onPointerUp() {
    setDragState(null)
  }

  // ─── Export ─────────────────────────────────────────────────────
  /** Lista todas as fontes usadas nos slides pra pré-carregar antes de exportar */
  function collectFontsInUse(): string[] {
    const usadas = new Set<string>()
    for (const s of slides) {
      if (s.fonte_familia) usadas.add(s.fonte_familia)
      for (const l of s.layers) {
        if (l.type === 'text') {
          for (const run of l.runs) if (run.fontFamily) usadas.add(run.fontFamily)
        }
      }
    }
    return Array.from(usadas)
  }

  async function exportarTodosPng() {
    if (!imageCache) return
    setExportando(true)
    try {
      await ensureFontsLoaded(collectFontsInUse())
      const hidden = document.createElement('canvas')
      hidden.width = CANVAS_SIZE
      hidden.height = CANVAS_SIZE

      for (const s of slides) {
        await renderSlide2(hidden, s, imageCache, { watermark })
        const blob = await canvasToBlob(hidden)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `slide-${String(s.ordem).padStart(2, '0')}.png`
        a.click()
        URL.revokeObjectURL(url)
        await new Promise(r => setTimeout(r, 200))
      }
      onSalvar?.(slides)
    } finally {
      setExportando(false)
    }
  }

  async function compartilharInstagram() {
    if (!imageCache) return
    setExportando(true)
    try {
      await ensureFontsLoaded(collectFontsInUse())
      const hidden = document.createElement('canvas')
      hidden.width = CANVAS_SIZE
      hidden.height = CANVAS_SIZE
      const files: File[] = []
      for (const s of slides) {
        await renderSlide2(hidden, s, imageCache, { watermark })
        const blob = await canvasToBlob(hidden)
        files.push(new File([blob], `slide-${String(s.ordem).padStart(2, '0')}.png`, { type: 'image/png' }))
      }
      if (navigator.canShare?.({ files })) {
        await navigator.share({ files, title: 'Carrossel Iara' })
      } else {
        // fallback: baixa um por um
        for (const f of files) {
          const url = URL.createObjectURL(f)
          const a = document.createElement('a')
          a.href = url; a.download = f.name; a.click()
          URL.revokeObjectURL(url)
          await new Promise(r => setTimeout(r, 150))
        }
      }
    } finally {
      setExportando(false)
    }
  }

  // ─── Render helpers (componentes filhos) ─────────────────────────────
  if (!slide) return null

  return (
    <div className="fixed inset-0 z-50 bg-[#050510] flex flex-col">
      {/* Todas as fontes do catálogo em um único stylesheet Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} />

      {/* Topbar — responsivo: labels somem no mobile, ícones permanecem */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 border-b border-[#1a1a2e] bg-[#0a0a14] flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onFechar}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#13131f] border border-[#2a2a4a] hover:border-[#3a3a5a] text-[#c1c1d8] hover:text-white text-xs font-semibold transition-all flex-shrink-0"
            title="Fechar editor (Esc)"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fechar</span>
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#f1f1f8] truncate">Editor Canvas</p>
            <p className="text-[11px] text-[#5a5a7a] truncate hidden sm:block">Slide {slideIdx + 1} de {slides.length} · arraste, clique, edite</p>
            <p className="text-[10px] text-[#5a5a7a] sm:hidden">{slideIdx + 1}/{slides.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={undo}
            disabled={historyIdx === 0}
            className="p-2 rounded-lg hover:bg-[#1a1a2e] disabled:opacity-30 text-[#9b9bb5]"
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyIdx >= history.length - 1}
            className="p-2 rounded-lg hover:bg-[#1a1a2e] disabled:opacity-30 text-[#9b9bb5]"
            title="Refazer (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="h-5 w-px bg-[#2a2a4a] mx-0.5 sm:mx-1" />
          <button
            onClick={() => setShowPreview(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13131f] border border-[#2a2a4a] text-[#9b9bb5] hover:text-white text-xs font-medium"
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            onClick={compartilharInstagram}
            disabled={exportando}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90 disabled:opacity-40 text-white text-xs font-semibold"
            title="Compartilhar"
          >
            {exportando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Compartilhar</span>
          </button>
          <button
            onClick={exportarTodosPng}
            disabled={exportando}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-iara-600 hover:bg-iara-500 disabled:opacity-40 text-white text-xs font-semibold"
            title="Baixar PNGs"
          >
            {exportando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Baixar</span>
          </button>
        </div>
      </div>

      {/* Thumbs horizontais — APENAS mobile, sempre visíveis pra trocar de slide */}
      <div className="md:hidden flex-shrink-0 border-b border-[#1a1a2e] bg-[#08080f] px-2 py-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {slides.map((s, i) => (
            <div key={s.id} className="flex-shrink-0 w-16">
              <Thumbnail
                slide={s}
                active={i === slideIdx}
                imageCache={imageCache}
                onClick={() => { setSlideIdx(i); setSelectedLayerId(null); setEditingTextId(null) }}
                number={i + 1}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Body: thumbnails + canvas + inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnails esquerda — APENAS desktop */}
        <div className="hidden md:flex flex-col gap-2 w-28 overflow-y-auto py-4 px-2 border-r border-[#1a1a2e] bg-[#08080f]">
          {slides.map((s, i) => (
            <Thumbnail
              key={s.id}
              slide={s}
              active={i === slideIdx}
              imageCache={imageCache}
              onClick={() => { setSlideIdx(i); setSelectedLayerId(null); setEditingTextId(null) }}
              number={i + 1}
            />
          ))}
        </div>

        {/* Canvas central — responsivo via ResizeObserver */}
        <div
          ref={stageContainerRef}
          className="flex-1 flex items-center justify-center relative overflow-hidden bg-[#050510]"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #050510 80%)' }}
          onClick={() => { setSelectedLayerId(null); setEditingTextId(null) }}
        >
          <CanvasStage
            slide={slide}
            imagensCache={imagensCache}
            selectedLayerId={selectedLayerId}
            editingTextId={editingTextId}
            onSelectLayer={setSelectedLayerId}
            onStartEditText={setEditingTextId}
            onLayerPointerDown={onLayerPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onUpdateLayer={updateLayer}
            displaySize={canvasDisplaySize}
          />

          {/* Navegação entre slides (mobile-friendly) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-full bg-[#0a0a14]/90 border border-[#1a1a2e] backdrop-blur-sm">
            <button
              onClick={() => setSlideIdx(Math.max(0, slideIdx - 1))}
              disabled={slideIdx === 0}
              className="p-1.5 rounded-full hover:bg-[#1a1a2e] disabled:opacity-30 text-[#9b9bb5]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-[#9b9bb5] min-w-[50px] text-center tabular-nums">{slideIdx + 1} / {slides.length}</span>
            <button
              onClick={() => setSlideIdx(Math.min(slides.length - 1, slideIdx + 1))}
              disabled={slideIdx === slides.length - 1}
              className="p-1.5 rounded-full hover:bg-[#1a1a2e] disabled:opacity-30 text-[#9b9bb5]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Inspector direita */}
        <div className="hidden lg:flex flex-col w-80 overflow-y-auto border-l border-[#1a1a2e] bg-[#08080f]">
          <Inspector
            slide={slide}
            selected={selectedLayer}
            onUpdateLayer={(fn) => selectedLayer && updateLayer(selectedLayer.id, fn)}
            onUpdateSlide={updateSlide}
            onDelete={() => selectedLayer && deleteLayer(selectedLayer.id)}
            onDuplicate={() => selectedLayer && duplicateLayer(selectedLayer.id)}
            onMoveZ={(dir) => selectedLayer && moveLayerZ(selectedLayer.id, dir)}
            onAddText={addTextLayer}
            onAddPhoto={addPhotoLayer}
            imagensCache={imagensCache}
          />
        </div>
      </div>

      {/* Inspector mobile — sheet por baixo quando layer selecionada (lg-) */}
      {selectedLayer && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-60 bg-[#0a0a14] border-t border-[#1a1a2e] max-h-[60vh] flex flex-col rounded-t-2xl shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a2e] flex-shrink-0">
            <p className="text-xs font-semibold text-[#f1f1f8]">
              {selectedLayer.type === 'text' ? 'Editar texto' : selectedLayer.type === 'photo' ? 'Editar foto' : 'Editar forma'}
            </p>
            <button
              onClick={() => { setSelectedLayerId(null); setEditingTextId(null) }}
              className="p-1.5 rounded-lg bg-[#13131f] border border-[#2a2a4a] text-[#9b9bb5] hover:text-white"
              title="Fechar inspector"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1">
            <Inspector
              slide={slide}
              selected={selectedLayer}
              onUpdateLayer={(fn) => updateLayer(selectedLayer.id, fn)}
              onUpdateSlide={updateSlide}
              onDelete={() => deleteLayer(selectedLayer.id)}
              onDuplicate={() => duplicateLayer(selectedLayer.id)}
              onMoveZ={(dir) => moveLayerZ(selectedLayer.id, dir)}
              onAddText={addTextLayer}
              onAddPhoto={addPhotoLayer}
              imagensCache={imagensCache}
              compact
            />
          </div>
        </div>
      )}

      {/* Preview modal */}
      {showPreview && (
        <PreviewModal
          slides={slides}
          imageCache={imageCache}
          watermark={watermark}
          onFechar={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// CANVAS STAGE — renderiza o slide com layers editáveis como divs HTML
// ─────────────────────────────────────────────────────────────────────────

type CanvasStageProps = {
  slide: Slide2
  imagensCache: string[]
  selectedLayerId: string | null
  editingTextId: string | null
  onSelectLayer: (id: string | null) => void
  onStartEditText: (id: string | null) => void
  onLayerPointerDown: (e: React.PointerEvent, layerId: string, mode?: 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br') => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: () => void
  onUpdateLayer: (id: string, fn: (l: Layer) => Layer) => void
  displaySize: number
}

function CanvasStage({
  slide, imagensCache, selectedLayerId, editingTextId,
  onSelectLayer, onStartEditText, onLayerPointerDown, onPointerMove, onPointerUp,
  onUpdateLayer, displaySize,
}: CanvasStageProps) {
  // Escala px: 100% = displaySize px
  const pxFromPct = (pct: number) => (pct / 100) * displaySize

  // Background CSS
  const bgStyle = useMemo(() => {
    if (slide.background.type === 'color') return { backgroundColor: slide.background.color }
    if (slide.background.type === 'gradient') {
      return { backgroundImage: `linear-gradient(${(slide.background.angle ?? 135)}deg, ${slide.background.from}, ${slide.background.to})` }
    }
    // photo
    const src = imagensCache[slide.background.imageIdx]
    if (!src) return { backgroundColor: '#1a1a2e' }
    return {
      backgroundImage: `url(${src})`,
      backgroundSize: slide.background.zoom && slide.background.zoom > 1 ? `${slide.background.zoom * 100}%` : 'cover',
      backgroundPosition: slide.background.objectPosition ?? 'center',
      backgroundRepeat: 'no-repeat',
    }
  }, [slide.background, imagensCache])

  return (
    <div
      className="relative shadow-2xl rounded-xl overflow-hidden"
      style={{
        width: displaySize, height: displaySize,
        ...bgStyle,
        fontFamily: cssFamilyFor(slide.fonte_familia ?? 'Inter'),
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={e => { e.stopPropagation(); onSelectLayer(null); onStartEditText(null) }}
    >
      {/* Overlay */}
      {slide.overlay && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: slide.overlay.color, opacity: slide.overlay.opacity }}
        />
      )}

      {/* Layers */}
      {slide.layers.map((layer) => (
        <LayerView
          key={layer.id}
          layer={layer}
          selected={selectedLayerId === layer.id}
          editing={editingTextId === layer.id}
          imagensCache={imagensCache}
          pxFromPct={pxFromPct}
          displaySize={displaySize}
          onPointerDown={onLayerPointerDown}
          onDoubleClick={() => {
            if (layer.type === 'text') {
              onSelectLayer(layer.id)
              onStartEditText(layer.id)
            }
          }}
          onUpdateText={(newRuns) => {
            onUpdateLayer(layer.id, l => l.type === 'text' ? { ...l, runs: newRuns } : l)
          }}
          onStopEdit={() => onStartEditText(null)}
        />
      ))}
    </div>
  )
}

// ─── LayerView ──────────────────────────────────────────────────────

type LayerViewProps = {
  layer: Layer
  selected: boolean
  editing: boolean
  imagensCache: string[]
  pxFromPct: (n: number) => number
  displaySize: number
  onPointerDown: (e: React.PointerEvent, id: string, mode?: 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br') => void
  onDoubleClick: () => void
  onUpdateText: (newRuns: Run[]) => void
  onStopEdit: () => void
}

function LayerView({
  layer, selected, editing, imagensCache, pxFromPct, displaySize, onPointerDown, onDoubleClick, onUpdateText, onStopEdit,
}: LayerViewProps) {
  const common = {
    position: 'absolute' as const,
    left: pxFromPct(layer.x),
    top: pxFromPct(layer.y),
    width: pxFromPct(layer.w),
    height: pxFromPct(layer.h),
    transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
    outline: selected ? '2px solid #6366f1' : undefined,
    outlineOffset: selected ? '2px' : undefined,
    cursor: editing ? 'text' : selected ? 'move' : 'pointer',
    userSelect: editing ? ('text' as const) : ('none' as const),
  }

  const content = (() => {
    if (layer.type === 'text') {
      const t = layer as TextLayer
      const alignCSS = t.align
      const vAlignCSS = t.vAlign === 'middle' ? 'center' : t.vAlign === 'bottom' ? 'flex-end' : 'flex-start'
      return (
        <div style={{
          ...common,
          display: 'flex', flexDirection: 'column', justifyContent: vAlignCSS,
          textAlign: alignCSS,
          padding: 2,
          overflow: 'visible',
          lineHeight: t.lineHeight ?? 1.25,
          textShadow: t.shadow ? '0 2px 12px rgba(0,0,0,0.55)' : undefined,
        }}>
          {editing ? (
            <EditableText
              runs={t.runs}
              align={t.align}
              displaySize={displaySize}
              onChange={onUpdateText}
              onBlur={onStopEdit}
            />
          ) : (
            <RichTextView runs={t.runs} displaySize={displaySize} />
          )}
          {selected && !editing && <ResizeHandles onPointerDown={(e, mode) => onPointerDown(e, layer.id, mode)} />}
        </div>
      )
    }

    if (layer.type === 'photo') {
      const p = layer as PhotoLayer
      const src = imagensCache[p.imageIdx]
      return (
        <div style={{
          ...common,
          borderRadius: p.rounded ?? 0,
          overflow: 'hidden',
          boxShadow: p.shadow ? '0 20px 50px rgba(0,0,0,0.35)' : undefined,
        }}>
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" style={{
              width: '100%', height: '100%', objectFit: 'cover',
              objectPosition: p.objectPosition ?? 'center', pointerEvents: 'none',
            }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#1a1a2e' }} />
          )}
          {selected && <ResizeHandles onPointerDown={(e, mode) => onPointerDown(e, layer.id, mode)} />}
        </div>
      )
    }

    // shape — rect/circle/line desenhados via CSS
    const shapeLayer = layer as import('@/lib/carrossel-canvas-types').ShapeLayer
    const shapeStyle: React.CSSProperties = { ...common, pointerEvents: 'auto' }
    if (shapeLayer.shape === 'rect') {
      if (shapeLayer.fill) shapeStyle.backgroundColor = shapeLayer.fill
      if (shapeLayer.stroke && shapeLayer.strokeWidth) {
        shapeStyle.border = `${shapeLayer.strokeWidth}px solid ${shapeLayer.stroke}`
      }
    } else if (shapeLayer.shape === 'circle') {
      if (shapeLayer.fill) shapeStyle.backgroundColor = shapeLayer.fill
      shapeStyle.borderRadius = '50%'
      if (shapeLayer.stroke && shapeLayer.strokeWidth) {
        shapeStyle.border = `${shapeLayer.strokeWidth}px solid ${shapeLayer.stroke}`
      }
    } else if (shapeLayer.shape === 'line') {
      shapeStyle.backgroundColor = shapeLayer.stroke ?? '#fff'
      shapeStyle.height = (shapeLayer.strokeWidth ?? 4) * (displaySize / CANVAS_SIZE)
    }
    return (
      <div style={shapeStyle}>
        {selected && <ResizeHandles onPointerDown={(e, mode) => onPointerDown(e, layer.id, mode)} />}
      </div>
    )
  })()

  // Wrapper que captura pointerDown
  return (
    <div
      onPointerDown={(e) => !editing && onPointerDown(e, layer.id, 'move')}
      onDoubleClick={onDoubleClick}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      {content}
    </div>
  )
}

// Handles de resize nos 4 cantos
function ResizeHandles({ onPointerDown }: { onPointerDown: (e: React.PointerEvent, mode: 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br') => void }) {
  const handle = (mode: 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br', pos: { top?: number; left?: number; right?: number; bottom?: number; cursor: string }) => (
    <div
      onPointerDown={e => { e.stopPropagation(); onPointerDown(e, mode) }}
      style={{
        position: 'absolute',
        width: 12, height: 12,
        backgroundColor: '#6366f1',
        border: '2px solid #fff',
        borderRadius: 3,
        zIndex: 10,
        ...pos,
      }}
    />
  )
  return (
    <>
      {handle('resize-tl', { top: -6, left: -6, cursor: 'nwse-resize' })}
      {handle('resize-tr', { top: -6, right: -6, cursor: 'nesw-resize' })}
      {handle('resize-bl', { bottom: -6, left: -6, cursor: 'nesw-resize' })}
      {handle('resize-br', { bottom: -6, right: -6, cursor: 'nwse-resize' })}
    </>
  )
}

// ─── RichTextView ─────────────────────────────────────────────────────
// Renderiza runs como spans (sem edição)
function RichTextView({ runs, displaySize }: { runs: Run[]; displaySize: number }) {
  const scale = displaySize / CANVAS_SIZE
  return (
    <div>
      {runs.map((run, i) => (
        <span
          key={i}
          style={{
            color: run.color,
            fontSize: run.fontSize ? run.fontSize * scale : undefined,
            fontFamily: run.fontFamily ? cssFamilyFor(run.fontFamily) : undefined,
            fontWeight: run.bold ? 700 : 500,
            fontStyle: run.italic ? 'italic' : undefined,
            textDecoration: run.underline ? 'underline' : undefined,
            letterSpacing: run.letterSpacing ? run.letterSpacing * scale : undefined,
            whiteSpace: 'pre-wrap',
          }}
        >
          {run.text}
        </span>
      ))}
    </div>
  )
}

// ─── EditableText ─────────────────────────────────────────────────────
// Texto editável in-place com contenteditable preservando estrutura de runs
function EditableText({ runs, align, displaySize, onChange, onBlur }: {
  runs: Run[]; align: 'left' | 'center' | 'right'; displaySize: number;
  onChange: (runs: Run[]) => void; onBlur: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const scale = displaySize / CANVAS_SIZE

  // Apenas na primeira montagem: injeta runs como spans
  useEffect(() => {
    if (!ref.current) return
    const html = runs.map(run => {
      const style: string[] = []
      if (run.color) style.push(`color:${run.color}`)
      if (run.fontSize) style.push(`font-size:${run.fontSize * scale}px`)
      if (run.fontFamily) style.push(`font-family:${cssFamilyFor(run.fontFamily)}`)
      if (run.bold) style.push(`font-weight:700`)
      if (run.italic) style.push(`font-style:italic`)
      if (run.underline) style.push(`text-decoration:underline`)
      if (run.letterSpacing) style.push(`letter-spacing:${run.letterSpacing * scale}px`)
      return `<span style="${style.join(';')}" data-run="1">${escapeHtml(run.text)}</span>`
    }).join('')
    ref.current.innerHTML = html
    ref.current.focus()
    // Posiciona cursor no fim
    const range = document.createRange()
    range.selectNodeContents(ref.current)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function extractRuns(): Run[] {
    if (!ref.current) return runs
    const result: Run[] = []
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const parent = node.parentElement
        const style = parent?.style
        result.push({
          text: node.textContent ?? '',
          color: style?.color || undefined,
          fontSize: style?.fontSize ? Math.round(parseFloat(style.fontSize) / scale) : undefined,
          fontFamily: style?.fontFamily ? (style.fontFamily.replace(/['"]/g, '').split(',')[0].trim() as Run['fontFamily']) : undefined,
          bold: style?.fontWeight === '700' || parent?.tagName === 'B' || parent?.tagName === 'STRONG',
          italic: style?.fontStyle === 'italic' || parent?.tagName === 'I' || parent?.tagName === 'EM',
          underline: style?.textDecoration?.includes('underline') || parent?.tagName === 'U',
          letterSpacing: style?.letterSpacing ? Math.round(parseFloat(style.letterSpacing) / scale) : undefined,
        })
      } else {
        for (const child of Array.from(node.childNodes)) walk(child)
      }
    }
    walk(ref.current)
    // merge consecutivos iguais
    return result.filter(r => r.text.length > 0)
  }

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={() => onChange(extractRuns())}
      onBlur={() => { onChange(extractRuns()); onBlur() }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') { e.currentTarget.blur() }
      }}
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      style={{
        outline: '2px dashed #6366f1',
        outlineOffset: 2,
        padding: 4,
        minHeight: '1em',
        textAlign: align,
        cursor: 'text',
      }}
    />
  )
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ─── THUMBNAIL ─────────────────────────────────────────────────────

function Thumbnail({ slide, active, imageCache, onClick, number }: {
  slide: Slide2; active: boolean; imageCache: ImageCache; onClick: () => void; number: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current || !imageCache) return
    renderSlide2(ref.current, slide, imageCache, {})
  }, [slide, imageCache])

  return (
    <button
      onClick={onClick}
      className={`relative aspect-square w-full rounded-lg overflow-hidden border-2 transition-all ${
        active ? 'border-iara-500 scale-[1.02]' : 'border-[#1a1a2e] hover:border-[#2a2a4a]'
      }`}
    >
      <canvas ref={ref} style={{ width: '100%', height: '100%' }} />
      <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white tabular-nums">
        {number}
      </span>
    </button>
  )
}

// ─── PREVIEW MODAL ─────────────────────────────────────────────────

function PreviewModal({ slides, imageCache, watermark, onFechar }: {
  slides: Slide2[]; imageCache: ImageCache; watermark: boolean; onFechar: () => void
}) {
  const [idx, setIdx] = useState(0)
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current) return
    renderSlide2(ref.current, slides[idx], imageCache, { watermark })
  }, [idx, slides, imageCache, watermark])

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6" onClick={onFechar}>
      <button onClick={onFechar} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
        <X className="w-5 h-5" />
      </button>
      <div className="flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
        <canvas ref={ref} className="max-w-[90vw] max-h-[75vh] rounded-xl shadow-2xl" style={{ aspectRatio: '1/1' }} />
        <div className="flex items-center gap-3">
          <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-white tabular-nums min-w-[60px] text-center">{idx + 1} / {slides.length}</span>
          <button onClick={() => setIdx(Math.min(slides.length - 1, idx + 1))} disabled={idx === slides.length - 1}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── INSPECTOR ─────────────────────────────────────────────────────

type InspectorProps = {
  slide: Slide2
  selected: Layer | null
  onUpdateLayer: (fn: (l: Layer) => Layer) => void
  onUpdateSlide: (fn: (s: Slide2) => Slide2) => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveZ: (direction: 'up' | 'down') => void
  onAddText: () => void
  onAddPhoto: (idx: number) => void
  imagensCache: string[]
  compact?: boolean
}

function Inspector(props: InspectorProps) {
  const { slide, selected, onUpdateLayer, onUpdateSlide, onDelete, onDuplicate, onMoveZ, onAddText, onAddPhoto, imagensCache, compact } = props

  return (
    <div className={compact ? 'p-3 space-y-3' : 'p-4 space-y-5'}>
      {!selected ? (
        <>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#6b6b8a] mb-2">Slide</p>
            <SlideBackgroundEditor slide={slide} onUpdateSlide={onUpdateSlide} imagensCache={imagensCache} />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#6b6b8a] mb-2">Adicionar</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onAddText}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] hover:border-iara-500 text-[#c1c1d8] hover:text-white text-xs">
                <Type className="w-4 h-4" />
                Texto
              </button>
              <div className="relative">
                <button
                  onClick={() => imagensCache.length > 0 && onAddPhoto(0)}
                  disabled={imagensCache.length === 0}
                  className="w-full flex flex-col items-center gap-1 p-3 rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] hover:border-iara-500 disabled:opacity-30 text-[#c1c1d8] hover:text-white text-xs"
                >
                  <ImageIcon className="w-4 h-4" />
                  Foto
                </button>
              </div>
            </div>
            {imagensCache.length > 0 && (
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {imagensCache.map((src, i) => (
                  <button key={i} onClick={() => onAddPhoto(i)}
                    className="relative aspect-square rounded-md border border-[#1a1a2e] hover:border-iara-500 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0.5 right-0.5 text-[8px] px-1 rounded bg-black/60 text-white">{i + 1}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#6b6b8a] mb-2">Layers ({slide.layers.length})</p>
            <p className="text-[11px] text-[#5a5a7a] leading-relaxed">
              Clica num elemento no canvas pra editar. Clique duplo em texto pra digitar. Ctrl+Z desfaz. Delete remove.
            </p>
          </div>
        </>
      ) : selected.type === 'text' ? (
        <TextInspector layer={selected as TextLayer} onUpdate={onUpdateLayer} onDelete={onDelete} onDuplicate={onDuplicate} onMoveZ={onMoveZ} compact={compact} />
      ) : selected.type === 'photo' ? (
        <PhotoInspector layer={selected as PhotoLayer} onUpdate={onUpdateLayer} onDelete={onDelete} onDuplicate={onDuplicate} onMoveZ={onMoveZ} imagensCache={imagensCache} compact={compact} />
      ) : null}
    </div>
  )
}

// ─── Slide background editor ─────────────────────────────────────────

function SlideBackgroundEditor({ slide, onUpdateSlide, imagensCache }: { slide: Slide2; onUpdateSlide: (fn: (s: Slide2) => Slide2) => void; imagensCache: string[] }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1.5">
        {(['color', 'gradient', 'photo'] as const).map(t => (
          <button
            key={t}
            onClick={() => onUpdateSlide(s => {
              if (t === 'color') return { ...s, background: { type: 'color', color: '#08080f' } }
              if (t === 'gradient') return { ...s, background: { type: 'gradient', from: '#6366f1', to: '#a855f7', angle: 135 } }
              return { ...s, background: { type: 'photo', imageIdx: 0 } }
            })}
            className={`py-1.5 rounded-lg border text-[10px] font-semibold transition-all ${
              slide.background.type === t
                ? 'border-iara-500 bg-iara-600/20 text-iara-200'
                : 'border-[#1a1a2e] bg-[#0d0d1a] text-[#9b9bb5] hover:border-iara-700/40'
            }`}
          >
            {t === 'color' ? 'Cor' : t === 'gradient' ? 'Gradiente' : 'Foto'}
          </button>
        ))}
      </div>

      {slide.background.type === 'color' && (
        <ColorPicker
          value={slide.background.color}
          onChange={c => onUpdateSlide(s => ({ ...s, background: { type: 'color', color: c } }))}
        />
      )}

      {slide.background.type === 'gradient' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-[#6b6b8a] mb-1">De</p>
              <ColorPicker
                value={slide.background.from}
                onChange={c => onUpdateSlide(s => s.background.type === 'gradient' ? { ...s, background: { ...s.background, from: c } } : s)}
              />
            </div>
            <div>
              <p className="text-[10px] text-[#6b6b8a] mb-1">Para</p>
              <ColorPicker
                value={slide.background.to}
                onChange={c => onUpdateSlide(s => s.background.type === 'gradient' ? { ...s, background: { ...s.background, to: c } } : s)}
              />
            </div>
          </div>
        </div>
      )}

      {slide.background.type === 'photo' && (
        <>
          {imagensCache.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5">
              {imagensCache.map((src, i) => (
                <button
                  key={i}
                  onClick={() => onUpdateSlide(s => s.background.type === 'photo' ? { ...s, background: { ...s.background, imageIdx: i } } : s)}
                  className={`relative aspect-square rounded-md border overflow-hidden ${
                    slide.background.type === 'photo' && slide.background.imageIdx === i ? 'border-iara-500' : 'border-[#1a1a2e]'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div>
            <p className="text-[10px] text-[#6b6b8a] mb-1">Enquadramento</p>
            <div className="grid grid-cols-3 gap-1">
              {[
                { pos: 'left top',     label: 'Sup-Esq' },
                { pos: 'center top',   label: 'Topo' },
                { pos: 'right top',    label: 'Sup-Dir' },
                { pos: 'left center',  label: 'Esq' },
                { pos: 'center',       label: 'Centro' },
                { pos: 'right center', label: 'Dir' },
                { pos: 'left bottom',  label: 'Inf-Esq' },
                { pos: 'center bottom',label: 'Base' },
                { pos: 'right bottom', label: 'Inf-Dir' },
              ].map(p => (
                <button
                  key={p.pos}
                  onClick={() => onUpdateSlide(s => s.background.type === 'photo' ? { ...s, background: { ...s.background, objectPosition: p.pos } } : s)}
                  className={`py-1 text-[9px] rounded border transition-all ${
                    slide.background.type === 'photo' && slide.background.objectPosition === p.pos
                      ? 'border-iara-500 bg-iara-600/20 text-iara-200'
                      : 'border-[#1a1a2e] bg-[#0d0d1a] text-[#9b9bb5]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div>
        <p className="text-[10px] text-[#6b6b8a] mb-1">Overlay escuro</p>
        <input
          type="range" min={0} max={0.7} step={0.05}
          value={slide.overlay?.opacity ?? 0}
          onChange={e => {
            const v = Number(e.target.value)
            onUpdateSlide(s => v === 0 ? { ...s, overlay: undefined } : { ...s, overlay: { color: '#000', opacity: v } })
          }}
          className="w-full accent-iara-500"
        />
      </div>
    </div>
  )
}

// ─── TextInspector ─────────────────────────────────────────────────

function TextInspector({ layer, onUpdate, onDelete, onDuplicate, onMoveZ, compact }: {
  layer: TextLayer
  onUpdate: (fn: (l: Layer) => Layer) => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveZ: (dir: 'up' | 'down') => void
  compact?: boolean
}) {
  // Para simplicidade, os controles aplicam à PRIMEIRA run (ou à todas se única).
  // Formatação por palavra vem via contentEditable direto no canvas.
  const r = layer.runs[0] ?? { text: '' }
  const texto = runsToText(layer.runs)

  function atualizaRuns(partial: Partial<Run>) {
    onUpdate(l => {
      if (l.type !== 'text') return l
      return { ...l, runs: l.runs.map(run => ({ ...run, ...partial })) }
    })
  }

  function setTextoCompleto(novo: string) {
    onUpdate(l => {
      if (l.type !== 'text') return l
      // Aplica o template da primeira run em todo o novo texto
      const tpl = l.runs[0] ?? {}
      return { ...l, runs: [{ ...tpl, text: novo }] }
    })
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-[#6b6b8a]">Texto</p>
        <div className="flex gap-1">
          <button onClick={() => onMoveZ('up')} className="p-1 rounded hover:bg-[#1a1a2e] text-[#6b6b8a]" title="Trazer pra frente">
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onMoveZ('down')} className="p-1 rounded hover:bg-[#1a1a2e] text-[#6b6b8a]" title="Enviar pra trás">
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDuplicate} className="p-1 rounded hover:bg-[#1a1a2e] text-[#6b6b8a]" title="Duplicar">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-900/30 text-red-400" title="Excluir">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <textarea
        value={texto}
        onChange={e => setTextoCompleto(e.target.value)}
        rows={3}
        className="w-full bg-[#08080f] border border-[#1a1a2e] rounded-lg p-2 text-xs text-[#f1f1f8] resize-none focus:outline-none focus:border-iara-500"
      />

      {/* Fonte — picker com ~35 opções categorizadas */}
      <FontPicker
        value={r.fontFamily ?? 'Inter'}
        onChange={(id) => atualizaRuns({ fontFamily: id })}
      />

      {/* Tamanho + peso + itálico + underline */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <p className="text-[10px] text-[#6b6b8a] mb-1">Tamanho ({r.fontSize ?? 40})</p>
          <input
            type="range" min={16} max={220} step={2}
            value={r.fontSize ?? 40}
            onChange={e => atualizaRuns({ fontSize: Number(e.target.value) })}
            className="w-full accent-iara-500"
          />
        </div>
        <button
          onClick={() => atualizaRuns({ bold: !r.bold })}
          className={`p-2 rounded-md border ${r.bold ? 'border-iara-500 bg-iara-600/20 text-iara-200' : 'border-[#1a1a2e] bg-[#0d0d1a] text-[#9b9bb5]'}`}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => atualizaRuns({ italic: !r.italic })}
          className={`p-2 rounded-md border ${r.italic ? 'border-iara-500 bg-iara-600/20 text-iara-200' : 'border-[#1a1a2e] bg-[#0d0d1a] text-[#9b9bb5]'}`}
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => atualizaRuns({ underline: !r.underline })}
          className={`p-2 rounded-md border ${r.underline ? 'border-iara-500 bg-iara-600/20 text-iara-200' : 'border-[#1a1a2e] bg-[#0d0d1a] text-[#9b9bb5]'}`}
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Alinhamento */}
      <div>
        <p className="text-[10px] text-[#6b6b8a] mb-1.5">Alinhamento</p>
        <div className="grid grid-cols-3 gap-1">
          {([
            { id: 'left', Icon: AlignLeft },
            { id: 'center', Icon: AlignCenter },
            { id: 'right', Icon: AlignRight },
          ] as const).map(a => (
            <button
              key={a.id}
              onClick={() => onUpdate(l => l.type === 'text' ? { ...l, align: a.id } : l)}
              className={`flex items-center justify-center py-2 rounded-md border transition-all ${
                layer.align === a.id ? 'border-iara-500 bg-iara-600/20 text-iara-200' : 'border-[#1a1a2e] bg-[#0d0d1a] text-[#9b9bb5]'
              }`}
            >
              <a.Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Cor */}
      <div>
        <p className="text-[10px] text-[#6b6b8a] mb-1.5">Cor do texto</p>
        <ColorPicker value={r.color ?? '#ffffff'} onChange={c => atualizaRuns({ color: c })} />
        <p className="text-[10px] text-[#5a5a7a] mt-1.5">
          <strong>Dica:</strong> selecione uma palavra no canvas e volte aqui pra mudar só ela.
        </p>
      </div>

      {/* Line height */}
      <div>
        <p className="text-[10px] text-[#6b6b8a] mb-1">Espaçamento entre linhas ({(layer.lineHeight ?? 1.25).toFixed(2)})</p>
        <input
          type="range" min={0.9} max={2} step={0.05}
          value={layer.lineHeight ?? 1.25}
          onChange={e => onUpdate(l => l.type === 'text' ? { ...l, lineHeight: Number(e.target.value) } : l)}
          className="w-full accent-iara-500"
        />
      </div>

      {/* Letter spacing */}
      <div>
        <p className="text-[10px] text-[#6b6b8a] mb-1">Espaçamento entre letras ({r.letterSpacing ?? 0})</p>
        <input
          type="range" min={-4} max={20} step={1}
          value={r.letterSpacing ?? 0}
          onChange={e => atualizaRuns({ letterSpacing: Number(e.target.value) })}
          className="w-full accent-iara-500"
        />
      </div>

      {/* Shadow */}
      <label className="flex items-center gap-2 text-xs text-[#c1c1d8] cursor-pointer">
        <input
          type="checkbox"
          checked={layer.shadow ?? false}
          onChange={e => onUpdate(l => l.type === 'text' ? { ...l, shadow: e.target.checked } : l)}
          className="accent-iara-500"
        />
        Sombra no texto
      </label>
    </div>
  )
}

// ─── PhotoInspector ─────────────────────────────────────────────────

function PhotoInspector({ layer, onUpdate, onDelete, onDuplicate, onMoveZ, imagensCache, compact }: {
  layer: PhotoLayer
  onUpdate: (fn: (l: Layer) => Layer) => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveZ: (dir: 'up' | 'down') => void
  imagensCache: string[]
  compact?: boolean
}) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-[#6b6b8a]">Foto</p>
        <div className="flex gap-1">
          <button onClick={() => onMoveZ('up')} className="p-1 rounded hover:bg-[#1a1a2e] text-[#6b6b8a]">
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onMoveZ('down')} className="p-1 rounded hover:bg-[#1a1a2e] text-[#6b6b8a]">
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDuplicate} className="p-1 rounded hover:bg-[#1a1a2e] text-[#6b6b8a]">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-900/30 text-red-400">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Trocar foto */}
      <div>
        <p className="text-[10px] text-[#6b6b8a] mb-1.5">Trocar foto</p>
        <div className="grid grid-cols-4 gap-1.5">
          {imagensCache.map((src, i) => (
            <button
              key={i}
              onClick={() => onUpdate(l => l.type === 'photo' ? { ...l, imageIdx: i } : l)}
              className={`relative aspect-square rounded-md border overflow-hidden ${
                layer.imageIdx === i ? 'border-iara-500' : 'border-[#1a1a2e]'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Enquadramento */}
      <div>
        <p className="text-[10px] text-[#6b6b8a] mb-1.5">Enquadramento</p>
        <div className="grid grid-cols-3 gap-1">
          {[
            'left top', 'center top', 'right top',
            'left center', 'center', 'right center',
            'left bottom', 'center bottom', 'right bottom',
          ].map(pos => (
            <button
              key={pos}
              onClick={() => onUpdate(l => l.type === 'photo' ? { ...l, objectPosition: pos } : l)}
              className={`py-1.5 text-[9px] rounded border transition-all ${
                layer.objectPosition === pos ? 'border-iara-500 bg-iara-600/20 text-iara-200' : 'border-[#1a1a2e] bg-[#0d0d1a] text-[#9b9bb5]'
              }`}
            >
              {pos.split(' ').map(s => s.slice(0, 3)).join('-')}
            </button>
          ))}
        </div>
      </div>

      {/* Rounded corners */}
      <div>
        <p className="text-[10px] text-[#6b6b8a] mb-1">Cantos arredondados ({layer.rounded ?? 0}px)</p>
        <input
          type="range" min={0} max={80} step={2}
          value={layer.rounded ?? 0}
          onChange={e => onUpdate(l => l.type === 'photo' ? { ...l, rounded: Number(e.target.value) } : l)}
          className="w-full accent-iara-500"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-[#c1c1d8] cursor-pointer">
        <input
          type="checkbox"
          checked={layer.shadow ?? false}
          onChange={e => onUpdate(l => l.type === 'photo' ? { ...l, shadow: e.target.checked } : l)}
          className="accent-iara-500"
        />
        Sombra
      </label>
    </div>
  )
}

// ─── FontPicker ─────────────────────────────────────────────────────
// Picker categorizado com search + preview visual de cada fonte.
// Fica expandido num dropdown (posicionamento natural no inspector).

function FontPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<CategoriaFonte | 'all'>('all')
  const atual = CATALOGO_FONTES.find(f => f.id === value) ?? CATALOGO_FONTES[0]

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return CATALOGO_FONTES.filter(f => {
      if (categoria !== 'all' && f.categoria !== categoria) return false
      if (!q) return true
      return f.label.toLowerCase().includes(q) || f.categoria.includes(q)
    })
  }, [busca, categoria])

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] text-[#6b6b8a]">Fonte</p>
        <span className="text-[9px] text-[#5a5a7a]" style={{ fontFamily: atual.cssFamily }}>
          {atual.label} · {CATEGORIAS[atual.categoria]}
        </span>
      </div>

      {/* Filtros por categoria */}
      <div className="flex gap-1 mb-2 overflow-x-auto no-scrollbar">
        {(['all', ...Object.keys(CATEGORIAS)] as Array<CategoriaFonte | 'all'>).map(cat => (
          <button
            key={cat}
            onClick={() => setCategoria(cat)}
            className={`shrink-0 px-2 py-1 rounded-md text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
              categoria === cat
                ? 'bg-iara-600/30 text-iara-200'
                : 'bg-[#0d0d1a] text-[#6b6b8a] border border-[#1a1a2e] hover:text-[#9b9bb5]'
            }`}
          >
            {cat === 'all' ? 'Todas' : CATEGORIAS[cat as CategoriaFonte]}
          </button>
        ))}
      </div>

      {/* Busca */}
      <input
        type="text"
        value={busca}
        onChange={e => setBusca(e.target.value)}
        placeholder="Buscar fonte..."
        className="w-full mb-2 px-2 py-1.5 rounded-md bg-[#08080f] border border-[#1a1a2e] text-[11px] text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-500"
      />

      {/* Lista */}
      <div className="grid grid-cols-2 gap-1 max-h-60 overflow-y-auto pr-1">
        {filtradas.map(f => {
          const ativo = value === f.id
          return (
            <button
              key={f.id}
              onClick={() => onChange(f.id)}
              className={`text-left p-2 rounded-md border transition-all ${
                ativo ? 'border-iara-500 bg-iara-600/20' : 'border-[#1a1a2e] bg-[#0d0d1a] hover:border-iara-700/40'
              }`}
              title={`${f.label} — ${f.dica ?? f.categoria}`}
            >
              <div
                className="text-[13px] font-bold truncate"
                style={{ fontFamily: f.cssFamily, color: ativo ? '#fff' : '#f1f1f8' }}
              >
                {f.label}
              </div>
              <div className="text-[9px] text-[#5a5a7a] uppercase tracking-wider">
                {f.dica ?? CATEGORIAS[f.categoria]}
              </div>
            </button>
          )
        })}
        {filtradas.length === 0 && (
          <p className="col-span-2 text-xs text-[#5a5a7a] text-center py-4">Nenhuma fonte com &ldquo;{busca}&rdquo;</p>
        )}
      </div>
    </div>
  )
}

// ─── ColorPicker ─────────────────────────────────────────────────────

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-10 gap-1">
        {CORES_50.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`aspect-square rounded-sm border ${value === c ? 'border-white ring-2 ring-iara-500' : 'border-[#1a1a2e]'}`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
      <input
        type="color"
        value={value.startsWith('#') ? value : '#ffffff'}
        onChange={e => onChange(e.target.value)}
        className="w-full h-6 rounded cursor-pointer"
      />
    </div>
  )
}

// Dummy usages pra satisfazer linter em imports grandes
void Plus
