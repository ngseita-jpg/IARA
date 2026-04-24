/**
 * Renderiza um Slide2 num <canvas> 1080×1080 no client.
 * Zero dependência server-side — tudo HTMLCanvas 2D nativo.
 *
 * Usado tanto no preview (redimensionado CSS) quanto no export PNG.
 */

import type {
  Slide2, Layer, TextLayer, PhotoLayer, ShapeLayer, Run, Background, Overlay,
} from './carrossel-canvas-types'

export const CANVAS_SIZE = 1080

export type RenderOptions = {
  watermark?: boolean
  // Para preview em thumbnails, passamos um canvas menor e tudo é escalado
  scale?: number
}

/**
 * Pré-carrega uma imagem como HTMLImageElement.
 * Aceita data: URL, blob URL ou http URL.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = src
  })
}

export type ImageCache = Map<number, HTMLImageElement>

export async function preloadImages(imagens: string[]): Promise<ImageCache> {
  const cache = new Map<number, HTMLImageElement>()
  await Promise.all(
    imagens.map(async (src, idx) => {
      try {
        const url = src.startsWith('data:') ? src : `data:image/jpeg;base64,${src}`
        cache.set(idx, await loadImage(url))
      } catch { /* imagem quebrada — ignora e renderer usa cor */ }
    })
  )
  return cache
}

/** Parse object-position string tipo "center top" ou "50% 30%" → {x%, y%} */
function parseObjectPosition(pos?: string): { x: number; y: number } {
  if (!pos) return { x: 0.5, y: 0.5 }
  const parts = pos.toLowerCase().trim().split(/\s+/)
  const parsePart = (s: string, axis: 'x' | 'y'): number => {
    if (s === 'left' || s === 'top')    return 0
    if (s === 'right' || s === 'bottom') return 1
    if (s === 'center')                  return 0.5
    const m = s.match(/^([\d.]+)%?$/)
    if (m) return Number(m[1]) / 100
    return axis === 'x' ? 0.5 : 0.5
  }
  if (parts.length === 1) return { x: parsePart(parts[0], 'x'), y: parsePart(parts[0], 'y') }
  return { x: parsePart(parts[0], 'x'), y: parsePart(parts[1], 'y') }
}

/** Desenha imagem com object-fit: cover respeitando object-position */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number,
  objectPosition?: string,
  zoom = 1,
) {
  const { x: posX, y: posY } = parseObjectPosition(objectPosition)
  const iw = img.naturalWidth
  const ih = img.naturalHeight

  // Escala pra cobrir o retângulo destino (igual CSS object-fit: cover) + zoom
  const scale = Math.max(dw / iw, dh / ih) * zoom
  const sw = dw / scale
  const sh = dh / scale

  // sx/sy: ponto inicial na imagem original baseado no object-position
  const sx = Math.max(0, Math.min(iw - sw, (iw - sw) * posX))
  const sy = Math.max(0, Math.min(ih - sh, (ih - sh) * posY))

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  bg: Background,
  size: number,
  imageCache: ImageCache,
) {
  if (bg.type === 'color') {
    ctx.fillStyle = bg.color
    ctx.fillRect(0, 0, size, size)
    return
  }
  if (bg.type === 'gradient') {
    const angleRad = ((bg.angle ?? 135) * Math.PI) / 180
    const x0 = size / 2 - Math.cos(angleRad) * size / 2
    const y0 = size / 2 - Math.sin(angleRad) * size / 2
    const x1 = size / 2 + Math.cos(angleRad) * size / 2
    const y1 = size / 2 + Math.sin(angleRad) * size / 2
    const grad = ctx.createLinearGradient(x0, y0, x1, y1)
    grad.addColorStop(0, bg.from)
    grad.addColorStop(1, bg.to)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    return
  }
  // photo
  const img = imageCache.get(bg.imageIdx)
  if (img) {
    drawImageCover(ctx, img, 0, 0, size, size, bg.objectPosition, bg.zoom ?? 1)
  } else {
    // Fallback: gradiente suave
    const grad = ctx.createLinearGradient(0, 0, size, size)
    grad.addColorStop(0, '#1a1a2e')
    grad.addColorStop(1, '#0a0a14')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
  }
}

function drawOverlay(ctx: CanvasRenderingContext2D, overlay: Overlay | undefined, size: number) {
  if (!overlay) return
  ctx.save()
  ctx.globalAlpha = overlay.opacity
  ctx.fillStyle = overlay.color
  ctx.fillRect(0, 0, size, size)
  ctx.restore()
}

function drawPhotoLayer(
  ctx: CanvasRenderingContext2D,
  layer: PhotoLayer,
  size: number,
  imageCache: ImageCache,
) {
  const x = (layer.x / 100) * size
  const y = (layer.y / 100) * size
  const w = (layer.w / 100) * size
  const h = (layer.h / 100) * size

  ctx.save()
  if (layer.rotation) {
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate((layer.rotation * Math.PI) / 180)
    ctx.translate(-(x + w / 2), -(y + h / 2))
  }
  if (layer.rounded) {
    roundRect(ctx, x, y, w, h, layer.rounded)
    ctx.clip()
  }
  if (layer.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetY = 10
  }
  const img = imageCache.get(layer.imageIdx)
  if (img) {
    drawImageCover(ctx, img, x, y, w, h, layer.objectPosition)
  } else {
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(x, y, w, h)
  }
  ctx.restore()
}

function drawShapeLayer(ctx: CanvasRenderingContext2D, layer: ShapeLayer, size: number) {
  const x = (layer.x / 100) * size
  const y = (layer.y / 100) * size
  const w = (layer.w / 100) * size
  const h = (layer.h / 100) * size

  ctx.save()
  if (layer.rotation) {
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate((layer.rotation * Math.PI) / 180)
    ctx.translate(-(x + w / 2), -(y + h / 2))
  }

  if (layer.shape === 'rect') {
    if (layer.fill) { ctx.fillStyle = layer.fill; ctx.fillRect(x, y, w, h) }
    if (layer.stroke && layer.strokeWidth) { ctx.strokeStyle = layer.stroke; ctx.lineWidth = layer.strokeWidth; ctx.strokeRect(x, y, w, h) }
  } else if (layer.shape === 'circle') {
    ctx.beginPath()
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
    if (layer.fill) { ctx.fillStyle = layer.fill; ctx.fill() }
    if (layer.stroke && layer.strokeWidth) { ctx.strokeStyle = layer.stroke; ctx.lineWidth = layer.strokeWidth; ctx.stroke() }
  } else if (layer.shape === 'line') {
    ctx.strokeStyle = layer.stroke ?? '#fff'
    ctx.lineWidth = layer.strokeWidth ?? 4
    ctx.beginPath()
    ctx.moveTo(x, y + h / 2)
    ctx.lineTo(x + w, y + h / 2)
    ctx.stroke()
  } else if (layer.shape === 'dots') {
    // Progress dots — usada nos slides originais
    const dotCount = Math.max(1, Math.round(w / 20))
    const gap = w / dotCount
    const radius = Math.min(6, gap / 4)
    for (let i = 0; i < dotCount; i++) {
      ctx.beginPath()
      ctx.arc(x + i * gap + gap / 2, y + h / 2, radius, 0, Math.PI * 2)
      ctx.fillStyle = layer.fill ?? 'rgba(255,255,255,0.3)'
      ctx.fill()
    }
  }

  ctx.restore()
}

// ─── TEXT LAYER ──────────────────────────────────────────────────────────

type ParsedLine = {
  runs: Array<Run & { measuredWidth: number }>
  totalWidth: number
  maxFontSize: number
  maxLineHeight: number
}

/** Quebra runs em linhas respeitando largura disponível */
function wrapRichText(
  ctx: CanvasRenderingContext2D,
  runs: Run[],
  maxWidth: number,
  defaultFontSize: number,
  lineHeight: number,
): ParsedLine[] {
  const lines: ParsedLine[] = []
  let currentLine: ParsedLine = { runs: [], totalWidth: 0, maxFontSize: 0, maxLineHeight: 0 }

  for (const run of runs) {
    // Divide o run em "palavras" preservando espaços adjacentes
    const tokens = run.text.match(/\S+|\s+/g) ?? []
    for (const token of tokens) {
      // Se token for nova linha explícita \n, quebra
      if (token.includes('\n')) {
        const parts = token.split('\n')
        for (let p = 0; p < parts.length; p++) {
          if (parts[p]) {
            addToken(parts[p], run, currentLine, ctx, defaultFontSize)
          }
          if (p < parts.length - 1) {
            lines.push(currentLine)
            currentLine = { runs: [], totalWidth: 0, maxFontSize: 0, maxLineHeight: 0 }
          }
        }
        continue
      }

      const fontSize = run.fontSize ?? defaultFontSize
      const weight = run.bold ? '700' : '500'
      const style = run.italic ? 'italic' : 'normal'
      const family = run.fontFamily ?? 'Inter'
      ctx.font = `${style} ${weight} ${fontSize}px ${family}, system-ui, sans-serif`
      const width = ctx.measureText(token).width

      if (currentLine.totalWidth + width > maxWidth && currentLine.runs.length > 0 && token.trim()) {
        // Quebra linha (não quebra se o token é só espaços no fim)
        // Remove espaços do fim da linha atual
        while (currentLine.runs.length > 0 && currentLine.runs[currentLine.runs.length - 1].text.trim() === '') {
          const removed = currentLine.runs.pop()!
          currentLine.totalWidth -= removed.measuredWidth
        }
        lines.push(currentLine)
        currentLine = { runs: [], totalWidth: 0, maxFontSize: 0, maxLineHeight: 0 }
        // Não inclui espaço inicial na nova linha
        if (token.trim() === '') continue
        addToken(token, run, currentLine, ctx, defaultFontSize)
      } else {
        addToken(token, run, currentLine, ctx, defaultFontSize)
      }
    }
  }

  if (currentLine.runs.length > 0) lines.push(currentLine)

  // Ajusta line height por linha baseado no maior fontSize
  lines.forEach(l => {
    l.maxLineHeight = l.maxFontSize * lineHeight
  })

  return lines
}

function addToken(
  token: string,
  run: Run,
  line: ParsedLine,
  ctx: CanvasRenderingContext2D,
  defaultFontSize: number,
) {
  const fontSize = run.fontSize ?? defaultFontSize
  const weight = run.bold ? '700' : '500'
  const style = run.italic ? 'italic' : 'normal'
  const family = run.fontFamily ?? 'Inter'
  ctx.font = `${style} ${weight} ${fontSize}px ${family}, system-ui, sans-serif`
  const width = ctx.measureText(token).width
  line.runs.push({ ...run, text: token, measuredWidth: width })
  line.totalWidth += width
  if (fontSize > line.maxFontSize) line.maxFontSize = fontSize
}

function drawTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer, size: number) {
  const x = (layer.x / 100) * size
  const y = (layer.y / 100) * size
  const w = (layer.w / 100) * size
  const h = (layer.h / 100) * size

  if (!layer.runs.length) return

  const defaultFontSize = layer.runs[0]?.fontSize ?? 40
  const lineHeight = layer.lineHeight ?? 1.25

  // Auto-shrink: tenta no tamanho padrão, se não couber reduz até 60%
  let currentDefault = defaultFontSize
  let lines: ParsedLine[] = []
  for (let attempt = 0; attempt < 8; attempt++) {
    lines = wrapRichText(ctx, layer.runs, w, currentDefault, lineHeight)
    const totalH = lines.reduce((sum, l) => sum + l.maxLineHeight, 0)
    if (totalH <= h) break
    currentDefault = Math.round(currentDefault * 0.92)
    if (currentDefault < defaultFontSize * 0.55) break
  }

  // Calcula y inicial baseado em vAlign
  const totalH = lines.reduce((sum, l) => sum + l.maxLineHeight, 0)
  let yCursor = y
  if (layer.vAlign === 'middle') yCursor = y + (h - totalH) / 2
  if (layer.vAlign === 'bottom') yCursor = y + h - totalH

  // Desenha linha por linha
  ctx.save()
  if (layer.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.55)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 2
  }
  if (layer.rotation) {
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate((layer.rotation * Math.PI) / 180)
    ctx.translate(-(x + w / 2), -(y + h / 2))
  }

  for (const line of lines) {
    // X inicial baseado em align
    let xCursor = x
    if (layer.align === 'center') xCursor = x + (w - line.totalWidth) / 2
    if (layer.align === 'right')  xCursor = x + w - line.totalWidth

    ctx.textBaseline = 'top'
    for (const run of line.runs) {
      const fontSize = run.fontSize ?? currentDefault
      const weight = run.bold ? '700' : '500'
      const style = run.italic ? 'italic' : 'normal'
      const family = run.fontFamily ?? 'Inter'
      ctx.font = `${style} ${weight} ${fontSize}px ${family}, system-ui, sans-serif`
      ctx.fillStyle = run.color ?? '#ffffff'
      // letterSpacing via medição manual caractere a caractere (não há API nativa confiável)
      if (run.letterSpacing && run.letterSpacing !== 0) {
        let xCh = xCursor
        for (const ch of run.text) {
          ctx.fillText(ch, xCh, yCursor + (line.maxFontSize - fontSize))
          xCh += ctx.measureText(ch).width + run.letterSpacing
        }
      } else {
        ctx.fillText(run.text, xCursor, yCursor + (line.maxFontSize - fontSize))
      }
      if (run.underline) {
        ctx.fillRect(xCursor, yCursor + line.maxFontSize - 2, run.measuredWidth, 2)
      }
      xCursor += run.measuredWidth
    }
    yCursor += line.maxLineHeight
  }
  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawWatermark(ctx: CanvasRenderingContext2D, size: number) {
  const padX = 14, padY = 7
  ctx.save()
  ctx.font = '700 16px Inter, system-ui, sans-serif'
  const textWidth = ctx.measureText('Iara Hub').width
  const boxW = textWidth + padX * 2 + 24
  const boxH = 32
  const bx = size - boxW - 24
  const by = size - boxH - 24
  // Fundo
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  roundRect(ctx, bx, by, boxW, boxH, boxH / 2)
  ctx.fill()
  // Estrela mini
  const cx = bx + padX, cy = by + boxH / 2
  ctx.fillStyle = '#a855f7'
  ctx.beginPath()
  ctx.moveTo(cx, cy - 8)
  ctx.lineTo(cx + 1.5, cy - 1.5)
  ctx.lineTo(cx + 8, cy)
  ctx.lineTo(cx + 1.5, cy + 1.5)
  ctx.lineTo(cx, cy + 8)
  ctx.lineTo(cx - 1.5, cy + 1.5)
  ctx.lineTo(cx - 8, cy)
  ctx.lineTo(cx - 1.5, cy - 1.5)
  ctx.closePath()
  ctx.fill()
  // Texto
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText('Iara Hub', bx + padX + 18, cy)
  ctx.restore()
}

/**
 * Renderiza um slide completo no canvas fornecido.
 * O canvas deve ter largura e altura iguais (será tratado como 1080×1080).
 */
export async function renderSlide2(
  canvas: HTMLCanvasElement,
  slide: Slide2,
  imageCache: ImageCache,
  opts: RenderOptions = {},
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const size = CANVAS_SIZE
  canvas.width = size
  canvas.height = size

  // Fundo
  drawBackground(ctx, slide.background, size, imageCache)
  // Overlay
  drawOverlay(ctx, slide.overlay, size)

  // Layers em ordem (z-index = index do array)
  for (const layer of slide.layers) {
    if (layer.type === 'photo') drawPhotoLayer(ctx, layer as PhotoLayer, size, imageCache)
    else if (layer.type === 'shape') drawShapeLayer(ctx, layer as ShapeLayer, size)
    else if (layer.type === 'text') drawTextLayer(ctx, layer as TextLayer, size)
  }

  if (opts.watermark) drawWatermark(ctx, size)
}

/** Converte canvas → Blob PNG */
export function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.95): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('canvas.toBlob returned null')), 'image/png', quality)
  })
}

// Satisfaz linter para imports não usados por Layer em runtime
void null as unknown as Layer
