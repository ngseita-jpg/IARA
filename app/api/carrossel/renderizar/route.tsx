import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import type React from 'react'
import type { Slide } from '../gerar/route'

// ─── Font ─────────────────────────────────────────────────────────────────────
let _fontCache: ArrayBuffer | null = null
async function loadFont(reqUrl: string): Promise<ArrayBuffer | null> {
  if (_fontCache) return _fontCache
  try {
    const buf = readFileSync(join(process.cwd(), 'public', 'inter-bold.ttf'))
    _fontCache = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
    return _fontCache
  } catch {}
  try {
    const origin = new URL(reqUrl).origin
    const res = await fetch(`${origin}/inter-bold.ttf`)
    if (res.ok) { _fontCache = await res.arrayBuffer(); return _fontCache }
  } catch {}
  return null
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BG      = '#08080f'
const CARD    = '#13131f'
const GRAD_H  = 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)'
const GRAD_D  = 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)'
const VIOLET  = '#a855f7'
const TEXT    = '#ffffff'
const TEXT_DIM   = 'rgba(255,255,255,0.72)'
const TEXT_MUTED = 'rgba(255,255,255,0.50)'
const TEXT_FAINT = 'rgba(255,255,255,0.28)'
const EDGE    = 72

// ─── Helpers ──────────────────────────────────────────────────────────────────
function detectMediaType(b64: string): string {
  const h = b64.slice(0, 16)
  if (h.startsWith('/9j/'))    return 'image/jpeg'
  if (h.startsWith('iVBORw')) return 'image/png'
  if (h.startsWith('R0lGOD')) return 'image/gif'
  if (h.startsWith('UklGR'))  return 'image/webp'
  return 'image/jpeg'
}

function prepImg(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const clean = raw.replace(/^data:image\/[^;]+;base64,/, '')
  return `data:${detectMediaType(clean)};base64,${clean}`
}

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)) }
function trunc(s: string | undefined, max: number) {
  const str = s ?? ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function IaraStar({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs>
        <linearGradient id="isg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path d="M16 0 L18.4 13.6 L32 16 L18.4 18.4 L16 32 L13.6 18.4 L0 16 L13.6 13.6 Z" fill="url(#isg)" />
    </svg>
  )
}

function Dots({ total, active }: { total: number; active: number }) {
  const count = clamp(total, 1, 10)
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: i === active ? 24 : 6, height: 6, borderRadius: 3,
          backgroundColor: i === active ? VIOLET : 'rgba(255,255,255,0.28)',
        }} />
      ))}
    </div>
  )
}

function GradBar({ w = 64, h = 4 }: { w?: number; h?: number }) {
  return <div style={{ width: w, height: h, backgroundImage: GRAD_H, borderRadius: h / 2, display: 'flex' }} />
}

function BottomBar() {
  return <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, backgroundImage: GRAD_H, display: 'flex' }} />
}

function Watermark() {
  return (
    <div style={{
      position: 'absolute', right: 24, bottom: 24,
      display: 'flex', alignItems: 'center', gap: 8,
      paddingTop: 7, paddingBottom: 7, paddingLeft: 10, paddingRight: 14,
      backgroundColor: 'rgba(0,0,0,0.50)', borderRadius: 999,
    }}>
      <IaraStar size={16} />
      <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Iara Hub</span>
    </div>
  )
}

function fotoObjectPosition(foco?: string): string {
  switch (foco) {
    case 'topo':     return 'center top'
    case 'base':     return 'center bottom'
    case 'esquerda': return 'left center'
    case 'direita':  return 'right center'
    default:         return 'center center'
  }
}

function Photo({ src, foco }: { src: string; foco?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: fotoObjectPosition(foco) }} />
}

// ─── Archetype 1: cover_full ──────────────────────────────────────────────────
function renderCoverFull(slide: Slide, imgSrc: string | undefined, total: number) {
  const text = trunc(slide.titulo || slide.corpo, 72)
  const fs = text.length > 50 ? 84 : text.length > 35 ? 104 : 124
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: BG, display: 'flex' }}>
      {/* Background */}
      {imgSrc
        ? <Photo src={imgSrc} foco={slide.foto_foco} />
        : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: GRAD_D, display: 'flex' }} />
      }
      {/* Scrim topo */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300, backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%)', display: 'flex' }} />
      {/* Scrim base */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 520, backgroundImage: 'linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0) 100%)', display: 'flex' }} />

      {/* Eyebrow topo */}
      <div style={{ position: 'absolute', top: EDGE, left: EDGE, display: 'flex', alignItems: 'center', gap: 12 }}>
        <IaraStar size={24} />
        <span style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', fontWeight: 600, letterSpacing: 1 }}>
          {trunc(slide.eyebrow || 'novo post', 40)}
        </span>
      </div>

      {/* Título */}
      <div style={{ position: 'absolute', left: EDGE, right: EDGE, bottom: 116 }}>
        <div style={{ fontSize: fs, fontWeight: 800, color: TEXT, lineHeight: 1.05, letterSpacing: -1.5 }}>
          {text}
        </div>
      </div>

      {/* Rodapé */}
      <div style={{ position: 'absolute', left: EDGE, right: EDGE, bottom: EDGE, display: 'flex', alignItems: 'center', gap: 20 }}>
        <GradBar />
        {slide.handle && <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>{slide.handle}</span>}
        <div style={{ flex: 1, display: 'flex' }} />
        <Dots total={total} active={slide.ordem - 1} />
      </div>
    </div>
  )
}

// ─── Archetype 2: split_v ─────────────────────────────────────────────────────
function renderSplitV(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 50)
  const corpo = trunc(slide.corpo, 110)
  const fs = titulo.length > 35 ? 50 : 66
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', backgroundColor: BG }}>
      {/* Coluna esquerda — texto */}
      <div style={{
        width: 432, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        paddingTop: EDGE, paddingBottom: EDGE, paddingLeft: EDGE, paddingRight: 44,
        backgroundColor: BG,
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ fontSize: 16, color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1 }}>
          {trunc(slide.eyebrow || `${String(clamp(slide.ordem - 1, 1, 99)).padStart(2, '0')} · conteúdo`, 40)}
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {titulo && (
            <div style={{ fontSize: fs, fontWeight: 800, color: TEXT, lineHeight: 1.05, letterSpacing: -1 }}>
              {titulo}
            </div>
          )}
          <div style={{ fontSize: 24, fontWeight: 400, color: TEXT_DIM, lineHeight: 1.5 }}>
            {corpo}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IaraStar size={14} />
          <span style={{ fontSize: 13, color: TEXT_FAINT }}>iarahub.com.br</span>
        </div>
      </div>

      {/* Coluna direita — foto ou gradiente */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        {imgSrc
          ? <Photo src={imgSrc} foco={slide.foto_foco} />
          : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, rgba(99,102,241,0.35) 100%)', display: 'flex' }} />
        }
        <div style={{ position: 'absolute', top: 0, left: 0, width: 4, bottom: 0, backgroundImage: GRAD_H, display: 'flex' }} />
      </div>
    </div>
  )
}

// ─── Archetype 3: top_text ────────────────────────────────────────────────────
function renderTopText(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 55)
  const corpo  = trunc(slide.corpo, 110)
  const fs = titulo.length > 40 ? 78 : titulo.length > 28 ? 94 : 110
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: BG, display: 'flex' }}>
      {/* Metade inferior — foto ou gradiente */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 520, bottom: 0, display: 'flex', overflow: 'hidden' }}>
        {imgSrc
          ? <Photo src={imgSrc} foco={slide.foto_foco} />
          : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(180deg, #1a1a2e 0%, rgba(168,85,247,0.40) 100%)', display: 'flex' }} />
        }
        {/* Fade topo para bg */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 140, backgroundImage: `linear-gradient(180deg, ${BG} 0%, rgba(8,8,15,0) 100%)`, display: 'flex' }} />
      </div>

      {/* Eyebrow */}
      <span style={{ position: 'absolute', top: EDGE + 16, left: EDGE, fontSize: 16, color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1 }}>
        {trunc(slide.eyebrow || `dica #${clamp(slide.ordem - 1, 1, 99)}`, 45)}
      </span>

      {/* Título */}
      {titulo && (
        <div style={{ position: 'absolute', left: EDGE, right: EDGE, top: 148, fontSize: fs, fontWeight: 800, color: TEXT, lineHeight: 1.05, letterSpacing: -1.5 }}>
          {titulo}
        </div>
      )}

      {/* Corpo */}
      {corpo && (
        <div style={{ position: 'absolute', left: EDGE, right: 280, top: 420, fontSize: 26, fontWeight: 400, color: TEXT_DIM, lineHeight: 1.45 }}>
          {corpo}
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 50, left: EDGE, display: 'flex' }}>
        <Dots total={total} active={slide.ordem - 1} />
      </div>
    </div>
  )
}

// ─── Archetype 4: full_bleed ──────────────────────────────────────────────────
function renderFullBleed(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 50)
  const corpo  = trunc(slide.corpo, 90)
  const fs = titulo.length > 30 ? 58 : titulo.length > 22 ? 72 : 86
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: BG, display: 'flex' }}>
      {/* Background */}
      {imgSrc
        ? <Photo src={imgSrc} foco={slide.foto_foco} />
        : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: GRAD_D, display: 'flex' }} />
      }
      {/* Scrim base para texto */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 600, backgroundImage: 'linear-gradient(0deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0) 100%)', display: 'flex' }} />

      {/* Chip número */}
      <div style={{ position: 'absolute', top: EDGE, right: EDGE, paddingTop: 10, paddingBottom: 10, paddingLeft: 18, paddingRight: 18, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 999, display: 'flex' }}>
        <span style={{ fontSize: 17, color: 'rgba(255,255,255,0.90)', fontWeight: 700 }}>
          {String(slide.ordem).padStart(2, '0')}
        </span>
      </div>

      {/* Texto inferior */}
      <div style={{ position: 'absolute', left: EDGE, right: EDGE, bottom: 100, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {titulo && (
          <div style={{ fontSize: fs, fontWeight: 800, color: TEXT, lineHeight: 1.05, letterSpacing: -1.5 }}>
            {titulo}
          </div>
        )}
        {corpo && (
          <div style={{ fontSize: 26, fontWeight: 400, color: TEXT_DIM, lineHeight: 1.4 }}>
            {corpo}
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: EDGE, left: EDGE, display: 'flex' }}>
        <Dots total={total} active={slide.ordem - 1} />
      </div>
    </div>
  )
}

// ─── Archetype 5: quote ───────────────────────────────────────────────────────
function renderQuote(slide: Slide, imgSrc: string | undefined, total: number) {
  const quote = trunc(slide.titulo || slide.corpo, 120)
  const autor = slide.titulo ? trunc(slide.corpo, 80) : ''
  const fs = quote.length > 80 ? 48 : quote.length > 55 ? 58 : 68
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex' }}>
      {/* Background */}
      {imgSrc
        ? <Photo src={imgSrc} foco={slide.foto_foco} />
        : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: CARD, display: 'flex' }} />
      }
      {/* Overlay escuro */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,8,15,0.75)', display: 'flex' }} />

      {/* Aspas — decorativo */}
      <div style={{ position: 'absolute', left: 64, top: 200, fontSize: 240, fontWeight: 900, color: VIOLET, lineHeight: 1.0 }}>
        "
      </div>

      {/* Eyebrow */}
      <span style={{ position: 'absolute', top: 88, left: 0, right: 0, textAlign: 'center', fontSize: 16, color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1.5 }}>
        {trunc(slide.eyebrow || '— reflexão', 50)}
      </span>

      {/* Quote */}
      <div style={{ position: 'absolute', left: 100, right: 100, top: 310, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ fontSize: fs, fontWeight: 700, color: TEXT, lineHeight: 1.15, letterSpacing: -1 }}>
          {quote}
        </div>
        {autor && (
          <div style={{ fontSize: 24, fontWeight: 400, color: TEXT_DIM, lineHeight: 1.4 }}>
            {autor}
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: EDGE, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Dots total={total} active={slide.ordem - 1} />
      </div>
    </div>
  )
}

// ─── Archetype 6: closing ─────────────────────────────────────────────────────
function renderClosing(slide: Slide, total: number) {
  const cta  = trunc(slide.cta || 'Salve esse post.', 30)
  const info = trunc(slide.corpo, 80)
  const fs   = cta.length > 20 ? 88 : 116
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: BG, display: 'flex' }}>
      {/* Gradiente decorativo único */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(8,8,15,0) 50%)', display: 'flex' }} />

      {/* Logo topo */}
      <div style={{ position: 'absolute', top: EDGE, left: EDGE, display: 'flex', alignItems: 'center', gap: 12 }}>
        <IaraStar size={30} />
        <span style={{ fontSize: 24, fontWeight: 700, color: TEXT }}>Iara Hub</span>
      </div>

      {/* Eyebrow */}
      <span style={{ position: 'absolute', top: 218, left: EDGE, fontSize: 17, color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1 }}>
        {trunc(slide.eyebrow || 'gostou?', 40)}
      </span>

      {/* CTA grande */}
      <div style={{ position: 'absolute', left: EDGE, right: EDGE, top: 280, fontSize: fs, fontWeight: 800, color: TEXT, lineHeight: 1.05, letterSpacing: -1.5 }}>
        {cta}
      </div>

      {/* Linha gradiente */}
      <div style={{ position: 'absolute', left: EDGE, top: 550, width: 160, height: 5, backgroundImage: GRAD_H, borderRadius: 3, display: 'flex' }} />

      {/* Info curta */}
      {info && (
        <div style={{ position: 'absolute', left: EDGE, right: EDGE, top: 592, fontSize: 28, fontWeight: 400, color: TEXT_DIM, lineHeight: 1.4 }}>
          {info}
        </div>
      )}

      {/* Handle */}
      {slide.handle && (
        <div style={{ position: 'absolute', left: EDGE, bottom: 100, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: TEXT_FAINT, fontWeight: 600, letterSpacing: 1 }}>SIGA</span>
          <span style={{ fontSize: 32, fontWeight: 700, color: TEXT }}>{trunc(slide.handle, 30)}</span>
        </div>
      )}

      <BottomBar />
      <div style={{ position: 'absolute', bottom: 36, right: EDGE, display: 'flex' }}>
        <Dots total={total} active={slide.ordem - 1} />
      </div>
    </div>
  )
}

// ─── Archetype 7: brand_cover ─────────────────────────────────────────────────
function renderBrandCover(slide: Slide, imgSrc: string | undefined, total: number) {
  const text = trunc(slide.titulo || slide.corpo, 60)
  const fs   = text.length > 30 ? 88 : 112
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: CARD, display: 'flex' }}>
      {imgSrc && <Photo src={imgSrc} foco={slide.foto_foco} />}
      {imgSrc && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(180deg, rgba(19,19,31,0.80) 0%, rgba(19,19,31,0) 35%, rgba(19,19,31,0) 55%, rgba(19,19,31,0.90) 100%)', display: 'flex' }} />
      )}
      {!imgSrc && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: GRAD_D, display: 'flex' }} />
      )}

      {/* Header */}
      <div style={{ position: 'absolute', top: EDGE, left: EDGE, display: 'flex', alignItems: 'center', gap: 12 }}>
        <IaraStar size={26} />
        <span style={{ fontSize: 18, color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1 }}>
          {trunc(slide.eyebrow || 'lançamento', 40)}
        </span>
      </div>

      {/* Título bottom */}
      <div style={{ position: 'absolute', left: EDGE, right: EDGE, bottom: 116 }}>
        <div style={{ fontSize: fs, fontWeight: 800, color: TEXT, lineHeight: 1.05, letterSpacing: -1.5 }}>
          {text}
        </div>
      </div>

      <div style={{ position: 'absolute', left: EDGE, right: EDGE, bottom: EDGE, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <GradBar w={80} />
        <Dots total={total} active={slide.ordem - 1} />
      </div>
    </div>
  )
}

// ─── Archetype 8: brand_story ─────────────────────────────────────────────────
function renderBrandStory(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 45)
  const corpo  = trunc(slide.corpo, 110)
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex' }}>
      {imgSrc
        ? <Photo src={imgSrc} foco={slide.foto_foco} />
        : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, rgba(99,102,241,0.30) 100%)', display: 'flex' }} />
      }
      {/* Scrim esquerdo */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(90deg, rgba(8,8,15,0.92) 0%, rgba(8,8,15,0.70) 42%, rgba(8,8,15,0) 68%)', display: 'flex' }} />

      <div style={{ position: 'absolute', top: EDGE, left: EDGE, display: 'flex', alignItems: 'center', gap: 10 }}>
        <IaraStar size={18} />
        <span style={{ fontSize: 15, color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1 }}>
          {trunc(slide.eyebrow || 'bastidores', 40)}
        </span>
      </div>

      {titulo && (
        <div style={{ position: 'absolute', left: EDGE, top: 210, width: 540, fontSize: 54, fontWeight: 700, color: TEXT, lineHeight: 1.05, letterSpacing: -1 }}>
          {titulo}
        </div>
      )}

      {corpo && (
        <div style={{ position: 'absolute', left: EDGE, top: 345, width: 520, fontSize: 26, fontWeight: 400, color: TEXT_DIM, lineHeight: 1.5 }}>
          {corpo}
        </div>
      )}

      <div style={{ position: 'absolute', bottom: EDGE, right: EDGE, display: 'flex' }}>
        <Dots total={total} active={slide.ordem - 1} />
      </div>
    </div>
  )
}

// ─── Archetype 9: brand_promo ─────────────────────────────────────────────────
function renderBrandPromo(slide: Slide, _imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 50)
  const corpo  = trunc(slide.corpo, 90)
  const cta    = slide.cta ? trunc(slide.cta, 30) : null
  const fs = titulo.length > 30 ? 58 : titulo.length > 20 ? 72 : 86
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: BG, display: 'flex' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(99,102,241,0.15) 100%)', display: 'flex' }} />

      <div style={{ position: 'absolute', top: EDGE, left: EDGE, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 30, height: 2, backgroundImage: GRAD_H, borderRadius: 1, display: 'flex' }} />
        <span style={{ fontSize: 16, color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1 }}>
          {trunc(slide.eyebrow || 'oferta especial', 40)}
        </span>
      </div>

      {titulo && (
        <div style={{ position: 'absolute', left: EDGE, right: EDGE, top: 195, fontSize: fs, fontWeight: 800, color: TEXT, lineHeight: 1.05, letterSpacing: -1.5 }}>
          {titulo}
        </div>
      )}

      <div style={{ position: 'absolute', left: EDGE, top: 430, width: 110, height: 5, backgroundImage: GRAD_H, borderRadius: 3, display: 'flex' }} />

      {corpo && (
        <div style={{ position: 'absolute', left: EDGE, right: EDGE, top: 474, fontSize: 28, fontWeight: 400, color: TEXT_DIM, lineHeight: 1.4 }}>
          {corpo}
        </div>
      )}

      {cta && (
        <div style={{ position: 'absolute', left: EDGE, top: 690, paddingTop: 18, paddingBottom: 18, paddingLeft: 44, paddingRight: 44, backgroundImage: GRAD_H, borderRadius: 999, display: 'flex' }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: TEXT }}>{cta}</span>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: EDGE, left: EDGE, display: 'flex' }}>
        <Dots total={total} active={slide.ordem - 1} />
      </div>
      <BottomBar />
    </div>
  )
}

// ─── Fallback — ultra-simples, nunca crasha ───────────────────────────────────
function renderFallback(slide: Slide, total: number) {
  const title = trunc(slide.titulo || slide.corpo, 72)
  const body  = slide.titulo ? trunc(slide.corpo, 130) : ''
  const fs    = title.length > 45 ? 72 : title.length > 28 ? 90 : 108
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: BG, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: EDGE, paddingBottom: EDGE, paddingLeft: EDGE, paddingRight: EDGE }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(8,8,15,0) 60%)', display: 'flex' }} />
      <span style={{ fontSize: 16, color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1, marginBottom: 28 }}>
        {trunc(slide.eyebrow || `${String(slide.ordem).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, 50)}
      </span>
      <div style={{ fontSize: fs, fontWeight: 800, color: TEXT, lineHeight: 1.05, letterSpacing: -1.5, marginBottom: 32 }}>
        {title}
      </div>
      {body && (
        <div style={{ fontSize: 28, fontWeight: 400, color: TEXT_DIM, lineHeight: 1.45 }}>
          {body}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: EDGE, left: EDGE, display: 'flex' }}>
        <Dots total={total} active={slide.ordem - 1} />
      </div>
      <BottomBar />
    </div>
  )
}

// ─── Resolver ─────────────────────────────────────────────────────────────────
const CYCLE      = ['split_v', 'top_text', 'full_bleed', 'quote'] as const
const CYCLE_NOIMG = ['top_text', 'quote', 'split_v', 'full_bleed'] as const

// Arquétipos que sobrepõem texto no centro/base da foto (risco de cobrir rosto)
const ARCHS_RISCO_ROSTO = new Set(['cover_full', 'full_bleed', 'brand_cover'])

function resolveArq(slide: Slide, hasBg: boolean, modo: string): string {
  let arq = slide.arquetipo
  if (!arq) {
    if (slide.tipo === 'capa') arq = modo === 'marca' ? 'brand_cover' : 'cover_full'
    else if (slide.tipo === 'encerramento') arq = modo === 'marca' ? 'brand_promo' : 'closing'
    else {
      const idx = (slide.ordem - 2 + 400) % 4
      arq = (hasBg ? CYCLE : CYCLE_NOIMG)[idx]
    }
  }
  // Fallback de segurança: rosto no centro + arquétipo de risco → split_v (texto à esquerda, foto à direita)
  if (slide.foto_tem_rosto && slide.foto_foco === 'centro' && ARCHS_RISCO_ROSTO.has(arq)) {
    arq = modo === 'marca' ? 'brand_story' : 'split_v'
  }
  return arq
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body         = await req.json()
    const slide: Slide = body.slide
    const total: number = typeof body.total_slides === 'number' ? body.total_slides : 6
    const show_wm: boolean = body.show_watermark === true
    const modo: string = body.modo || 'criador'

    const fontData = await loadFont(req.url)
    const fonts = fontData
      ? [{ name: 'Inter', data: fontData, weight: 700 as const, style: 'normal' as const }]
      : []

    const imgSrc = prepImg(body.imagem_base64 as string | undefined)
    const arq    = resolveArq(slide, !!imgSrc, modo)

    let content: React.ReactElement
    switch (arq) {
      case 'cover_full':  content = renderCoverFull(slide, imgSrc, total); break
      case 'split_v':     content = renderSplitV(slide, imgSrc, total); break
      case 'top_text':    content = renderTopText(slide, imgSrc, total); break
      case 'full_bleed':  content = renderFullBleed(slide, imgSrc, total); break
      case 'quote':       content = renderQuote(slide, imgSrc, total); break
      case 'closing':     content = renderClosing(slide, total); break
      case 'brand_cover': content = renderBrandCover(slide, imgSrc, total); break
      case 'brand_story': content = renderBrandStory(slide, imgSrc, total); break
      case 'brand_promo': content = renderBrandPromo(slide, imgSrc, total); break
      default:            content = renderFallback(slide, total)
    }

    const root = (c: React.ReactElement) => (
      <div style={{ width: 1080, height: 1080, position: 'relative', backgroundColor: BG, display: 'flex', fontFamily: 'Inter', overflow: 'hidden' }}>
        {c}
        {show_wm && <Watermark />}
      </div>
    )

    let buf: ArrayBuffer
    try {
      buf = await new ImageResponse(root(content), { width: 1080, height: 1080, fonts }).arrayBuffer()
    } catch {
      buf = await new ImageResponse(root(renderFallback(slide, total)), { width: 1080, height: 1080, fonts }).arrayBuffer()
    }

    return new Response(buf, { headers: { 'Content-Type': 'image/png' } })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[renderizar]', msg)
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
