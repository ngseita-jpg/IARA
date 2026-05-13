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

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FotoFundoDragger } from '@/components/foto-fundo-dragger'
import {
  X, Type, Palette, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Undo2, Redo2, Download, Trash2, Copy,
  ChevronLeft, ChevronRight, Plus, Eye,
  ArrowUp, ArrowDown, Share2, Loader2, MoreHorizontal,
  Upload, Sliders, ChevronDown,
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
  onUploadFotoParent?: (dataUrl: string) => void  // sincroniza foto nova com imagens[] do parent — sem isso PNG salvo fica com placeholder cinza
  watermark?: boolean
}

export function CarrosselCanvasEditor({ slides: slidesInit, imagensBase64, onFechar, onSalvar, onUploadFotoParent, watermark = false }: Props) {
  // ─── State ─────────────────────────────────────────────────────────
  const [slides, setSlides] = useState<Slide2[]>(slidesInit)
  const [slideIdx, setSlideIdx] = useState(0)
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)   // texto em modo edição in-place
  const [imageCache, setImageCache] = useState<ImageCache>(new Map())
  const [imagensCache, setImagensCache] = useState<string[]>([])            // dataURLs pra exibição HTML
  const [exportando, setExportando] = useState(false)
  // Progresso visual quando user clica SALVAR — antes era so spinner mudo.
  // Em carrossel de 8 slides com fotos pesadas demora 5-10s, user achava
  // que travou. Agora mostra "Renderizando 3/8..." em tempo real.
  const [exportProgresso, setExportProgresso] = useState<{ atual: number; total: number } | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Histórico (undo/redo)
  const [history, setHistory] = useState<Slide2[][]>([slidesInit])
  const [historyIdx, setHistoryIdx] = useState(0)
  const hydrating = useRef(false)

  // Drag state (1 dedo)
  const [dragState, setDragState] = useState<{
    layerId: string; startX: number; startY: number;
    origX: number; origY: number; origW: number; origH: number;
    mode: 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br'
  } | null>(null)

  // Pinch + rotate state (2 dedos) — escala fontSize/dimensões E rotaciona
  const pinchRef = useRef<{
    layerId: string
    initialDistance: number
    initialAngle: number       // ângulo inicial entre os 2 dedos (radianos)
    initialRotation: number    // rotação inicial da layer
    initialFontSizes?: number[]
    initialW?: number
    initialH?: number
    initialX?: number
    initialY?: number
  } | null>(null)

  // Tooltip de pinch — mostra fontSize ou dimensões enquanto user pincha
  const [pinchInfo, setPinchInfo] = useState<{ x: number; y: number; label: string } | null>(null)

  // Snap guides — linhas que aparecem quando layer alinha com centros/bordas
  const [snapGuides, setSnapGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] })

  // Mobile UX: tres modais full-screen no lugar de BottomSheet (que travava o
  // canvas por causa de drag-gesture concorrente). Cada modal e' SO pra editar
  // detalhes — toolbar contextual flutuante cobre a maioria dos casos.
  const [showFullEditor, setShowFullEditor] = useState(false)   // "Mais" da toolbar
  const [showSlideEditor, setShowSlideEditor] = useState(false) // botao Slide da topbar
  const [showAddMenu, setShowAddMenu] = useState(false)         // FAB "+"

  // Auto-save indicator — 'idle' | 'saving' | 'saved'.
  // saving aparece quando user faz mudança, vira saved após 800ms, some após 2s.
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimer = useRef<{ saving?: ReturnType<typeof setTimeout>; saved?: ReturnType<typeof setTimeout> } | null>(null)

  // Toast de feedback após download/compartilhamento concluir
  const [exportToast, setExportToast] = useState<string | null>(null)

  // Haptic feedback util — vibração curta em ações (iOS / Android)
  const haptic = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
    const dur = intensity === 'light' ? 8 : intensity === 'medium' ? 14 : 24
    try { navigator.vibrate(dur) } catch { /* ignored */ }
  }, [])

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
      trimmed.push(structuredClone(next))
      return trimmed.slice(-30)
    })
    setHistoryIdx(prev => Math.min(prev + 1, 29))

    // Auto-save indicator: "salvando" → "salvo" → fade out
    if (saveTimer.current?.saving) clearTimeout(saveTimer.current.saving)
    if (saveTimer.current?.saved) clearTimeout(saveTimer.current.saved)
    setSaveStatus('saving')
    saveTimer.current = saveTimer.current ?? {}
    saveTimer.current.saving = setTimeout(() => {
      setSaveStatus('saved')
      saveTimer.current!.saved = setTimeout(() => setSaveStatus('idle'), 1800)
    }, 600)
  }, [historyIdx])

  const undo = useCallback(() => {
    if (historyIdx === 0) return
    hydrating.current = true
    const prev = history[historyIdx - 1]
    setSlides(structuredClone(prev))
    setHistoryIdx(historyIdx - 1)
    setTimeout(() => { hydrating.current = false }, 0)
  }, [historyIdx, history])

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return
    hydrating.current = true
    const next = history[historyIdx + 1]
    setSlides(structuredClone(next))
    setHistoryIdx(historyIdx + 1)
    setTimeout(() => { hydrating.current = false }, 0)
  }, [historyIdx, history])

  // Bloqueia pinch-zoom da viewport SO sobre o canvas (antes era no document
  // inteiro com passive:false — matava scroll otimizado da pagina toda).
  // O canvas em si tem touchAction: none — basta cuidar do gesture iOS Safari.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const stage = stageContainerRef.current
    if (!stage) return
    const onGestureStart = (e: Event) => e.preventDefault()
    // Estes 3 sao iOS Safari especifico — bloqueiam zoom de viewport so quando
    // o gesture comeca SOBRE o canvas, sem afetar scroll de listas externas.
    stage.addEventListener('gesturestart', onGestureStart)
    stage.addEventListener('gesturechange', onGestureStart)
    stage.addEventListener('gestureend', onGestureStart)
    return () => {
      stage.removeEventListener('gesturestart', onGestureStart)
      stage.removeEventListener('gesturechange', onGestureStart)
      stage.removeEventListener('gestureend', onGestureStart)
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Guard CRITICA: se o evento veio de dentro de um campo editavel
      // (input, textarea, contenteditable), nao atropela. Evita o bug
      // "apagar caractere no mobile fecha o editor inteiro" — guard antiga
      // baseada so em editingTextId falhava em iOS quando o foco oscilava
      // pelo teclado virtual.
      const target = e.target as HTMLElement | null
      const active = document.activeElement as HTMLElement | null
      const elementoEditavel = (el: HTMLElement | null) => {
        if (!el) return false
        const tag = el.tagName
        return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
      }
      if (elementoEditavel(target) || elementoEditavel(active)) return
      if (editingTextId) return

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLayerId) { e.preventDefault(); deleteLayer(selectedLayerId) }
      } else if (e.key === 'Escape') {
        setSelectedLayerId(null); setEditingTextId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo, selectedLayerId, editingTextId])

  // ─── Mutações ─────────────────────────────────────────────────────
  // Quando true, updateLayer pula pushHistory — usado durante drag continuo.
  // Sem isso, cada pixel de movimento dispara structuredClone do estado +
  // 4 setStates + 2 setTimeouts (saving indicator). Em mobile = lag mortal.
  const isDraggingRef = useRef(false)

  function updateLayer(layerId: string, fn: (l: Layer) => Layer, opts: { skipHistory?: boolean } = {}) {
    const next = slides.map((s, i) => {
      if (i !== slideIdx) return s
      return { ...s, layers: s.layers.map(l => l.id === layerId ? fn(l) : l) }
    })
    setSlides(next)
    // Pula history se: (a) caller pediu, (b) estamos no meio de drag continuo
    // History sera commitado uma unica vez no pointerup
    if (!opts.skipHistory && !isDraggingRef.current) {
      pushHistory(next)
    }
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
    haptic('heavy')
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
    // Cap soft 50 layers/slide — alem disso editor fica lento + impossivel
    // de gerenciar visualmente. Mostra toast e nao adiciona.
    if (slide && slide.layers.length >= 50) {
      import('@/lib/toast').then(({ toast }) => {
        toast.warning('Limite de 50 elementos por slide. Apague algum antes de adicionar.')
      }).catch(() => null)
      return
    }
    const tl: TextLayer = {
      id: newId('t'),
      type: 'text',
      // Antes: x:10 y:40 w:80 h:20 — texto novo nascia ocupando 80% da
      // largura do slide. No mobile (canvas 360-380px) ficava enorme e
      // dificil de arrastar pro lugar certo. Agora nasce centralizado e
      // pequeno, fica mais facil posicionar.
      x: 25, y: 42, w: 50, h: 16,
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
    if (slide && slide.layers.length >= 50) {
      import('@/lib/toast').then(({ toast }) => {
        toast.warning('Limite de 50 elementos por slide. Apague algum antes de adicionar.')
      }).catch(() => null)
      return
    }
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

  // Upload nova foto direto do editor (file picker do dispositivo).
  // Antes: so dava pra usar fotos enviadas no setup inicial — usuario nao
  // conseguia adicionar nova depois de entrar no editor.
  async function uploadNovaFoto(file: File) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const raw = e.target?.result as string
      // Resize 2400px max @ JPEG 92% — preserva detalhe pra render em
      // 1440x1440. Antes era 800px @ 72% (era borrado em fotos pro).
      // imageSmoothingQuality 'high' ativa Lanczos no Chromium/Safari.
      const resized = await new Promise<string>((resolve) => {
        const img = new window.Image()
        img.onload = () => {
          const scale = Math.min(1, 2400 / Math.max(img.width, img.height))
          const w = Math.round(img.width * scale)
          const h = Math.round(img.height * scale)
          const canvas = document.createElement('canvas')
          canvas.width = w; canvas.height = h
          const ctx = canvas.getContext('2d')!
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, w, h)
          resolve(canvas.toDataURL('image/jpeg', 0.92))
        }
        img.onerror = () => resolve(raw)
        img.src = raw
      })

      // Adiciona na cache de imagens (HTML + canvas + parent)
      const novoIdx = imagensCache.length
      setImagensCache(prev => [...prev, resized])

      // CRITICO: sincroniza com parent imagens[] tambem. Sem isso, quando
      // user salva o carrossel, o renderer tenta carregar imageIdx = novoIdx
      // mas o cache do parent so tem fotos originais — PNG sai com placeholder
      // cinza no slot novo.
      onUploadFotoParent?.(resized)

      // Pre-load no canvas pra renderizar imediatamente
      const imgEl = new window.Image()
      imgEl.onload = () => {
        setImageCache(prev => {
          const next = new Map(prev)
          next.set(novoIdx, imgEl)
          return next
        })
        // Cria layer
        addPhotoLayer(novoIdx)
      }
      imgEl.src = resized
    }
    reader.readAsDataURL(file)
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
    if (selectedLayerId !== layerId) haptic('light')
    setSelectedLayerId(layerId)
    isDraggingRef.current = true   // bloqueia pushHistory ate pointerup
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

    // Snap guides — durante MOVE. Threshold 1.8%, snap pra alinhar.
    // Targets:
    //   1. Canvas: 0%, 50%, 100% (centros e bordas do slide)
    //   2. Outras layers: bordas (left/right/top/bottom) e centros (x, y)
    //      → permite alinhar elemento com OUTRO elemento (Figma/Canva-style)
    const SNAP_THRESHOLD = 1.8
    const otherLayers = slide.layers.filter(l => l.id !== dragState.layerId)

    // Coleta todos os "alvos" de snap (vertical = X, horizontal = Y)
    const targetsX: number[] = [0, 50, 100]
    const targetsY: number[] = [0, 50, 100]
    for (const o of otherLayers) {
      targetsX.push(o.x, o.x + o.w / 2, o.x + o.w)
      targetsY.push(o.y, o.y + o.h / 2, o.y + o.h)
    }

    const guidesV: number[] = []
    const guidesH: number[] = []
    let snapped = false

    updateLayer(dragState.layerId, l => {
      const next = { ...l }
      if (dragState.mode === 'move') {
        let nx = Math.max(0, Math.min(100 - l.w, dragState.origX + dx))
        let ny = Math.max(0, Math.min(100 - l.h, dragState.origY + dy))
        // Snap eixo X (vertical guides): borda esq, centro, borda dir
        const checkX = [nx, nx + l.w / 2, nx + l.w]
        for (const t of targetsX) {
          if (Math.abs(checkX[0] - t) < SNAP_THRESHOLD) { nx = t; guidesV.push(t); snapped = true; break }
          if (Math.abs(checkX[1] - t) < SNAP_THRESHOLD) { nx = t - l.w / 2; guidesV.push(t); snapped = true; break }
          if (Math.abs(checkX[2] - t) < SNAP_THRESHOLD) { nx = t - l.w; guidesV.push(t); snapped = true; break }
        }
        // Snap eixo Y (horizontal guides): borda topo, centro, borda base
        const checkY = [ny, ny + l.h / 2, ny + l.h]
        for (const t of targetsY) {
          if (Math.abs(checkY[0] - t) < SNAP_THRESHOLD) { ny = t; guidesH.push(t); snapped = true; break }
          if (Math.abs(checkY[1] - t) < SNAP_THRESHOLD) { ny = t - l.h / 2; guidesH.push(t); snapped = true; break }
          if (Math.abs(checkY[2] - t) < SNAP_THRESHOLD) { ny = t - l.h; guidesH.push(t); snapped = true; break }
        }
        next.x = nx
        next.y = ny
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

    // Otimizacao: so setState se guides REALMENTE mudaram (compara como string).
    // Antes, cada pointermove forcava re-render mesmo sem snap.
    const newV = Array.from(new Set(guidesV)).sort()
    const newH = Array.from(new Set(guidesH)).sort()
    setSnapGuides(prev => {
      const sameV = prev.v.length === newV.length && prev.v.every((x, i) => x === newV[i])
      const sameH = prev.h.length === newH.length && prev.h.every((x, i) => x === newH[i])
      return (sameV && sameH) ? prev : { v: newV, h: newH }
    })
    if (snapped) haptic('light')
  }

  function onPointerUp() {
    // Commit history UMA VEZ no fim do drag (em vez de 60 vezes/seg).
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      pushHistory(slides)
    }
    setDragState(null)
    setSnapGuides({ v: [], h: [] })
  }

  // ─── Pinch-to-resize na layer selecionada (2 dedos) ──────────
  function onCanvasTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 2 || !selectedLayerId) return
    const layer = slide.layers.find(l => l.id === selectedLayerId)
    if (!layer) return
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const distance = Math.hypot(dx, dy)
    const angle = Math.atan2(dy, dx)
    pinchRef.current = {
      layerId: selectedLayerId,
      initialDistance: distance,
      initialAngle: angle,
      initialRotation: layer.rotation ?? 0,
      initialFontSizes: layer.type === 'text'
        ? (layer as TextLayer).runs.map(r => r.fontSize ?? 40)
        : undefined,
      initialW: layer.w,
      initialH: layer.h,
      initialX: layer.x,
      initialY: layer.y,
    }
    isDraggingRef.current = true   // pula history durante pinch
    setDragState(null)
    haptic('light')
  }

  function onCanvasTouchMove(e: React.TouchEvent) {
    if (!pinchRef.current || e.touches.length !== 2) return
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const distance = Math.hypot(dx, dy)
    const scale = distance / pinchRef.current.initialDistance
    if (!isFinite(scale) || scale <= 0) return

    // Rotação: variação do ângulo entre os dedos (graus)
    const angle = Math.atan2(dy, dx)
    let rotationDelta = (angle - pinchRef.current.initialAngle) * (180 / Math.PI)
    // Snap a múltiplos de 15° quando próximo (granularidade que o feel pede).
    // Antes era um array hardcoded de 9 entries (45° em 45°). Agora gerado
    // dinamicamente cobrindo -180 a 180 em passos de 15°.
    const candidate = pinchRef.current.initialRotation + rotationDelta
    let finalRotation = candidate
    for (let t = -180; t <= 180; t += 15) {
      if (Math.abs(candidate - t) < 4) { finalRotation = t; break }
    }
    void rotationDelta

    // Posição do tooltip: ponto médio entre os 2 dedos
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
    let tipLabel = ''

    updateLayer(pinchRef.current.layerId, l => {
      const baseUpdate = { rotation: finalRotation }
      if (l.type === 'text' && pinchRef.current!.initialFontSizes) {
        const fontSizes = pinchRef.current!.initialFontSizes
        const newRuns = (l as TextLayer).runs.map((run, i) => ({
          ...run,
          fontSize: Math.max(8, Math.min(400, Math.round((fontSizes[i] ?? 40) * scale))),
        }))
        const maxFs = Math.max(...newRuns.map(r => r.fontSize ?? 40))
        tipLabel = `${maxFs}px${Math.abs(finalRotation) > 1 ? ` · ${Math.round(finalRotation)}°` : ''}`
        return { ...l, ...baseUpdate, runs: newRuns }
      }
      const initW = pinchRef.current!.initialW ?? l.w
      const initH = pinchRef.current!.initialH ?? l.h
      const initX = pinchRef.current!.initialX ?? l.x
      const initY = pinchRef.current!.initialY ?? l.y
      const newW = Math.max(5, Math.min(100, initW * scale))
      const newH = Math.max(3, Math.min(100, initH * scale))
      tipLabel = `${Math.round(newW)} × ${Math.round(newH)}${Math.abs(finalRotation) > 1 ? ` · ${Math.round(finalRotation)}°` : ''}`
      return {
        ...l,
        ...baseUpdate,
        x: Math.max(0, Math.min(100 - newW, initX + (initW - newW) / 2)),
        y: Math.max(0, Math.min(100 - newH, initY + (initH - newH) / 2)),
        w: newW,
        h: newH,
      }
    })

    setPinchInfo({ x: midX, y: midY, label: tipLabel })
  }

  function onCanvasTouchEnd(e: React.TouchEvent) {
    if (e.touches.length < 2) {
      // Commit history UMA VEZ no fim do pinch
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        pushHistory(slides)
      }
      pinchRef.current = null
      setPinchInfo(null)
    }
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
    setExportProgresso({ atual: 0, total: slides.length })
    try {
      await ensureFontsLoaded(collectFontsInUse())
      const hidden = document.createElement('canvas')
      hidden.width = CANVAS_SIZE
      hidden.height = CANVAS_SIZE

      for (let i = 0; i < slides.length; i++) {
        const s = slides[i]
        setExportProgresso({ atual: i + 1, total: slides.length })

        // Timeout de 15s por slide pra não pendurar pra sempre se canvas ou
        // imagem trava (causa comum de "save trava" reportado pelo user).
        const blob = await Promise.race([
          (async () => {
            await renderSlide2(hidden, s, imageCache, { watermark })
            return canvasToBlob(hidden)
          })(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Tempo esgotado no slide ${i + 1}`)), 15_000),
          ),
        ])

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `slide-${String(s.ordem).padStart(2, '0')}.png`
        a.click()
        URL.revokeObjectURL(url)
        await new Promise(r => setTimeout(r, 200))
      }
      onSalvar?.(slides)
      haptic('medium')
      setExportToast(`✓ ${slides.length} ${slides.length === 1 ? 'slide salvo' : 'slides salvos'} no seu dispositivo`)
      setTimeout(() => setExportToast(null), 4000)
    } catch (err) {
      console.error('[carrossel] export falhou:', err)
      const msg = err instanceof Error ? err.message : 'erro desconhecido'
      setExportToast(`✗ Save travou: ${msg}. Tenta o botão "Compartilhar" como alternativa.`)
      setTimeout(() => setExportToast(null), 6500)
    } finally {
      setExportando(false)
      setExportProgresso(null)
    }
  }

  async function compartilharInstagram() {
    if (!imageCache) return
    setExportando(true)
    setExportProgresso({ atual: 0, total: slides.length })
    try {
      // Garante todas as imagens carregadas antes de renderizar
      let cacheParaUsar = imageCache
      const idsUsados = new Set<number>()
      for (const s of slides) {
        if (s.background?.type === 'photo' && typeof s.background.imageIdx === 'number') {
          idsUsados.add(s.background.imageIdx)
        }
        for (const l of s.layers) {
          if (l.type === 'photo') idsUsados.add(l.imageIdx)
        }
      }
      const faltando = Array.from(idsUsados).filter(i => !imageCache.has(i))
      if (faltando.length > 0) {
        const novosSrcs = faltando.map(i => imagensCache[i]).filter(Boolean)
        if (novosSrcs.length > 0) {
          const novoCache = await preloadImages(novosSrcs)
          const merged = new Map(imageCache)
          let i = 0
          for (const idx of faltando) {
            const img = novoCache.get(i)
            if (img) merged.set(idx, img)
            i++
          }
          setImageCache(merged)
          cacheParaUsar = merged
        }
      }

      await ensureFontsLoaded(collectFontsInUse())
      const hidden = document.createElement('canvas')
      hidden.width = CANVAS_SIZE
      hidden.height = CANVAS_SIZE
      const files: File[] = []
      for (let i = 0; i < slides.length; i++) {
        const s = slides[i]
        setExportProgresso({ atual: i + 1, total: slides.length })
        await renderSlide2(hidden, s, cacheParaUsar, { watermark })
        const blob = await canvasToBlob(hidden)
        files.push(new File([blob], `slide-${String(s.ordem).padStart(2, '0')}.png`, { type: 'image/png' }))
      }
      await compartilharFiles(files)
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setExportToast('Não consegui salvar — tente novamente')
        setTimeout(() => setExportToast(null), 3500)
      }
    } finally {
      setExportando(false)
      setExportProgresso(null)
    }
  }

  // Helper: usa Web Share API no mobile (galeria/Instagram nativo) ou
  // fallback de download direto no desktop.
  async function compartilharFiles(files: File[]) {
    if (navigator.canShare?.({ files })) {
      await navigator.share({ files, title: 'Carrossel Iara' })
      haptic('medium')
      setExportToast('✓ Pronto! No iOS escolha "Salvar em Fotos" ou abra direto no Instagram')
      setTimeout(() => setExportToast(null), 4500)
    } else {
      for (const f of files) {
        const url = URL.createObjectURL(f)
        const a = document.createElement('a')
        a.href = url; a.download = f.name; a.click()
        URL.revokeObjectURL(url)
        await new Promise(r => setTimeout(r, 150))
      }
      haptic('medium')
      setExportToast(`✓ ${files.length} ${files.length === 1 ? 'imagem baixada' : 'imagens baixadas'}`)
      setTimeout(() => setExportToast(null), 4000)
    }
  }

  // ─── Render helpers (componentes filhos) ─────────────────────────────
  // Lock body scroll + esconde navbar/bottom-tabs do dashboard quando editor abre.
  // Antes: editor era fixed inset-0 z-50 bg opaco MAS o user reportou ver "Iara
  // logo no topo + modulos embaixo". Causa: navbar (z-40) ficava por baixo, mas
  // em iOS PWA com safe-area-inset-top o `inset-0` nao cobre a barra de status
  // — entao quando o editor "scrollava" um pouco, a navbar aparecia.
  // Solucao: data-attribute no body que CSS global usa pra esconder navbar.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.setAttribute('data-canvas-editor-open', '1')
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.removeAttribute('data-canvas-editor-open')
    }
  }, [])

  // ─── AUTO-SAVE REAL AO PARENT ───────────────────────────────────
  // Antes: o "Salvando/Salvo" indicador era ENGANOSO — so empilhava history
  // em memoria. Se user fechasse o editor sem clicar em Exportar/Salvar,
  // perdia TODAS as edicoes. Agora chama onSalvar(slides) com debounce 800ms
  // a cada mudanca + no unmount (sair do editor commita o ultimo state).
  const slidesRef = useRef(slides)
  useEffect(() => { slidesRef.current = slides }, [slides])
  useEffect(() => {
    if (!onSalvar) return
    if (hydrating.current) return  // nao salva durante undo/redo
    const t = setTimeout(() => onSalvar(slides), 800)
    return () => clearTimeout(t)
    // slides intencional — re-armar a cada mudanca
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides])
  // Save final no unmount (cobre o caso "fechar editor antes do debounce
  // disparar"). Usa ref pra pegar o estado mais recente.
  useEffect(() => {
    return () => { if (onSalvar) onSalvar(slidesRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!slide) return null

  return (
    <div
      // z-[100] garante que fica acima de QUALQUER coisa do dashboard layout
      // (navbar z-40, modais auxiliares z-50). Cobre status bar via inset-0.
      className="fixed inset-0 z-[100] bg-[#050510] flex flex-col"
      // touch-action: none bloqueia pinch-zoom e gestos default do browser (iOS Safari)
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* Todas as fontes do catálogo em um único stylesheet Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} />

      {/* Topbar — responsivo: labels somem no mobile, ícones permanecem */}
      <div
        className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 border-b border-[#1a1a2e] bg-[#0a0a14] flex-shrink-0"
        // CRITICO: respeita safe-area-inset-top do iOS — sem isso a barra de
        // status (bateria/horario/notch) tampava o botao Voltar e o SALVAR.
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onFechar}
            aria-label="Fechar editor e voltar"
            className="flex items-center gap-1.5 px-3 min-h-11 rounded-lg bg-[#13131f] border border-[#2a2a4a] hover:border-[#3a3a5a] active:scale-95 text-[#c1c1d8] hover:text-white text-sm font-semibold transition-all flex-shrink-0"
            title="Fechar editor (Esc)"
          >
            <X className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <div className="min-w-0 flex items-center gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#f1f1f8] truncate">Editor Canvas</p>
              <p className="text-[11px] text-[#5a5a7a] truncate hidden sm:block">Slide {slideIdx + 1} de {slides.length} · arraste, clique, edite</p>
              <p className="text-[10px] text-[#5a5a7a] sm:hidden">{slideIdx + 1}/{slides.length}</p>
            </div>
            {/* Auto-save indicator — sutil, anima entrada/saída */}
            <AnimatePresence mode="wait">
              {saveStatus !== 'idle' && (
                <motion.div
                  key={saveStatus}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18 }}
                  // Mobile target principal — antes era hidden sm:flex (so desktop)
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#13131f] border border-[#2a2a4a]"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-iara-400" />
                      <span className="text-[10px] text-[#9b9bb5] hidden sm:inline">Salvando…</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-[10px] text-green-400 hidden sm:inline">Salvo</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
          {/* Botao "Slide" mobile — abre modal de fundo (cor, gradiente, foto).
              No desktop fica no Inspector lateral por padrao. */}
          <button
            onClick={() => { setShowSlideEditor(true); haptic('light') }}
            aria-label="Configurar fundo do slide"
            className="lg:hidden flex items-center gap-1 px-2.5 min-h-11 rounded-lg bg-[#13131f] border border-[#2a2a4a] active:scale-95 text-[#c1c1d8] text-xs font-semibold"
          >
            <Sliders className="w-3.5 h-3.5" /> Slide
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13131f] border border-[#2a2a4a] text-[#9b9bb5] hover:text-white text-xs font-medium"
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            onClick={compartilharInstagram}
            disabled={exportando}
            className="flex items-center gap-1.5 px-3 sm:px-4 min-h-11 rounded-lg bg-gradient-to-r from-emerald-500 to-iara-500 hover:opacity-90 active:scale-95 disabled:opacity-40 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-900/40 transition"
            title="Salvar imagens no celular (galeria) ou compartilhar"
          >
            {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>
              {exportProgresso
                ? `${exportProgresso.atual}/${exportProgresso.total}`
                : 'SALVAR'}
            </span>
          </button>
          <button
            onClick={exportarTodosPng}
            disabled={exportando}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-iara-600 hover:bg-iara-500 disabled:opacity-40 text-white text-[10px] sm:text-xs font-bold shadow-lg shadow-iara-900/30"
            title="Baixar como PNG"
          >
            {exportando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>PNG</span>
          </button>
        </div>
      </div>

      {/* Thumbs horizontais — APENAS mobile, sempre visíveis pra trocar de slide */}
      <div className="md:hidden flex-shrink-0 border-b border-[#1a1a2e] bg-[#08080f] px-2 py-2">
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar"
          style={{ touchAction: 'pan-x' }}
        >
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

      {/* Body: thumbnails(desktop) | wrapper-canvas-and-mobile-inspector | inspector(desktop) */}
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

        {/* Wrapper vertical — canvas + inspector mobile (este vira flex-sibling pra encolher canvas) */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* Canvas central — responsivo via ResizeObserver, encolhe quando inspector mobile abre */}
          <div
            ref={stageContainerRef}
            className="flex-1 flex items-center justify-center relative overflow-hidden bg-[#050510] min-h-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #050510 80%)',
              touchAction: 'none',
            }}
            onClick={() => { setSelectedLayerId(null); setEditingTextId(null) }}
            onTouchStart={onCanvasTouchStart}
            onTouchMove={onCanvasTouchMove}
            onTouchEnd={onCanvasTouchEnd}
            onTouchCancel={onCanvasTouchEnd}
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
              onDeleteLayer={deleteLayer}
              displaySize={canvasDisplaySize}
            />

            {/* Snap guides — linhas magenta sutis durante drag */}
            <AnimatePresence>
              {snapGuides.v.map(v => (
                <motion.div
                  key={`v-${v}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.08 }}
                  className="absolute pointer-events-none"
                  style={{
                    left: `calc(50% - ${canvasDisplaySize / 2}px + ${(v / 100) * canvasDisplaySize}px)`,
                    top: `calc(50% - ${canvasDisplaySize / 2}px)`,
                    width: 1,
                    height: canvasDisplaySize,
                    background: 'linear-gradient(180deg, transparent 0%, #ec4899 30%, #ec4899 70%, transparent 100%)',
                    boxShadow: '0 0 8px rgba(236,72,153,0.6)',
                  }}
                />
              ))}
              {snapGuides.h.map(h => (
                <motion.div
                  key={`h-${h}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.08 }}
                  className="absolute pointer-events-none"
                  style={{
                    top: `calc(50% - ${canvasDisplaySize / 2}px + ${(h / 100) * canvasDisplaySize}px)`,
                    left: `calc(50% - ${canvasDisplaySize / 2}px)`,
                    height: 1,
                    width: canvasDisplaySize,
                    background: 'linear-gradient(90deg, transparent 0%, #ec4899 30%, #ec4899 70%, transparent 100%)',
                    boxShadow: '0 0 8px rgba(236,72,153,0.6)',
                  }}
                />
              ))}
            </AnimatePresence>

            {/* Pinch tooltip — pill flutuante mostrando tamanho durante pinch */}
            <AnimatePresence>
              {pinchInfo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="fixed z-50 px-3 py-1.5 rounded-full bg-[#0a0a14]/95 border border-iara-500/60 backdrop-blur-sm pointer-events-none shadow-xl"
                  style={{
                    left: pinchInfo.x,
                    top: pinchInfo.y - 50,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <span className="text-xs font-bold text-white tabular-nums">{pinchInfo.label}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navegação slim no canto inferior direito — sempre visível, mais discreta */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-[#0a0a14]/85 border border-[#1a1a2e] backdrop-blur-sm shadow-lg pointer-events-auto">
              <button
                onClick={() => { setSlideIdx(Math.max(0, slideIdx - 1)); haptic('light') }}
                disabled={slideIdx === 0}
                className="p-1 rounded-full hover:bg-[#1a1a2e] disabled:opacity-25 text-[#9b9bb5] active:scale-90 transition-transform"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[10px] text-[#9b9bb5] min-w-[28px] text-center tabular-nums font-medium">{slideIdx + 1}/{slides.length}</span>
              <button
                onClick={() => { setSlideIdx(Math.min(slides.length - 1, slideIdx + 1)); haptic('light') }}
                disabled={slideIdx === slides.length - 1}
                className="p-1 rounded-full hover:bg-[#1a1a2e] disabled:opacity-25 text-[#9b9bb5] active:scale-90 transition-transform"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Toolbar contextual flutuante — aparece SO quando ha layer
              selecionada, posicao fixa no bottom (sem drag handle conflitando
              com toques no canvas). Padrao Canva/Procreate. */}
          <AnimatePresence>
            {selectedLayer && (
              <motion.div
                key="floating-toolbar"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="lg:hidden fixed left-3 right-3 z-30"
                style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
              >
                <div className="rounded-2xl bg-[#0a0a14]/95 backdrop-blur border border-[#2a2a4a] shadow-2xl shadow-black/60">
                  <ContextualToolbar
                    layer={selectedLayer}
                    onDelete={() => deleteLayer(selectedLayer.id)}
                    onDuplicate={() => duplicateLayer(selectedLayer.id)}
                    onMoveZ={(dir) => moveLayerZ(selectedLayer.id, dir)}
                    onUpdateLayer={(fn) => updateLayer(selectedLayer.id, fn)}
                    onExpand={() => { setShowFullEditor(true); haptic('medium') }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FAB "+" — adicionar elementos. So aparece quando NAO ha selecao
              (pra nao competir com a toolbar contextual). */}
          {!selectedLayer && (
            <button
              onClick={() => { setShowAddMenu(true); haptic('light') }}
              aria-label="Adicionar texto, foto ou nova imagem"
              className="lg:hidden fixed right-4 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-iara-500 to-accent-purple shadow-2xl shadow-iara-900/60 flex items-center justify-center text-white active:scale-90 transition-transform"
              style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
            >
              <Plus className="w-6 h-6" />
            </button>
          )}

          {/* FAB Salvar removido — usuario reportou que atrapalhava o canvas
              (tampava layers da metade esquerda). O botao SALVAR gigante
              gradient verde da topbar ja e' suficientemente visivel. */}

          {/* Modal: Mais opcoes da layer (Inspector completo) */}
          <FullScreenModal
            open={showFullEditor && !!selectedLayer}
            onClose={() => setShowFullEditor(false)}
            titulo={
              selectedLayer?.type === 'text' ? 'Editar texto'
              : selectedLayer?.type === 'photo' ? 'Editar foto'
              : 'Editar forma'
            }
          >
            {selectedLayer && (
              <Inspector
                slide={slide}
                selected={selectedLayer}
                onUpdateLayer={(fn) => updateLayer(selectedLayer.id, fn)}
                onUpdateSlide={updateSlide}
                onDelete={() => { deleteLayer(selectedLayer.id); setShowFullEditor(false) }}
                onDuplicate={() => duplicateLayer(selectedLayer.id)}
                onMoveZ={(dir) => moveLayerZ(selectedLayer.id, dir)}
                onAddText={() => { addTextLayer(); setShowFullEditor(false) }}
                onAddPhoto={(idx) => { addPhotoLayer(idx); setShowFullEditor(false) }}
                onUploadFoto={uploadNovaFoto}
                onSelectLayer={(id) => setSelectedLayerId(id)}
                onMoveLayerById={(id, dir) => moveLayerZ(id, dir)}
                onDeleteLayerById={(id) => deleteLayer(id)}
                imagensCache={imagensCache}
              />
            )}
          </FullScreenModal>

          {/* Modal: configurar fundo do slide */}
          <FullScreenModal
            open={showSlideEditor}
            onClose={() => setShowSlideEditor(false)}
            titulo={`Slide ${slideIdx + 1} — fundo`}
          >
            <div className="p-4">
              <SlideBackgroundEditor slide={slide} onUpdateSlide={updateSlide} imagensCache={imagensCache} />
            </div>
          </FullScreenModal>

          {/* Modal: menu de adicionar (acionado pelo FAB) */}
          <FullScreenModal
            open={showAddMenu}
            onClose={() => setShowAddMenu(false)}
            titulo="Adicionar"
          >
            <AddElementsMenu
              imagensCache={imagensCache}
              onAddText={() => { addTextLayer(); setShowAddMenu(false) }}
              onAddPhoto={(idx) => { addPhotoLayer(idx); setShowAddMenu(false) }}
              onUploadFoto={async (file) => { await uploadNovaFoto(file); setShowAddMenu(false) }}
              onOpenSlide={() => { setShowAddMenu(false); setShowSlideEditor(true) }}
            />
          </FullScreenModal>
        </div>

        {/* Inspector direita (desktop) */}
        <div
          className="hidden lg:flex flex-col w-80 overflow-y-auto border-l border-[#1a1a2e] bg-[#08080f]"
          style={{ touchAction: 'pan-y' }}
        >
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
            onUploadFoto={uploadNovaFoto}
            onSelectLayer={(id) => setSelectedLayerId(id)}
            onMoveLayerById={(id, dir) => moveLayerZ(id, dir)}
            onDeleteLayerById={(id) => deleteLayer(id)}
            imagensCache={imagensCache}
          />
        </div>
      </div>


      {/* Preview modal */}
      {showPreview && (
        <PreviewModal
          slides={slides}
          imageCache={imageCache}
          watermark={watermark}
          onFechar={() => setShowPreview(false)}
        />
      )}

      {/* Toast de feedback após export — fica no topo central, claro e some sozinho */}
      <AnimatePresence>
        {exportToast && (
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="fixed top-4 left-1/2 z-[100] -translate-x-1/2 px-4 py-2.5 rounded-full bg-gradient-to-r from-iara-600 to-accent-purple text-white text-xs sm:text-sm font-semibold shadow-2xl shadow-iara-900/60 max-w-[92vw] whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ pointerEvents: 'none' }}
          >
            {exportToast}
          </motion.div>
        )}
      </AnimatePresence>
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
  onDeleteLayer: (id: string) => void  // pra auto-deletar text vazio no blur
  displaySize: number
}

function CanvasStage({
  slide, imagensCache, selectedLayerId, editingTextId,
  onSelectLayer, onStartEditText, onLayerPointerDown, onPointerMove, onPointerUp,
  onUpdateLayer, onDeleteLayer, displaySize,
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
      className="relative shadow-2xl rounded-xl overflow-hidden touch-none select-none"
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
          onStopEdit={(runsFinais) => {
            // Auto-delete text vazio no blur — comportamento Canva/Figma.
            // Reverter via Ctrl+Z se foi por engano (history captura snapshot).
            const textoFinal = (runsFinais ?? []).map(r => r.text).join('').trim()
            if (textoFinal === '') {
              onDeleteLayer(layer.id)
              return
            }
            onStartEditText(null)
          }}
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
  onStopEdit: (runsFinais?: Run[]) => void
}

// React.memo: sem isso, qualquer drag re-clonava `slides` e fazia TODAS as
// layers re-renderizarem. Em slide com 8+ layers virava 50-200ms de jank por
// frame de movimento. O comparador raso de memo faz cada layer so re-renderizar
// se o seu proprio objeto mudou.
const LayerView = React.memo(function LayerView({
  layer, selected, editing, imagensCache, pxFromPct, displaySize, onPointerDown, onDoubleClick, onUpdateText, onStopEdit,
}: LayerViewProps) {
  const common = {
    position: 'absolute' as const,
    left: pxFromPct(layer.x),
    top: pxFromPct(layer.y),
    width: pxFromPct(layer.w),
    height: pxFromPct(layer.h),
    transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
    // Selection ring suave estilo Canva — box-shadow em vez de outline
    boxShadow: selected
      ? '0 0 0 2px #6366f1, 0 0 0 4px rgba(99,102,241,0.25), 0 6px 24px rgba(99,102,241,0.3)'
      : undefined,
    cursor: editing ? 'text' : selected ? 'move' : 'pointer',
    userSelect: editing ? ('text' as const) : ('none' as const),
    transition: 'box-shadow 120ms ease',
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
              // key={layer.id} forca remount fresh quando user re-tap em
              // outra layer rapidamente — evita race do useEffect[] reusar
              // instancia anterior com runs desatualizado.
              key={t.id}
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
  // CRÍTICO: stopPropagation no onClick também — senão o click bubla pro canvas
  // wrapper que faz onSelectLayer(null), desselecionando ao soltar o mouse.
  return (
    <div
      onPointerDown={(e) => !editing && onPointerDown(e, layer.id, 'move')}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={onDoubleClick}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      {content}
    </div>
  )
})

// Handles de resize nos 4 cantos.
// Visual: bolinha 16px. Hit area: 44px (WCAG AAA touch), expandida via padding invisível.
// touch-action none + select-none pra evitar que o navegador interprete como scroll/seleção de texto.
function ResizeHandles({ onPointerDown }: { onPointerDown: (e: React.PointerEvent, mode: 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br') => void }) {
  const handle = (mode: 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br', pos: { top?: number; left?: number; right?: number; bottom?: number; cursor: string }) => (
    <div
      onPointerDown={e => {
        e.stopPropagation()
        e.preventDefault()
        // Captura o pointer no PRÓPRIO handle pra não perder se sair do bounding box
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        onPointerDown(e, mode)
      }}
      onClick={(e) => e.stopPropagation()}
      className="touch-none select-none"
      style={{
        position: 'absolute',
        // Hit area 44x44 (era 32) pra atender WCAG AAA touch — mobile difícil
        // de agarrar com 32px especialmente em dedos grandes/handles próximos.
        width: 44, height: 44,
        cursor: pos.cursor,
        zIndex: 20,
        // Offset ajustado pra manter o visual da bolinha na mesma posição
        // do canto, só o hit area cresceu simetricamente ao redor.
        ...(pos.top !== undefined  ? { top:  (pos.top  ?? 0) - 16 } : {}),
        ...(pos.bottom !== undefined ? { bottom: (pos.bottom ?? 0) - 16 } : {}),
        ...(pos.left !== undefined ? { left: (pos.left ?? 0) - 16 } : {}),
        ...(pos.right !== undefined ? { right: (pos.right ?? 0) - 16 } : {}),
        // Centraliza visual no centro do hit area
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Visual da bolinha */}
      <div style={{
        width: 16, height: 16,
        backgroundColor: '#6366f1',
        border: '3px solid #fff',
        borderRadius: '50%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
      }} />
    </div>
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
  onChange: (runs: Run[]) => void; onBlur: (runsFinais: Run[]) => void
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

  // Re-injeta quando displaySize muda (rotacao do device altera scale).
  // Sem isso, texto fica em escala errada ate o user blur+re-tap.
  useEffect(() => {
    if (!ref.current) return
    const sel = window.getSelection()
    const tinhaFoco = document.activeElement === ref.current
    // So atualiza o font-size dos spans existentes — preserva texto e cursor
    const spans = ref.current.querySelectorAll('span[data-run="1"]')
    spans.forEach((span, i) => {
      const run = runs[i]
      if (run?.fontSize) (span as HTMLElement).style.fontSize = `${run.fontSize * scale}px`
    })
    if (tinhaFoco) ref.current.focus()
    void sel
    // intencional: so dispara em mudanca de scale, nao de runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale])

  function extractRuns(): Run[] {
    if (!ref.current) return runs
    // Template = formatacao da PRIMEIRA run original. Se o user apagar tudo
    // e reescrever, novos chars herdam essa formatacao (cor, fonte, tamanho)
    // em vez de virar texto generico sem style.
    const template: Run = runs[0] ?? { text: '' }

    // Procura formatacao herdada subindo a arvore — necessario pra suportar
    // execCommand (foreColor/fontName/bold) que cria spans aninhados SEM
    // data-run, e pra texto raw fora de qualquer span (pega do template).
    function styleHerdado(node: Node): Partial<Run> {
      const acc: Partial<Run> = {}
      let p: HTMLElement | null = node.nodeType === Node.ELEMENT_NODE
        ? (node as HTMLElement)
        : node.parentElement
      while (p && p !== ref.current) {
        const s = p.style
        if (!acc.color && s?.color) acc.color = s.color
        if (!acc.fontSize && s?.fontSize) {
          acc.fontSize = Math.round(parseFloat(s.fontSize) / scale)
        }
        if (!acc.fontFamily && s?.fontFamily) {
          acc.fontFamily = s.fontFamily.replace(/['"]/g, '').split(',')[0].trim()
        }
        if (acc.bold === undefined) {
          if (s?.fontWeight === '700' || s?.fontWeight === 'bold' || p.tagName === 'B' || p.tagName === 'STRONG') {
            acc.bold = true
          }
        }
        if (acc.italic === undefined) {
          if (s?.fontStyle === 'italic' || p.tagName === 'I' || p.tagName === 'EM') {
            acc.italic = true
          }
        }
        if (acc.underline === undefined && (s?.textDecoration?.includes('underline') || p.tagName === 'U')) {
          acc.underline = true
        }
        if (!acc.letterSpacing && s?.letterSpacing) {
          acc.letterSpacing = Math.round(parseFloat(s.letterSpacing) / scale)
        }
        p = p.parentElement
      }
      return acc
    }

    const result: Run[] = []
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? ''
        if (!text) return
        const herdado = styleHerdado(node)
        // Mescla template (default) + herdado (override do span). Permite
        // user mudar cor/fonte de UMA palavra via execCommand sem perder
        // o resto da formatacao.
        result.push({
          text,
          color: herdado.color ?? template.color,
          fontSize: herdado.fontSize ?? template.fontSize,
          fontFamily: (herdado.fontFamily ?? template.fontFamily) as Run['fontFamily'],
          bold: herdado.bold ?? template.bold,
          italic: herdado.italic ?? template.italic,
          underline: herdado.underline ?? template.underline,
          letterSpacing: herdado.letterSpacing ?? template.letterSpacing,
        })
      } else {
        for (const child of Array.from(node.childNodes)) walk(child)
      }
    }
    walk(ref.current)

    const filtered = result.filter(r => r.text.length > 0)
    // Garantia: se ficou TUDO vazio (user apagou ate o ultimo char), retorna
    // pelo menos uma run vazia com o template — preserva formatacao pra
    // proximos chars. Sem isso, runs=[] zerava cor/fonte/tamanho na proxima
    // digitacao.
    if (filtered.length === 0) return [{ ...template, text: '' }]
    return filtered
  }

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      // Mobile: evita autocorrect/capitalize/spellcheck que mexem na string
      // do contenteditable e quebram o re-extract de runs (resultado: cursor
      // pula, letras somem, texto duplica). Resolve "apagar texto fica horrivel"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      inputMode="text"
      onInput={() => onChange(extractRuns())}
      onBlur={() => {
        const runsFinais = extractRuns()
        onChange(runsFinais)
        onBlur(runsFinais)
      }}
      onKeyDown={(e) => {
        // Blindagem dupla: stopPropagation impede o evento de subir pro window
        // listener do editor que deletava layer no Backspace. Mesmo que o
        // window listener ja tenha guard de contenteditable, esse stop garante
        // robustez em iOS quando o foco oscila com teclado virtual.
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.stopPropagation()
          // NAO preventDefault — backspace nativo do contenteditable continua apagando
        }
        if (e.key === 'Escape') { e.stopPropagation(); e.currentTarget.blur() }
        // Enter sem shift no mobile = blur (commit do texto). Shift+Enter quebra linha.
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          e.stopPropagation()
          e.currentTarget.blur()
        }
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
  const [renderizou, setRenderizou] = useState(false)

  useEffect(() => {
    if (!ref.current || !imageCache) return
    renderSlide2(ref.current, slide, imageCache, {}).then(() => setRenderizou(true))
  }, [slide, imageCache])

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      className={`relative aspect-square w-full rounded-lg overflow-hidden border-2 transition-all ${
        active
          ? 'border-iara-500 shadow-[0_0_0_2px_rgba(99,102,241,0.3),0_4px_16px_rgba(99,102,241,0.4)]'
          : 'border-[#1a1a2e] hover:border-[#2a2a4a]'
      }`}
      style={{ scale: active ? 1.04 : 1 }}
    >
      {/* Skeleton shimmer enquanto canvas não renderiza */}
      {!renderizou && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#13131f] to-[#1a1a2e] animate-pulse" />
      )}
      <canvas ref={ref} width={1080} height={1080} style={{ width: '100%', height: '100%', opacity: renderizou ? 1 : 0, transition: 'opacity 200ms' }} />
      <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white tabular-nums backdrop-blur-sm">
        {number}
      </span>
    </motion.button>
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
        {/* width/height matchando CANVAS_SIZE (1440) — antes estava 1080
            mas renderer escreve em 1440 e canvas DOM downscalava com perda. */}
        <canvas ref={ref} width={1440} height={1440} className="max-w-[90vw] max-h-[75vh] rounded-xl shadow-2xl" style={{ aspectRatio: '1/1' }} />
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
  onUploadFoto: (file: File) => void | Promise<void>
  // Painel "Camadas" — gerenciar Z-order quando texto fica escondido atras
  onSelectLayer?: (id: string) => void
  onMoveLayerById?: (id: string, dir: 'up' | 'down') => void
  onDeleteLayerById?: (id: string) => void
  imagensCache: string[]
  compact?: boolean
}

function Inspector(props: InspectorProps) {
  const {
    slide, selected, onUpdateLayer, onUpdateSlide, onDelete, onDuplicate, onMoveZ,
    onAddText, onAddPhoto, onUploadFoto,
    onSelectLayer, onMoveLayerById, onDeleteLayerById,
    imagensCache, compact,
  } = props
  const fileInputRef = useRef<HTMLInputElement>(null)

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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onUploadFoto(file)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            />
            <div className="grid grid-cols-3 gap-2">
              <button onClick={onAddText}
                className="flex flex-col items-center gap-1 p-3 min-h-16 rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] hover:border-iara-500 active:scale-95 text-[#c1c1d8] hover:text-white text-xs transition">
                <Type className="w-4 h-4" />
                Texto
              </button>
              <button
                onClick={() => imagensCache.length > 0 && onAddPhoto(0)}
                disabled={imagensCache.length === 0}
                className="flex flex-col items-center gap-1 p-3 min-h-16 rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] hover:border-iara-500 active:scale-95 disabled:opacity-30 text-[#c1c1d8] hover:text-white text-xs transition"
              >
                <ImageIcon className="w-4 h-4" />
                Foto
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1 p-3 min-h-16 rounded-xl border border-iara-700/40 bg-iara-900/20 hover:bg-iara-900/40 active:scale-95 text-iara-300 hover:text-iara-200 text-xs font-semibold transition"
                title="Enviar nova foto do dispositivo"
              >
                <ImageIcon className="w-4 h-4" />
                + Upload
              </button>
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

          {/* Painel Camadas — lista todas as layers do slide com botoes pra
              reordenar, selecionar e deletar. Resolve "textos as vezes ficam
              escondidos atras de outras layers" — agora user enxerga a pilha
              completa e move com 1 toque. Layers no fim do array renderizam
              POR CIMA, entao listo invertido (topo da lista = topo visual). */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#6b6b8a] mb-2">
              Camadas ({slide.layers.length})
            </p>
            {slide.layers.length === 0 ? (
              <p className="text-[11px] text-[#5a5a7a] italic">Nenhum elemento no slide. Use os botões acima pra adicionar.</p>
            ) : (
              <div className="space-y-1.5">
                {[...slide.layers].reverse().map((l, idxRev) => {
                  const idx = slide.layers.length - 1 - idxRev
                  const ePrimeiro = idx === slide.layers.length - 1   // topo visual
                  const eUltimo = idx === 0                            // fundo visual
                  const tipoLabel = l.type === 'text'
                    ? ((l as TextLayer).runs[0]?.text || 'Texto vazio').slice(0, 24)
                    : l.type === 'photo'
                    ? `Foto ${(l as PhotoLayer).imageIdx + 1}`
                    : 'Forma'
                  const tipoIcon = l.type === 'text' ? <Type className="w-3.5 h-3.5" />
                    : l.type === 'photo' ? <ImageIcon className="w-3.5 h-3.5" />
                    : <Palette className="w-3.5 h-3.5" />
                  return (
                    <div key={l.id} className="flex items-center gap-1 rounded-lg bg-[#0d0d1a] border border-[#1a1a2e] p-1.5">
                      <button
                        onClick={() => onSelectLayer?.(l.id)}
                        className="flex-1 flex items-center gap-2 min-w-0 px-1 py-1 rounded hover:bg-[#1a1a2e] active:scale-95 transition text-left"
                      >
                        <span className="flex-shrink-0 text-iara-400">{tipoIcon}</span>
                        <span className="text-[11px] text-[#c1c1d8] truncate">{tipoLabel}</span>
                      </button>
                      <button
                        onClick={() => onMoveLayerById?.(l.id, 'up')}
                        disabled={ePrimeiro}
                        title="Trazer pra frente"
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#1a1a2e] disabled:opacity-30 text-[#9b9bb5]"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onMoveLayerById?.(l.id, 'down')}
                        disabled={eUltimo}
                        title="Mandar pra trás"
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#1a1a2e] disabled:opacity-30 text-[#9b9bb5]"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteLayerById?.(l.id)}
                        title="Excluir"
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-900/30 text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            <p className="text-[10px] text-[#5a5a7a] leading-relaxed mt-2 italic">
              Toque num elemento pra editar. ↑ traz pra frente, ↓ manda pra trás.
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
        // Mobile: bloqueia bubble pro window listener que deletava layer no Backspace
        onKeyDown={e => {
          if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Escape') {
            e.stopPropagation()
          }
        }}
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

      {/* Modo de enquadramento — Cover (preenche cortando) vs Contain (foto inteira) */}
      <div>
        <p className="text-[10px] text-[#6b6b8a] mb-1.5">Modo da foto</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onUpdate(l => l.type === 'photo' ? { ...l, fit: 'cover' } : l)}
            className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
              (layer.fit ?? 'cover') === 'cover'
                ? 'border-iara-500 bg-iara-600/20 text-iara-200'
                : 'border-[#1a1a2e] bg-[#0d0d1a] text-[#9b9bb5]'
            }`}
          >
            <div className="text-[10px] mb-0.5">Preencher</div>
            <div className="text-[8px] opacity-70">corta sobras</div>
          </button>
          <button
            onClick={() => onUpdate(l => l.type === 'photo' ? { ...l, fit: 'contain' } : l)}
            className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
              layer.fit === 'contain'
                ? 'border-iara-500 bg-iara-600/20 text-iara-200'
                : 'border-[#1a1a2e] bg-[#0d0d1a] text-[#9b9bb5]'
            }`}
          >
            <div className="text-[10px] mb-0.5">Inteira</div>
            <div className="text-[8px] opacity-70">sem cortes</div>
          </button>
        </div>
      </div>

      {/* Posicionar foto livremente — crosshair + sliders + 9 atalhos.
          Reusa FotoFundoDragger que ja existe pro background do slide.
          Resolve "fotos ficam cortadas, dificil reposicionar". */}
      {imagensCache[layer.imageIdx] && (
        <div>
          <p className="text-[10px] text-[#6b6b8a] mb-1.5">Posição da foto (arraste pra ajustar)</p>
          <FotoFundoDragger
            fotoSrc={imagensCache[layer.imageIdx]}
            valor={layer.objectPosition ?? 'center'}
            onChange={(novo) => onUpdate(l => l.type === 'photo' ? { ...l, objectPosition: novo } : l)}
          />
        </div>
      )}

      {/* Zoom — so faz sentido em modo Cover */}
      {(layer.fit ?? 'cover') === 'cover' && (
        <div>
          <p className="text-[10px] text-[#6b6b8a] mb-1">Zoom da foto ({((layer.zoom ?? 1) * 100).toFixed(0)}%)</p>
          <input
            type="range"
            min={1.0} max={3.0} step={0.05}
            value={layer.zoom ?? 1}
            onChange={e => onUpdate(l => l.type === 'photo' ? { ...l, zoom: Number(e.target.value) } : l)}
            className="w-full accent-iara-500"
          />
        </div>
      )}

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

// ─── FullScreenModal — substitui BottomSheet pra todas as edicoes pesadas ──
// Razao: BottomSheet com drag handle competia com touches no canvas
// (gesto disputado = lag percebido em iPhone 17 Pro Max). Modal full-screen
// e' o padrao iOS native — sem conflito de gesture, sem reflow continuo.
function FullScreenModal({
  open, onClose, titulo, children,
}: {
  open: boolean; onClose: () => void; titulo: string; children: React.ReactNode
}) {
  // Lock scroll do body quando aberto
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            onClick={e => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 top-12 bg-[#0a0a14] rounded-t-3xl border-t border-[#1a1a2e] flex flex-col shadow-2xl shadow-black/60 overflow-hidden"
            style={{ touchAction: 'pan-y' }}
          >
            {/* Header sticky com Done — padrao iOS */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a2e] flex-shrink-0 bg-[#0a0a14]">
              <button
                onClick={onClose}
                className="px-3 min-h-11 rounded-lg text-sm font-semibold text-[#9b9bb5] active:scale-95 active:bg-[#1a1a2e] transition"
              >
                Cancelar
              </button>
              <p className="text-sm font-bold text-[#f1f1f8] truncate flex-1 text-center">{titulo}</p>
              <button
                onClick={onClose}
                className="px-3 min-h-11 rounded-lg text-sm font-bold text-iara-400 active:scale-95 active:bg-iara-900/30 transition"
              >
                Pronto
              </button>
            </div>
            {/* Body scrollavel */}
            <div
              className="overflow-y-auto flex-1 overscroll-contain"
              style={{
                WebkitOverflowScrolling: 'touch',
                paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── AddElementsMenu — conteudo do FAB (escolher entre Texto/Foto/Upload/Slide) ──
function AddElementsMenu({
  imagensCache, onAddText, onAddPhoto, onUploadFoto, onOpenSlide,
}: {
  imagensCache: string[]
  onAddText: () => void
  onAddPhoto: (idx: number) => void
  onUploadFoto: (file: File) => void | Promise<void>
  onOpenSlide: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="p-4 space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUploadFoto(file)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }}
      />
      {/* 4 ações grandes touch-friendly (min-h 80) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onAddText}
          className="flex flex-col items-center justify-center gap-2 min-h-24 rounded-2xl border border-[#2a2a4a] bg-[#13131f] active:scale-95 active:bg-[#1a1a2e] transition"
        >
          <Type className="w-7 h-7 text-iara-400" />
          <span className="text-sm font-semibold text-white">Texto</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 min-h-24 rounded-2xl border border-iara-700/50 bg-iara-900/20 active:scale-95 transition"
        >
          <Upload className="w-7 h-7 text-iara-300" />
          <span className="text-sm font-semibold text-iara-200">Enviar foto</span>
        </button>
        <button
          onClick={onOpenSlide}
          className="col-span-2 flex items-center justify-center gap-3 min-h-16 rounded-2xl border border-[#2a2a4a] bg-[#13131f] active:scale-95 active:bg-[#1a1a2e] transition"
        >
          <Sliders className="w-5 h-5 text-violet-400" />
          <span className="text-sm font-semibold text-white">Configurar fundo do slide</span>
        </button>
      </div>

      {/* Galeria de fotos do carrossel */}
      {imagensCache.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-[#6b6b8a] mb-2">Fotos do carrossel</p>
          <div className="grid grid-cols-3 gap-2">
            {imagensCache.map((src, i) => (
              <button
                key={i}
                onClick={() => onAddPhoto(i)}
                className="relative aspect-square rounded-xl overflow-hidden border border-[#2a2a4a] active:scale-95 transition"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white font-mono">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ContextualToolbar — sempre visível em peek, sem precisar expandir ─────
// 8 cores rapidas + paleta custom — comuns em carrossel viral BR
const CORES_RAPIDAS = ['#ffffff', '#000000', '#facc15', '#06b6d4', '#ec4899', '#22c55e', '#f97316', '#8b5cf6']

// Detecta se ha texto selecionado dentro de um contenteditable (modo edicao
// ativo) — base pra aplicar cor/fonte/bold em apenas uma PALAVRA ESPECIFICA.
// Sem seleccao, aplica em toda a layer (comportamento antigo).
function temSelecaoEditavel(): boolean {
  if (typeof window === 'undefined') return false
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return false
  const node = sel.anchorNode
  if (!node) return false
  const parent = node.nodeType === Node.ELEMENT_NODE
    ? (node as HTMLElement)
    : node.parentElement
  return !!parent?.closest('[contenteditable="true"]')
}

// Aplica formatacao SO no trecho selecionado via execCommand.
// Apesar de deprecated, funciona em todos os browsers que a Iara suporta
// (Safari iOS 15+, Chrome Android, Firefox, Edge).
// Retorna true se aplicou (havia selecao); false se nao havia.
function aplicarNoTrechoSelecionado(
  comando: 'foreColor' | 'fontName' | 'bold' | 'italic' | 'underline',
  valor?: string,
): boolean {
  if (!temSelecaoEditavel()) return false
  try {
    if (typeof valor !== 'undefined') {
      document.execCommand(comando, false, valor)
    } else {
      document.execCommand(comando, false)
    }
    return true
  } catch {
    return false
  }
}
// 8 fontes favoritas (top hits do catalogo) — quem quer mais abre "Mais"
const FONTES_RAPIDAS: { id: string; label: string; cssFamily: string }[] = [
  { id: 'Inter',                 label: 'Inter',     cssFamily: 'Inter, sans-serif' },
  { id: 'Anton',                 label: 'Anton',     cssFamily: 'Anton, sans-serif' },
  { id: 'Bebas Neue',            label: 'Bebas',     cssFamily: '"Bebas Neue", sans-serif' },
  { id: 'Playfair Display',      label: 'Playfair',  cssFamily: '"Playfair Display", serif' },
  { id: 'DM Serif Display',      label: 'DM Serif',  cssFamily: '"DM Serif Display", serif' },
  { id: 'Poppins',               label: 'Poppins',   cssFamily: 'Poppins, sans-serif' },
  { id: 'Caveat',                label: 'Caveat',    cssFamily: 'Caveat, cursive' },
  { id: 'Manrope',               label: 'Manrope',   cssFamily: 'Manrope, sans-serif' },
]

function ContextualToolbar({
  layer, onDelete, onDuplicate, onMoveZ, onUpdateLayer, onExpand,
}: {
  layer: Layer
  onDelete: () => void
  onDuplicate: () => void
  onMoveZ: (dir: 'up' | 'down') => void
  onUpdateLayer: (fn: (l: Layer) => Layer) => void
  onExpand: () => void
}) {
  return (
    <div className="px-3 pt-1 pb-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {layer.type === 'text' && (
        <>
          <ToolbarBtn
            label="A−"
            onClick={() => onUpdateLayer(l => l.type === 'text' ? {
              ...l, runs: (l as TextLayer).runs.map(r => ({ ...r, fontSize: Math.max(12, (r.fontSize ?? 40) - 6) }))
            } : l)}
          />
          <ToolbarBtn
            label="A+"
            onClick={() => onUpdateLayer(l => l.type === 'text' ? {
              ...l, runs: (l as TextLayer).runs.map(r => ({ ...r, fontSize: Math.min(300, (r.fontSize ?? 40) + 6) }))
            } : l)}
          />
          <ToolbarBtn icon={<Bold className="w-3.5 h-3.5" />} onClick={() => {
            // Bold em PALAVRA SELECIONADA tem prioridade. Sem selecao, aplica
            // em toda a layer (comportamento antigo — toggle do bold geral).
            if (aplicarNoTrechoSelecionado('bold')) return
            onUpdateLayer(l => l.type === 'text' ? {
              ...l, runs: (l as TextLayer).runs.map(r => ({ ...r, bold: !r.bold }))
            } : l)
          }} />
          <ToolbarBtn icon={<AlignLeft className="w-3.5 h-3.5" />} onClick={() => onUpdateLayer(l => l.type === 'text' ? { ...l, align: 'left' } : l)} />
          <ToolbarBtn icon={<AlignCenter className="w-3.5 h-3.5" />} onClick={() => onUpdateLayer(l => l.type === 'text' ? { ...l, align: 'center' } : l)} />
          <ToolbarBtn icon={<AlignRight className="w-3.5 h-3.5" />} onClick={() => onUpdateLayer(l => l.type === 'text' ? { ...l, align: 'right' } : l)} />

          {/* Cor rapida — popover inline com 8 cores comuns + ver mais */}
          <ToolbarPopover
            trigger={(
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#13131f] border border-[#2a2a4a] active:scale-90 transition">
                <div
                  className="w-4 h-4 rounded-full border border-white/30"
                  style={{ backgroundColor: (layer as TextLayer).runs[0]?.color ?? '#ffffff' }}
                />
                <ChevronDown className="w-3 h-3 text-[#9b9bb5]" />
              </div>
            )}
          >
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#6b6b8a] mb-1">Cor do texto</p>
            <p className="text-[9px] text-[#6b6b8a] mb-2 italic">Selecione uma palavra antes pra colorir só ela</p>
            <div className="grid grid-cols-4 gap-2">
              {CORES_RAPIDAS.map(c => (
                <button
                  key={c}
                  onClick={() => {
                    // Cor em palavra selecionada via execCommand. Sem selecao,
                    // aplica em todas as runs (comportamento antigo).
                    if (aplicarNoTrechoSelecionado('foreColor', c)) return
                    onUpdateLayer(l => l.type === 'text' ? {
                      ...l, runs: (l as TextLayer).runs.map(r => ({ ...r, color: c }))
                    } : l)
                  }}
                  className="w-10 h-10 rounded-lg border-2 border-white/10 active:scale-90 transition"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <input
              type="color"
              defaultValue={(layer as TextLayer).runs[0]?.color ?? '#ffffff'}
              onChange={(e) => {
                if (aplicarNoTrechoSelecionado('foreColor', e.target.value)) return
                onUpdateLayer(l => l.type === 'text' ? {
                  ...l, runs: (l as TextLayer).runs.map(r => ({ ...r, color: e.target.value }))
                } : l)
              }}
              className="mt-3 w-full h-10 rounded-lg cursor-pointer border border-[#2a2a4a] bg-transparent"
              title="Cor personalizada"
            />
          </ToolbarPopover>

          {/* Fonte rapida — popover com 8 favoritas + "ver todas" abre Mais */}
          <ToolbarPopover
            trigger={(
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#13131f] border border-[#2a2a4a] active:scale-90 transition max-w-[80px]">
                <span className="text-[10px] font-bold text-[#c1c1d8] truncate" style={{ fontFamily: (layer as TextLayer).runs[0]?.fontFamily ?? 'Inter' }}>
                  {((layer as TextLayer).runs[0]?.fontFamily ?? 'Inter').split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-[#9b9bb5] flex-shrink-0" />
              </div>
            )}
          >
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#6b6b8a] mb-1">Fonte</p>
            <p className="text-[9px] text-[#6b6b8a] mb-2 italic">Selecione uma palavra antes pra mudar só dela</p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {FONTES_RAPIDAS.map(f => {
                const ativa = ((layer as TextLayer).runs[0]?.fontFamily ?? 'Inter') === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      if (aplicarNoTrechoSelecionado('fontName', f.id)) return
                      onUpdateLayer(l => l.type === 'text' ? {
                        ...l, runs: (l as TextLayer).runs.map(r => ({ ...r, fontFamily: f.id }))
                      } : l)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg active:scale-95 transition ${
                      ativa ? 'bg-iara-600/30 border border-iara-500/50' : 'bg-[#0d0d1a] border border-[#1a1a2e] hover:border-iara-700/40'
                    }`}
                  >
                    <span className="text-base text-white" style={{ fontFamily: f.cssFamily, fontWeight: 700 }}>
                      {f.label}
                    </span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={onExpand}
              className="mt-3 w-full px-3 py-2 rounded-lg bg-iara-900/40 border border-iara-700/40 text-xs font-semibold text-iara-200 active:scale-95 transition"
            >
              Ver todas as 35+ fontes →
            </button>
          </ToolbarPopover>
        </>
      )}
      <span className="w-px h-5 bg-[#1a1a2e] mx-0.5" />
      {/* Z-order — agora com label "Frente"/"Tras" pra ficar claro o que faz.
          Resolve "textos as vezes ficam escondidos atras de outras layers". */}
      <ToolbarBtn label="Frente" onClick={() => onMoveZ('up')} />
      <ToolbarBtn label="Trás" onClick={() => onMoveZ('down')} />
      <ToolbarBtn icon={<Copy className="w-3.5 h-3.5" />} onClick={onDuplicate} />
      <ToolbarBtn icon={<Trash2 className="w-3.5 h-3.5" />} onClick={onDelete} variant="danger" />
      <span className="w-px h-5 bg-[#1a1a2e] mx-0.5" />
      <ToolbarBtn icon={<MoreHorizontal className="w-3.5 h-3.5" />} onClick={onExpand} label="Mais" />
    </div>
  )
}

// Popover compacto pra toolbar contextual — abre acima do trigger.
// Click-outside fecha. Usado pra Cor + Fonte rapidas.
function ToolbarPopover({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: Event) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('touchstart', onDoc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('touchstart', onDoc)
    }
  }, [open])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={() => setOpen(o => !o)} className="block">
        {trigger}
      </button>
      {open && (
        <div
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 max-w-[80vw] rounded-2xl bg-[#0a0a14] border border-[#2a2a4a] shadow-2xl shadow-black/60 p-3 z-10"
          onClick={e => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function ToolbarBtn({
  icon, label, onClick, variant = 'normal',
}: {
  icon?: React.ReactNode; label?: string; onClick: () => void; variant?: 'normal' | 'danger'
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-2 rounded-lg transition-all active:scale-90 flex-shrink-0 ${
        variant === 'danger'
          ? 'bg-[#13131f] border border-[#2a2a4a] text-red-400 hover:bg-red-900/20'
          : 'bg-[#13131f] border border-[#2a2a4a] text-[#c1c1d8] hover:text-white hover:border-iara-500/50'
      }`}
    >
      {icon}
      {label && <span className="text-[10px] font-bold tracking-wide">{label}</span>}
    </button>
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
