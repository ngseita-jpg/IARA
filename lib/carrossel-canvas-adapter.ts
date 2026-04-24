/**
 * Converte o formato antigo (Slide) no novo (Slide2) preservando semântica.
 * Garante compat com histórico e com a IA até que ela emita Slide2 nativo.
 */

import type { Slide } from '@/app/api/carrossel/gerar/route'
import {
  type Slide2, type Layer, type TextLayer, type Background,
  type Run, newId,
} from './carrossel-canvas-types'

const COR_TEXTO_PADRAO = '#ffffff'
const COR_EYEBROW = 'rgba(255,255,255,0.85)'
const COR_CORPO = 'rgba(255,255,255,0.88)'

// Mapeia arquétipo → preset de layout (posições das layers no canvas 100×100)
type LayoutPreset = {
  bgType: 'photo' | 'color' | 'gradient'
  bgColor?: string
  bgGradient?: { from: string; to: string; angle?: number }
  overlay?: { color: string; opacity: number }
  eyebrow?: { x: number; y: number; w: number; h: number; size: number; color: string }
  titulo?:  { x: number; y: number; w: number; h: number; size: number; color: string; align: TextLayer['align']; vAlign: TextLayer['vAlign'] }
  corpo?:   { x: number; y: number; w: number; h: number; size: number; color: string; align: TextLayer['align'] }
  cta?:     { x: number; y: number; w: number; h: number; size: number; color: string; align: TextLayer['align'] }
  handle?:  { x: number; y: number; w: number; h: number; size: number; color: string }
  photoLayer?: { x: number; y: number; w: number; h: number } // quando é um PhotoLayer separado (inset, split…)
}

const PRESETS: Record<string, LayoutPreset> = {
  // ──── CAPA ────────────────────────────────────────────────
  cover_full: {
    bgType: 'photo',
    overlay: { color: '#000', opacity: 0.40 },
    eyebrow: { x: 4, y: 4, w: 60, h: 5, size: 20, color: COR_EYEBROW },
    titulo:  { x: 4, y: 62, w: 92, h: 25, size: 96, color: COR_TEXTO_PADRAO, align: 'left', vAlign: 'bottom' },
    handle:  { x: 4, y: 92, w: 60, h: 4, size: 20, color: 'rgba(255,255,255,0.72)' },
  },
  split_v: {
    bgType: 'color',
    bgColor: '#08080f',
    eyebrow: { x: 4, y: 6, w: 36, h: 4, size: 16, color: 'rgba(255,255,255,0.75)' },
    titulo:  { x: 4, y: 32, w: 36, h: 22, size: 62, color: COR_TEXTO_PADRAO, align: 'left', vAlign: 'top' },
    corpo:   { x: 4, y: 56, w: 36, h: 22, size: 26, color: COR_CORPO, align: 'left' },
    photoLayer: { x: 41, y: 0, w: 59, h: 100 },
  },
  side_right: {
    bgType: 'color',
    bgColor: '#08080f',
    eyebrow: { x: 60, y: 6, w: 36, h: 4, size: 16, color: 'rgba(255,255,255,0.75)' },
    titulo:  { x: 60, y: 32, w: 36, h: 22, size: 62, color: COR_TEXTO_PADRAO, align: 'left', vAlign: 'top' },
    corpo:   { x: 60, y: 56, w: 36, h: 22, size: 26, color: COR_CORPO, align: 'left' },
    photoLayer: { x: 0, y: 0, w: 55, h: 100 },
  },
  top_text: {
    bgType: 'color',
    bgColor: '#08080f',
    eyebrow: { x: 4, y: 6, w: 60, h: 4, size: 18, color: 'rgba(255,255,255,0.75)' },
    titulo:  { x: 4, y: 14, w: 92, h: 30, size: 90, color: COR_TEXTO_PADRAO, align: 'left', vAlign: 'top' },
    corpo:   { x: 4, y: 42, w: 70, h: 9, size: 28, color: COR_CORPO, align: 'left' },
    photoLayer: { x: 0, y: 52, w: 100, h: 48 },
  },
  full_bleed: {
    bgType: 'photo',
    overlay: { color: '#000', opacity: 0.45 },
    titulo:  { x: 6, y: 45, w: 88, h: 20, size: 76, color: COR_TEXTO_PADRAO, align: 'center', vAlign: 'middle' },
    corpo:   { x: 10, y: 68, w: 80, h: 10, size: 26, color: COR_CORPO, align: 'center' },
  },
  quote: {
    bgType: 'gradient',
    bgGradient: { from: '#1a1a2e', to: '#0a0a14', angle: 135 },
    titulo:  { x: 8, y: 35, w: 84, h: 30, size: 68, color: COR_TEXTO_PADRAO, align: 'center', vAlign: 'middle' },
    handle:  { x: 4, y: 92, w: 60, h: 4, size: 18, color: 'rgba(255,255,255,0.5)' },
  },
  closing: {
    bgType: 'gradient',
    bgGradient: { from: '#6366f1', to: '#a855f7', angle: 135 },
    titulo:  { x: 8, y: 30, w: 84, h: 18, size: 80, color: COR_TEXTO_PADRAO, align: 'center', vAlign: 'middle' },
    corpo:   { x: 10, y: 50, w: 80, h: 10, size: 30, color: 'rgba(255,255,255,0.92)', align: 'center' },
    cta:     { x: 15, y: 68, w: 70, h: 10, size: 36, color: '#0a0a14', align: 'center' },
    handle:  { x: 4, y: 92, w: 92, h: 4, size: 22, color: 'rgba(255,255,255,0.85)' },
  },
  editorial: {
    bgType: 'color',
    bgColor: '#08080f',
    eyebrow: { x: 4, y: 6, w: 40, h: 4, size: 16, color: '#c1c1d8' },
    titulo:  { x: 4, y: 28, w: 40, h: 25, size: 56, color: COR_TEXTO_PADRAO, align: 'left', vAlign: 'top' },
    corpo:   { x: 4, y: 56, w: 40, h: 22, size: 24, color: COR_CORPO, align: 'left' },
    photoLayer: { x: 46, y: 4, w: 50, h: 92 },
  },
  caption_bar: {
    bgType: 'color',
    bgColor: '#08080f',
    photoLayer: { x: 0, y: 0, w: 100, h: 65 },
    titulo:  { x: 5, y: 70, w: 90, h: 12, size: 54, color: COR_TEXTO_PADRAO, align: 'left', vAlign: 'top' },
    corpo:   { x: 5, y: 83, w: 90, h: 12, size: 24, color: COR_CORPO, align: 'left' },
  },
  cinematic: {
    bgType: 'photo',
    overlay: { color: '#000', opacity: 0.30 },
    titulo:  { x: 6, y: 45, w: 88, h: 15, size: 72, color: COR_TEXTO_PADRAO, align: 'center', vAlign: 'middle' },
  },
  inset_photo: {
    bgType: 'gradient',
    bgGradient: { from: '#1a1a2e', to: '#0a0a14', angle: 180 },
    eyebrow: { x: 6, y: 6, w: 50, h: 4, size: 16, color: '#c1c1d8' },
    titulo:  { x: 6, y: 75, w: 88, h: 10, size: 48, color: COR_TEXTO_PADRAO, align: 'left', vAlign: 'top' },
    corpo:   { x: 6, y: 86, w: 88, h: 8, size: 22, color: COR_CORPO, align: 'left' },
    photoLayer: { x: 12, y: 14, w: 76, h: 58 },
  },
  photo_top_full: {
    bgType: 'color',
    bgColor: '#08080f',
    photoLayer: { x: 0, y: 0, w: 100, h: 72 },
    titulo:  { x: 4, y: 76, w: 92, h: 12, size: 50, color: COR_TEXTO_PADRAO, align: 'left', vAlign: 'top' },
    corpo:   { x: 4, y: 89, w: 92, h: 8, size: 22, color: COR_CORPO, align: 'left' },
  },
  bold_type: {
    bgType: 'photo',
    overlay: { color: '#000', opacity: 0.55 },
    titulo:  { x: 4, y: 10, w: 92, h: 80, size: 180, color: COR_TEXTO_PADRAO, align: 'left', vAlign: 'middle' },
  },
  minimal_text: {
    bgType: 'color',
    bgColor: '#f8f5f0',
    titulo:  { x: 10, y: 40, w: 80, h: 20, size: 60, color: '#0a0a14', align: 'center', vAlign: 'middle' },
  },
  gradient_text: {
    bgType: 'color',
    bgColor: '#08080f',
    titulo:  { x: 6, y: 30, w: 88, h: 40, size: 96, color: '#ec4899', align: 'center', vAlign: 'middle' },
  },
  list_card: {
    bgType: 'color',
    bgColor: '#08080f',
    eyebrow: { x: 6, y: 6, w: 40, h: 4, size: 16, color: '#c1c1d8' },
    titulo:  { x: 6, y: 14, w: 88, h: 10, size: 50, color: COR_TEXTO_PADRAO, align: 'left', vAlign: 'top' },
    corpo:   { x: 6, y: 28, w: 88, h: 65, size: 28, color: COR_CORPO, align: 'left' },
  },
  highlight_box: {
    bgType: 'gradient',
    bgGradient: { from: '#6366f1', to: '#a855f7', angle: 135 },
    titulo:  { x: 6, y: 30, w: 88, h: 30, size: 140, color: COR_TEXTO_PADRAO, align: 'center', vAlign: 'middle' },
    corpo:   { x: 10, y: 65, w: 80, h: 15, size: 26, color: 'rgba(255,255,255,0.9)', align: 'center' },
  },
  dark_card_center: {
    bgType: 'color',
    bgColor: '#0a0a14',
    titulo:  { x: 10, y: 40, w: 80, h: 20, size: 64, color: COR_TEXTO_PADRAO, align: 'center', vAlign: 'middle' },
  },
  color_block: {
    bgType: 'color',
    bgColor: '#ec4899',
    titulo:  { x: 6, y: 35, w: 88, h: 30, size: 92, color: '#ffffff', align: 'left', vAlign: 'middle' },
  },
  // Marca
  brand_cover: {
    bgType: 'photo',
    overlay: { color: '#000', opacity: 0.45 },
    eyebrow: { x: 4, y: 4, w: 60, h: 4, size: 18, color: 'rgba(255,255,255,0.8)' },
    titulo:  { x: 4, y: 70, w: 92, h: 18, size: 80, color: COR_TEXTO_PADRAO, align: 'left', vAlign: 'bottom' },
    handle:  { x: 4, y: 92, w: 60, h: 4, size: 20, color: 'rgba(255,255,255,0.72)' },
  },
  brand_story: {
    bgType: 'photo',
    overlay: { color: '#000', opacity: 0.35 },
    titulo:  { x: 4, y: 10, w: 50, h: 25, size: 60, color: COR_TEXTO_PADRAO, align: 'left', vAlign: 'top' },
    corpo:   { x: 4, y: 40, w: 50, h: 50, size: 24, color: COR_CORPO, align: 'left' },
  },
  brand_promo: {
    bgType: 'gradient',
    bgGradient: { from: '#a855f7', to: '#ec4899', angle: 135 },
    titulo:  { x: 8, y: 25, w: 84, h: 18, size: 72, color: COR_TEXTO_PADRAO, align: 'center', vAlign: 'middle' },
    corpo:   { x: 10, y: 48, w: 80, h: 15, size: 28, color: 'rgba(255,255,255,0.92)', align: 'center' },
    cta:     { x: 20, y: 70, w: 60, h: 10, size: 32, color: '#0a0a14', align: 'center' },
  },
}

/** Resolve preset com fallback pra cover_full se arquétipo não for conhecido */
function getPreset(arquetipo?: string): LayoutPreset {
  if (arquetipo && PRESETS[arquetipo]) return PRESETS[arquetipo]
  return PRESETS.cover_full
}

/** Converte um Slide (formato antigo) em Slide2 (formato rico) */
export function slideParaSlide2(slide: Slide, totalSlides: number): Slide2 {
  const preset = getPreset(slide.arquetipo)

  // Determinar background
  let background: Background
  if (preset.bgType === 'photo' && slide.imagem_index !== undefined) {
    background = {
      type: 'photo',
      imageIdx: slide.imagem_index,
      objectPosition: slide.foto_object_position,
      zoom: slide.foto_zoom,
    }
  } else if (preset.bgType === 'gradient' && preset.bgGradient) {
    background = { type: 'gradient', ...preset.bgGradient }
  } else if (slide.cor_fundo_override) {
    background = { type: 'color', color: slide.cor_fundo_override }
  } else {
    background = { type: 'color', color: preset.bgColor ?? '#08080f' }
  }

  // Monta layers em ordem de z-index (bg vai no fundo, depois photoLayer se houver, depois textos)
  const layers: Layer[] = []

  // Foto como layer se o preset tiver photoLayer e temos imagem
  if (preset.photoLayer && slide.imagem_index !== undefined) {
    layers.push({
      id: newId('photo'),
      type: 'photo',
      x: preset.photoLayer.x,
      y: preset.photoLayer.y,
      w: preset.photoLayer.w,
      h: preset.photoLayer.h,
      imageIdx: slide.imagem_index,
      objectPosition: slide.foto_object_position,
    })
  }

  const corTextoOverride = slide.cor_texto_override
  const align = slide.alinhamento

  // Eyebrow
  if (preset.eyebrow && slide.eyebrow) {
    layers.push(makeTextLayer('eyebrow', slide.eyebrow.toUpperCase(), preset.eyebrow, corTextoOverride, align))
  }

  // Título
  if (preset.titulo && slide.titulo) {
    const titPreset = { ...preset.titulo }
    if (align) titPreset.align = align
    layers.push(makeTextLayer('title', slide.titulo, titPreset, corTextoOverride, align, slide.fonte_override))
  }

  // Corpo
  if (preset.corpo && slide.corpo) {
    const corpoPreset = { ...preset.corpo }
    if (align) corpoPreset.align = align
    layers.push(makeTextLayer('body', slide.corpo, corpoPreset, corTextoOverride, align, slide.fonte_override))
  }

  // CTA
  if (preset.cta && slide.cta) {
    layers.push(makeTextLayer('cta', slide.cta, preset.cta, corTextoOverride, align, slide.fonte_override))
  }

  // Handle
  if (preset.handle && slide.handle) {
    layers.push(makeTextLayer('handle', slide.handle, preset.handle, corTextoOverride, align))
  }

  const fonteFamilia = slide.fonte_override === 'oswald' ? 'Oswald'
                     : slide.fonte_override === 'playfair' ? 'Playfair'
                     : 'Inter'

  return {
    id: newId('s'),
    ordem: slide.ordem,
    tipo: slide.tipo,
    background,
    overlay: preset.overlay,
    layers,
    fonte_familia: fonteFamilia,
  }
  void totalSlides
}

type TextPreset = {
  x: number; y: number; w: number; h: number; size: number; color: string
  align?: TextLayer['align']; vAlign?: TextLayer['vAlign']
}

function makeTextLayer(
  role: TextLayer['role'],
  text: string,
  preset: TextPreset,
  corOverride?: string,
  alignOverride?: TextLayer['align'],
  fonteOverride?: 'inter' | 'oswald' | 'playfair',
): TextLayer {
  const fontFamily = fonteOverride === 'oswald' ? 'Oswald'
                   : fonteOverride === 'playfair' ? 'Playfair'
                   : 'Inter'
  const corFinal = corOverride || preset.color

  const runs: Run[] = [{
    text,
    color: corFinal,
    fontSize: preset.size,
    fontFamily,
    bold: role === 'title' || role === 'cta',
  }]

  return {
    id: newId('t'),
    type: 'text',
    x: preset.x, y: preset.y, w: preset.w, h: preset.h,
    align: alignOverride ?? preset.align ?? 'left',
    vAlign: preset.vAlign ?? 'top',
    runs,
    role,
    shadow: preset.color.startsWith('rgba(255') || preset.color === '#ffffff',
    lineHeight: role === 'title' ? 1.08 : role === 'body' ? 1.45 : 1.2,
  }
}

/** Batch: converte um array de Slide em Slide2 */
export function carrosselParaSlide2(slides: Slide[]): Slide2[] {
  return slides.map(s => slideParaSlide2(s, slides.length))
}
