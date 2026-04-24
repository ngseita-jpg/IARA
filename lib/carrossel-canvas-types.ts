/**
 * Slide2 — estrutura rica pra editor visual tipo Canva.
 * Cada slide é composto de:
 *  - background: cor, foto ou gradiente
 *  - overlay opcional (scrim pra legibilidade sobre foto)
 *  - layers: array ordenado (z-index = posição no array) de objetos editáveis
 *    → cada layer pode ser texto rico (com formatação por palavra), foto extra ou shape
 *
 * Coordenadas em porcentagem 0-100 (relativas ao canvas 1080×1080) pra serem
 * resolução-independentes. Renderer converte pra px ao desenhar.
 */

export type Slide2 = {
  id: string
  ordem: number
  tipo: 'capa' | 'conteudo' | 'encerramento'
  background: Background
  overlay?: Overlay
  layers: Layer[]
  /** Fonte global do slide (fallback para quando a layer não especifica a própria) */
  fonte_familia?: string
  paleta?: { primaria: string; secundaria: string; texto: string }
}

export type Background =
  | { type: 'color'; color: string }
  | { type: 'gradient'; from: string; to: string; angle?: number }
  | { type: 'photo'; imageIdx: number; objectPosition?: string; zoom?: number }

export type Overlay = { color: string; opacity: number }

export type Layer = TextLayer | PhotoLayer | ShapeLayer

export type TextLayer = {
  id: string
  type: 'text'
  x: number      // 0-100 (%)
  y: number
  w: number
  h: number
  align: 'left' | 'center' | 'right'
  vAlign: 'top' | 'middle' | 'bottom'
  runs: Run[]    // spans com formatação — permite cor diferente por palavra
  role?: 'title' | 'body' | 'eyebrow' | 'cta' | 'handle'   // semântica pra fallback
  rotation?: number        // graus, opcional
  lineHeight?: number      // multiplicador (1.05 a 1.6 tipicamente)
  shadow?: boolean         // text-shadow pra legibilidade
}

export type Run = {
  text: string
  bold?: boolean
  italic?: boolean
  color?: string
  fontSize?: number        // px no sistema 1080 (será escalado)
  /**
   * Família da fonte. Qualquer id do catálogo em lib/carrossel-fontes.ts.
   * Ex: 'Inter', 'Playfair Display', 'Oswald', 'Bebas Neue'…
   * Mantemos string pra aceitar qualquer fonte futura sem alterar o tipo.
   */
  fontFamily?: string
  letterSpacing?: number
  underline?: boolean
}

export type PhotoLayer = {
  id: string
  type: 'photo'
  x: number
  y: number
  w: number
  h: number
  imageIdx: number
  objectPosition?: string
  rounded?: number         // border-radius em px
  shadow?: boolean
  rotation?: number
}

export type ShapeLayer = {
  id: string
  type: 'shape'
  shape: 'rect' | 'circle' | 'line' | 'dots'
  x: number
  y: number
  w: number
  h: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  rotation?: number
}

export type CarrosselCanvas = {
  slides: Slide2[]
  paleta: { primaria: string; secundaria: string; texto: string }
  raciocinio?: string
  imagens_base64?: string[]   // refs pelas imageIdx
}

// ─── Helpers ─────────────────────────────────────────────────────────────

export function runsToText(runs: Run[]): string {
  return runs.map(r => r.text).join('')
}

export function textToRuns(text: string, template?: Partial<Run>): Run[] {
  return [{ text, ...template }]
}

export function newId(prefix = 'l'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
