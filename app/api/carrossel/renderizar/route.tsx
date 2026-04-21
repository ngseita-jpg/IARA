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
      {/* Scrim base — apenas atrás do texto */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, backgroundImage: 'linear-gradient(0deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0) 100%)', display: 'flex' }} />

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
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 420, backgroundImage: 'linear-gradient(0deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0) 100%)', display: 'flex' }} />

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
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,8,15,0.45)', display: 'flex' }} />

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
function renderClosing(slide: Slide, total: number, imgSrc?: string) {
  const cta  = trunc(slide.cta || 'Salve esse post.', 30)
  const info = trunc(slide.corpo, 80)
  const fs   = cta.length > 20 ? 88 : 116
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: BG, display: 'flex' }}>
      {/* Foto de fundo se disponível */}
      {imgSrc && <Photo src={imgSrc} foco={slide.foto_foco} />}
      {/* Overlay leve sobre foto */}
      {imgSrc
        ? <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,8,15,0.55)', display: 'flex' }} />
        : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(8,8,15,0) 50%)', display: 'flex' }} />
      }

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
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(180deg, rgba(19,19,31,0.55) 0%, rgba(19,19,31,0) 35%, rgba(19,19,31,0) 55%, rgba(19,19,31,0.65) 100%)', display: 'flex' }} />
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
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(90deg, rgba(8,8,15,0.75) 0%, rgba(8,8,15,0.55) 42%, rgba(8,8,15,0) 68%)', display: 'flex' }} />

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

// ─── Archetype 10: editorial ──────────────────────────────────────────────────
// Painel branco à esquerda (editorial/magazine), foto à direita — estética clean & luxury
function renderEditorial(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 45)
  const corpo  = trunc(slide.corpo, 100)
  const fs = titulo.length > 30 ? 54 : titulo.length > 20 ? 68 : 82
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', backgroundColor: '#f5f4f0' }}>
      {/* Painel esquerdo — branco/creme */}
      <div style={{ width: 460, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 72, paddingBottom: 64, paddingLeft: 68, paddingRight: 52, backgroundColor: '#f5f4f0' }}>
        {/* Número editorial */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#888880', letterSpacing: 3 }}>
            {String(slide.ordem).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <div style={{ width: 40, height: 2, backgroundColor: '#1a1a1a', marginTop: 14, display: 'flex' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {slide.eyebrow && (
            <span style={{ fontSize: 13, fontWeight: 700, color: '#888880', letterSpacing: 2 }}>
              {trunc(slide.eyebrow, 40).toUpperCase()}
            </span>
          )}
          {titulo && (
            <div style={{ fontSize: fs, fontWeight: 900, color: '#0a0a0a', lineHeight: 1.0, letterSpacing: -2 }}>
              {titulo}
            </div>
          )}
          {corpo && (
            <div style={{ fontSize: 22, fontWeight: 400, color: '#444440', lineHeight: 1.55 }}>
              {corpo}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IaraStar size={14} />
          <span style={{ fontSize: 12, color: '#aaaaaa', fontWeight: 600, letterSpacing: 1 }}>IARA HUB</span>
        </div>
      </div>

      {/* Separador */}
      <div style={{ width: 1, backgroundColor: '#ddddd8', display: 'flex' }} />

      {/* Foto direita */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        {imgSrc
          ? <Photo src={imgSrc} foco={slide.foto_foco} />
          : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(135deg, #e8e4dc 0%, #c8c4bc 100%)', display: 'flex' }} />
        }
        {/* Linha de acento no topo */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, backgroundImage: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)', display: 'flex' }} />
      </div>
    </div>
  )
}

// ─── Archetype 11: cinematic ──────────────────────────────────────────────────
// Letterbox: foto na faixa do meio, barras pretas topo e base com texto — estilo cinema
function renderCinematic(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 55)
  const corpo  = trunc(slide.corpo, 90)
  const BAR    = 210
  const fs = titulo.length > 35 ? 52 : titulo.length > 22 ? 66 : 80
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#000000' }}>
      {/* Barra topo — preta com texto */}
      <div style={{ height: BAR, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: EDGE, paddingRight: EDGE, gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 3, height: 28, backgroundImage: GRAD_H, borderRadius: 2, display: 'flex' }} />
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: 2 }}>
            {trunc(slide.eyebrow || 'IARA HUB', 40).toUpperCase()}
          </span>
        </div>
        {titulo && (
          <div style={{ fontSize: fs, fontWeight: 900, color: '#ffffff', lineHeight: 1.0, letterSpacing: -1.5 }}>
            {titulo}
          </div>
        )}
      </div>

      {/* Faixa central — foto */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        {imgSrc
          ? <Photo src={imgSrc} foco={slide.foto_foco} />
          : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, rgba(99,102,241,0.5) 100%)', display: 'flex' }} />
        }
        {/* Vinheta nas bordas horizontais */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundImage: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)', display: 'flex' }} />
        {/* Chip ordem */}
        <div style={{ position: 'absolute', right: 28, top: '50%', transform: 'none', display: 'flex', paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 4 }}>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>{String(slide.ordem).padStart(2, '0')}/{String(total).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Barra base — preta com corpo */}
      <div style={{ height: BAR, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: EDGE, paddingRight: EDGE, gap: 16, flexShrink: 0 }}>
        {corpo && (
          <div style={{ fontSize: 26, fontWeight: 400, color: 'rgba(255,255,255,0.78)', lineHeight: 1.45 }}>
            {corpo}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <GradBar w={48} h={3} />
          {slide.handle && <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{slide.handle}</span>}
          <div style={{ flex: 1, display: 'flex' }} />
          <Dots total={total} active={slide.ordem - 1} />
        </div>
      </div>
    </div>
  )
}

// ─── Archetype 12: caption_bar ────────────────────────────────────────────────
// Foto preenche topo (65%), barra sólida na base com texto — estilo feed moderno
function renderCaptionBar(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 48)
  const corpo  = trunc(slide.corpo, 80)
  const fs = titulo.length > 32 ? 50 : titulo.length > 20 ? 62 : 76
  const BAR_H  = 340
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', backgroundColor: BG }}>
      {/* Zona de foto — topo */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        {imgSrc
          ? <Photo src={imgSrc} foco={slide.foto_foco} />
          : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: GRAD_D, display: 'flex' }} />
        }
        {/* Eyebrow no topo da foto */}
        <div style={{ position: 'absolute', top: 28, left: 36, display: 'flex', alignItems: 'center', gap: 10, paddingTop: 7, paddingBottom: 7, paddingLeft: 14, paddingRight: 14, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 999 }}>
          <IaraStar size={14} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600, letterSpacing: 0.5 }}>
            {trunc(slide.eyebrow || 'conteúdo', 35)}
          </span>
        </div>
        {/* Fade base */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundImage: `linear-gradient(0deg, ${BG} 0%, rgba(8,8,15,0) 100%)`, display: 'flex' }} />
      </div>

      {/* Barra de texto — base */}
      <div style={{ height: BAR_H, backgroundColor: BG, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 28, paddingBottom: 36, paddingLeft: EDGE, paddingRight: EDGE, flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <GradBar w={52} h={3} />
          {titulo && (
            <div style={{ fontSize: fs, fontWeight: 800, color: TEXT, lineHeight: 1.05, letterSpacing: -1.5 }}>
              {titulo}
            </div>
          )}
          {corpo && (
            <div style={{ fontSize: 22, fontWeight: 400, color: TEXT_DIM, lineHeight: 1.45 }}>
              {corpo}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {slide.handle && <span style={{ fontSize: 18, color: TEXT_MUTED, fontWeight: 500 }}>{slide.handle}</span>}
          <div style={{ flex: 1, display: 'flex' }} />
          <Dots total={total} active={slide.ordem - 1} />
        </div>
      </div>
    </div>
  )
}

// ─── Archetype 13: inset_photo ────────────────────────────────────────────────
// Foto emoldurada/contida no centro — design de card premium com margens visíveis
function renderInsetPhoto(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 40)
  const corpo  = trunc(slide.corpo, 80)
  const fs = titulo.length > 28 ? 52 : titulo.length > 18 ? 64 : 76
  const MARGIN = 52
  const PHOTO_H = 560
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: CARD, paddingTop: MARGIN, paddingBottom: MARGIN, paddingLeft: MARGIN, paddingRight: MARGIN }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IaraStar size={18} />
          <span style={{ fontSize: 14, color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1 }}>
            {trunc(slide.eyebrow || 'conteúdo', 35)}
          </span>
        </div>
        <span style={{ fontSize: 14, color: TEXT_FAINT, fontWeight: 700 }}>
          {String(slide.ordem).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>

      {/* Foto emoldurada */}
      <div style={{ height: PHOTO_H, position: 'relative', display: 'flex', overflow: 'hidden', borderRadius: 16, flexShrink: 0 }}>
        {imgSrc
          ? <Photo src={imgSrc} foco={slide.foto_foco} />
          : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: GRAD_D, display: 'flex' }} />
        }
        {/* Overlay sutil */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.3) 100%)', display: 'flex' }} />
      </div>

      {/* Texto abaixo da foto */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
        <div style={{ width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex' }} />
        {titulo && (
          <div style={{ fontSize: fs, fontWeight: 800, color: TEXT, lineHeight: 1.05, letterSpacing: -1 }}>
            {titulo}
          </div>
        )}
        {corpo && (
          <div style={{ fontSize: 20, fontWeight: 400, color: TEXT_DIM, lineHeight: 1.45 }}>
            {corpo}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Archetype 14: warm_overlay ───────────────────────────────────────────────
// Foto com overlay âmbar/quente — clima lifestyle, orgânico, humano
function renderWarmOverlay(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 52)
  const corpo  = trunc(slide.corpo, 90)
  const fs = titulo.length > 36 ? 64 : titulo.length > 24 ? 80 : 96
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', backgroundColor: '#1a0e05' }}>
      {imgSrc
        ? <Photo src={imgSrc} foco={slide.foto_foco} />
        : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(135deg, #3d1a05 0%, #7c3a12 100%)', display: 'flex' }} />
      }
      {/* Scrim base — apenas atrás do texto */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 260, backgroundImage: 'linear-gradient(0deg, rgba(10,4,0,0.60) 0%, rgba(10,4,0,0) 100%)', display: 'flex' }} />

      {/* Eyebrow */}
      <div style={{ position: 'absolute', top: EDGE, left: EDGE, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 3, backgroundColor: '#f59e0b', borderRadius: 2, display: 'flex' }} />
        <span style={{ fontSize: 15, color: '#f59e0b', fontWeight: 600, letterSpacing: 1.5 }}>
          {trunc(slide.eyebrow || 'lifestyle', 38).toUpperCase()}
        </span>
      </div>

      {/* Texto principal */}
      <div style={{ position: 'absolute', left: EDGE, right: EDGE, bottom: 120, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {titulo && (
          <div style={{ fontSize: fs, fontWeight: 800, color: '#fff8f0', lineHeight: 1.05, letterSpacing: -1.5 }}>
            {titulo}
          </div>
        )}
        {corpo && (
          <div style={{ fontSize: 25, fontWeight: 400, color: 'rgba(255,240,220,0.78)', lineHeight: 1.45 }}>
            {corpo}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', left: EDGE, right: EDGE, bottom: EDGE, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 3, backgroundColor: '#f59e0b', borderRadius: 2, display: 'flex' }} />
          {slide.handle && <span style={{ fontSize: 18, color: 'rgba(255,240,220,0.65)', fontWeight: 500 }}>{slide.handle}</span>}
        </div>
        <Dots total={total} active={slide.ordem - 1} />
      </div>
    </div>
  )
}

// ─── Archetype 15: bold_type ──────────────────────────────────────────────────
// Tipografia dominante — texto ENORME com foto como fundo sutil, design editorial agressivo
function renderBoldType(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 30)
  const corpo  = trunc(slide.corpo, 80)
  const fs = titulo.length > 20 ? 96 : titulo.length > 12 ? 120 : 148
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', backgroundColor: '#000000' }}>
      {/* Foto com opacidade reduzida — apenas textura */}
      {imgSrc && (
        <>
          <Photo src={imgSrc} foco={slide.foto_foco} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex' }} />
        </>
      )}
      {!imgSrc && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(135deg, #0a0010 0%, #150028 100%)', display: 'flex' }} />
      )}

      {/* Número decorativo gigante — fundo */}
      <div style={{ position: 'absolute', right: -20, top: 60, fontSize: 380, fontWeight: 900, color: 'rgba(255,255,255,0.04)', lineHeight: 1, letterSpacing: -10 }}>
        {String(slide.ordem).padStart(2, '0')}
      </div>

      {/* Linha de acento */}
      <div style={{ position: 'absolute', left: EDGE, top: EDGE, width: 5, height: 80, backgroundImage: GRAD_H, borderRadius: 3, display: 'flex' }} />

      {/* Eyebrow */}
      <span style={{ position: 'absolute', left: EDGE + 22, top: EDGE + 8, fontSize: 14, color: VIOLET, fontWeight: 700, letterSpacing: 2 }}>
        {trunc(slide.eyebrow || 'insight', 38).toUpperCase()}
      </span>

      {/* Título GIGANTE */}
      {titulo && (
        <div style={{ position: 'absolute', left: EDGE, right: EDGE, top: 210, fontSize: fs, fontWeight: 900, color: '#ffffff', lineHeight: 0.92, letterSpacing: -3 }}>
          {titulo}
        </div>
      )}

      {/* Linha separadora */}
      <div style={{ position: 'absolute', left: EDGE, bottom: 180, width: 100, height: 2, backgroundImage: GRAD_H, borderRadius: 1, display: 'flex' }} />

      {/* Corpo e dots */}
      <div style={{ position: 'absolute', left: EDGE, right: EDGE, bottom: 72, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {corpo && (
          <div style={{ fontSize: 24, fontWeight: 400, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
            {corpo}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IaraStar size={16} />
          <Dots total={total} active={slide.ordem - 1} />
        </div>
      </div>
    </div>
  )
}

// ─── Archetype 16: side_right ─────────────────────────────────────────────────
// Inverso do split_v — foto à esquerda (55%), texto à direita com painel escuro
function renderSideRight(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 45)
  const corpo  = trunc(slide.corpo, 100)
  const fs = titulo.length > 30 ? 52 : titulo.length > 20 ? 64 : 78
  const PHOTO_W = 594
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', backgroundColor: BG }}>
      {/* Foto à esquerda */}
      <div style={{ width: PHOTO_W, position: 'relative', display: 'flex', overflow: 'hidden', flexShrink: 0 }}>
        {imgSrc
          ? <Photo src={imgSrc} foco={slide.foto_foco} />
          : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: GRAD_D, display: 'flex' }} />
        }
        {/* Fade direita */}
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 80, backgroundImage: `linear-gradient(90deg, rgba(8,8,15,0) 0%, ${BG} 100%)`, display: 'flex' }} />
        {/* Linha de acento */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundImage: GRAD_H, display: 'flex' }} />
      </div>

      {/* Painel direito — texto */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: EDGE, paddingBottom: EDGE, paddingLeft: 36, paddingRight: EDGE }}>
        <span style={{ fontSize: 14, color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1 }}>
          {trunc(slide.eyebrow || `${String(slide.ordem).padStart(2, '0')} · conteúdo`, 35)}
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <GradBar w={44} h={3} />
          {titulo && (
            <div style={{ fontSize: fs, fontWeight: 800, color: TEXT, lineHeight: 1.05, letterSpacing: -1 }}>
              {titulo}
            </div>
          )}
          {corpo && (
            <div style={{ fontSize: 21, fontWeight: 400, color: TEXT_DIM, lineHeight: 1.5 }}>
              {corpo}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IaraStar size={13} />
          <span style={{ fontSize: 12, color: TEXT_FAINT, fontWeight: 600 }}>iarahub.com.br</span>
          <div style={{ flex: 1, display: 'flex' }} />
          <Dots total={total} active={slide.ordem - 1} />
        </div>
      </div>
    </div>
  )
}

// ─── Archetype 17: neon_card ─────────────────────────────────────────────────
// Card centralizado com borda neon — foto ao fundo desfocada, texto em destaque
function renderNeonCard(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 42)
  const corpo  = trunc(slide.corpo, 80)
  const fs = titulo.length > 28 ? 56 : titulo.length > 18 ? 70 : 86
  const CARD_W = 900
  const CARD_H = 680
  const CX = (1080 - CARD_W) / 2
  const CY = (1080 - CARD_H) / 2
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', backgroundColor: '#020209' }}>
      {/* Foto de fundo com overlay forte */}
      {imgSrc && (
        <>
          <Photo src={imgSrc} foco={slide.foto_foco} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(2,2,9,0.55)', display: 'flex' }} />
        </>
      )}

      {/* Glow de fundo — violet */}
      <div style={{ position: 'absolute', top: 200, left: 100, width: 400, height: 400, borderRadius: 999, backgroundColor: 'rgba(99,102,241,0.12)', display: 'flex' }} />
      <div style={{ position: 'absolute', bottom: 150, right: 80, width: 350, height: 350, borderRadius: 999, backgroundColor: 'rgba(236,72,153,0.10)', display: 'flex' }} />

      {/* Card centralizado com borda gradient */}
      <div style={{ position: 'absolute', top: CY, left: CX, width: CARD_W, height: CARD_H, borderRadius: 24, border: '1px solid rgba(99,102,241,0.45)', backgroundColor: 'rgba(13,13,28,0.88)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 52, paddingBottom: 48, paddingLeft: 60, paddingRight: 60 }}>
        {/* Header do card */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IaraStar size={18} />
            <span style={{ fontSize: 13, color: VIOLET, fontWeight: 600, letterSpacing: 1.5 }}>
              {trunc(slide.eyebrow || 'IARA HUB', 30).toUpperCase()}
            </span>
          </div>
          <span style={{ fontSize: 13, color: TEXT_FAINT, fontWeight: 700 }}>{String(slide.ordem).padStart(2, '0')}</span>
        </div>

        {/* Conteúdo central */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ width: 56, height: 3, backgroundImage: GRAD_H, borderRadius: 2, display: 'flex' }} />
          {titulo && (
            <div style={{ fontSize: fs, fontWeight: 800, color: TEXT, lineHeight: 1.05, letterSpacing: -1.5 }}>
              {titulo}
            </div>
          )}
          {corpo && (
            <div style={{ fontSize: 22, fontWeight: 400, color: TEXT_DIM, lineHeight: 1.5 }}>
              {corpo}
            </div>
          )}
        </div>

        {/* Footer do card */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {slide.handle && <span style={{ fontSize: 17, color: TEXT_MUTED, fontWeight: 500 }}>{slide.handle}</span>}
          <div style={{ flex: 1, display: 'flex' }} />
          <Dots total={total} active={slide.ordem - 1} />
        </div>
      </div>
    </div>
  )
}

// ─── Archetype 18: minimal_text ─────────────────────────────────────────────
// Fundo sólido escuro, tipografia minimalista — sem foto, foco total no texto
function renderMinimalText(slide: Slide, _imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 55)
  const corpo  = trunc(slide.corpo, 120)
  const fs = titulo.length > 38 ? 64 : titulo.length > 24 ? 80 : 96
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:BG, display:'flex', flexDirection:'column', justifyContent:'center', paddingLeft:EDGE, paddingRight:EDGE }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(8,8,15,0) 55%)', display:'flex' }} />
      <div style={{ position:'absolute', left:EDGE, top:EDGE, display:'flex', alignItems:'center', gap:10 }}>
        <GradBar w={40} h={3} />
        <span style={{ fontSize:13, color:TEXT_MUTED, fontWeight:600, letterSpacing:2 }}>{trunc(slide.eyebrow||'insight', 38).toUpperCase()}</span>
      </div>
      {titulo && <div style={{ fontSize:fs, fontWeight:900, color:TEXT, lineHeight:1.05, letterSpacing:-2, marginBottom:32 }}>{titulo}</div>}
      {corpo && <div style={{ fontSize:26, fontWeight:400, color:TEXT_DIM, lineHeight:1.55, maxWidth:880 }}>{corpo}</div>}
      <div style={{ position:'absolute', bottom:EDGE, left:EDGE, right:EDGE, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}><IaraStar size={14} /><span style={{ fontSize:12, color:TEXT_FAINT, fontWeight:600 }}>iarahub.com.br</span></div>
        <Dots total={total} active={slide.ordem-1} />
      </div>
    </div>
  )
}

// ─── Archetype 19: gradient_text ─────────────────────────────────────────────
// Texto com background em gradiente vibrante — para slides de destaque ou capas impactantes
function renderGradientText(slide: Slide, _imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 48)
  const corpo  = trunc(slide.corpo, 100)
  const fs = titulo.length > 32 ? 72 : titulo.length > 20 ? 90 : 110
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:'linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4c1d95 65%, #2d1654 100%)', display:'flex', flexDirection:'column', justifyContent:'center', paddingLeft:EDGE, paddingRight:EDGE }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:'radial-gradient(circle at 80% 20%, rgba(139,92,246,0.25) 0%, transparent 60%)', display:'flex' }} />
      <span style={{ fontSize:13, color:'rgba(196,181,253,0.7)', fontWeight:700, letterSpacing:3, marginBottom:28 }}>{trunc(slide.eyebrow||'insight', 40).toUpperCase()}</span>
      {titulo && <div style={{ fontSize:fs, fontWeight:900, color:'#f5f3ff', lineHeight:1.0, letterSpacing:-2, marginBottom:32 }}>{titulo}</div>}
      <div style={{ width:80, height:4, backgroundImage:GRAD_H, borderRadius:2, marginBottom:28, display:'flex' }} />
      {corpo && <div style={{ fontSize:26, fontWeight:400, color:'rgba(221,214,254,0.85)', lineHeight:1.5, maxWidth:860 }}>{corpo}</div>}
      <div style={{ position:'absolute', bottom:EDGE, right:EDGE, display:'flex' }}><Dots total={total} active={slide.ordem-1} /></div>
    </div>
  )
}

// ─── Archetype 20: photo_top_full ────────────────────────────────────────────
// Foto preenche topo (75%), texto mínimo e limpo na base — para fotos de destaque total
function renderPhotoTopFull(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 42)
  const corpo  = trunc(slide.corpo, 70)
  const fs = titulo.length > 28 ? 52 : titulo.length > 18 ? 64 : 78
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, display:'flex', flexDirection:'column', backgroundColor:BG }}>
      <div style={{ flex:1, position:'relative', display:'flex', overflow:'hidden' }}>
        {imgSrc ? <Photo src={imgSrc} foco={slide.foto_foco} /> : <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:GRAD_D, display:'flex' }} />}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:60, backgroundImage:`linear-gradient(0deg, ${BG} 0%, rgba(8,8,15,0) 100%)`, display:'flex' }} />
        <div style={{ position:'absolute', top:28, right:32, paddingTop:8, paddingBottom:8, paddingLeft:16, paddingRight:16, backgroundColor:'rgba(0,0,0,0.40)', borderRadius:999, display:'flex', alignItems:'center', gap:8 }}>
          <IaraStar size={12} />
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.85)', fontWeight:600 }}>{String(slide.ordem).padStart(2,'0')}/{String(total).padStart(2,'0')}</span>
        </div>
      </div>
      <div style={{ height:270, backgroundColor:BG, display:'flex', flexDirection:'column', justifyContent:'space-between', paddingTop:24, paddingBottom:36, paddingLeft:EDGE, paddingRight:EDGE, flexShrink:0 }}>
        {titulo && <div style={{ fontSize:fs, fontWeight:800, color:TEXT, lineHeight:1.05, letterSpacing:-1.5 }}>{titulo}</div>}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {corpo && <div style={{ fontSize:19, color:TEXT_DIM, fontWeight:400, flex:1, marginRight:24 }}>{corpo}</div>}
          <Dots total={total} active={slide.ordem-1} />
        </div>
      </div>
    </div>
  )
}

// ─── Archetype 21: list_card ─────────────────────────────────────────────────
// Card com lista numerada — para slides de "N razões / N erros / N dicas"
function renderListCard(slide: Slide, _imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 45)
  const itens  = (slide.corpo || '').split(/\n|•|·|–|-/).map(s => s.trim()).filter(Boolean).slice(0, 4)
  const corpo  = itens.length ? null : trunc(slide.corpo, 120)
  const fs = titulo.length > 30 ? 58 : titulo.length > 20 ? 72 : 86
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:CARD, display:'flex', flexDirection:'column', justifyContent:'space-between', paddingTop:EDGE, paddingBottom:EDGE, paddingLeft:EDGE, paddingRight:EDGE }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(8,8,15,0) 60%)', display:'flex' }} />
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {slide.eyebrow && <span style={{ fontSize:12, color:VIOLET, fontWeight:700, letterSpacing:2 }}>{trunc(slide.eyebrow,40).toUpperCase()}</span>}
        {titulo && <div style={{ fontSize:fs, fontWeight:800, color:TEXT, lineHeight:1.05, letterSpacing:-1.5 }}>{titulo}</div>}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
        {itens.length > 0 ? itens.map((item, i) => (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:20 }}>
            <div style={{ width:40, height:40, borderRadius:10, backgroundImage:GRAD_D, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:18, fontWeight:800, color:'#fff' }}>{i+1}</span>
            </div>
            <span style={{ fontSize:24, fontWeight:400, color:TEXT_DIM, lineHeight:1.4, paddingTop:8 }}>{item}</span>
          </div>
        )) : corpo && <div style={{ fontSize:26, fontWeight:400, color:TEXT_DIM, lineHeight:1.5 }}>{corpo}</div>}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <GradBar w={48} h={3} />
        <Dots total={total} active={slide.ordem-1} />
      </div>
    </div>
  )
}

// ─── Archetype 22: dark_split ────────────────────────────────────────────────
// Split 50/50 com fundo escuro ambos os lados — lado esquerdo foto com scrim, lado direito texto
function renderDarkSplit(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 42)
  const corpo  = trunc(slide.corpo, 100)
  const fs = titulo.length > 28 ? 52 : titulo.length > 18 ? 64 : 78
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, display:'flex', backgroundColor:BG }}>
      <div style={{ width:540, position:'relative', display:'flex', overflow:'hidden', flexShrink:0 }}>
        {imgSrc ? <Photo src={imgSrc} foco={slide.foto_foco} /> : <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:GRAD_D, display:'flex' }} />}
        <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:'linear-gradient(90deg, rgba(8,8,15,0) 50%, rgba(8,8,15,0.85) 100%)', display:'flex' }} />
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, backgroundImage:GRAD_H, display:'flex' }} />
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', paddingLeft:44, paddingRight:EDGE, gap:28 }}>
        {slide.eyebrow && <span style={{ fontSize:13, color:TEXT_MUTED, fontWeight:600, letterSpacing:1.5 }}>{trunc(slide.eyebrow,35).toUpperCase()}</span>}
        {titulo && <div style={{ fontSize:fs, fontWeight:800, color:TEXT, lineHeight:1.05, letterSpacing:-1.5 }}>{titulo}</div>}
        {corpo && <div style={{ fontSize:22, fontWeight:400, color:TEXT_DIM, lineHeight:1.5 }}>{corpo}</div>}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}><IaraStar size={14} /><Dots total={total} active={slide.ordem-1} /></div>
      </div>
    </div>
  )
}

// ─── Archetype 23: highlight_box ─────────────────────────────────────────────
// Caixa de destaque com borda colorida — para estatísticas, números e fatos impactantes
function renderHighlightBox(slide: Slide, _imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 40)
  const corpo  = trunc(slide.corpo, 100)
  const numero = titulo.match(/^\d[\d.,k%+\s]*/) ? titulo : null
  const resto  = numero ? titulo.slice(numero[0].length).trim() : titulo
  const fsNum  = 180
  const fsRest = resto.length > 20 ? 42 : resto.length > 12 ? 54 : 66
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:BG, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 65%)', display:'flex' }} />
      <div style={{ position:'absolute', top:EDGE, left:EDGE, display:'flex', alignItems:'center', gap:10 }}>
        <GradBar w={36} h={3} />
        <span style={{ fontSize:12, color:TEXT_MUTED, fontWeight:600, letterSpacing:2 }}>{trunc(slide.eyebrow||'dado', 40).toUpperCase()}</span>
      </div>
      <div style={{ width:880, paddingTop:72, paddingBottom:72, paddingLeft:72, paddingRight:72, border:'1px solid rgba(99,102,241,0.30)', borderRadius:24, display:'flex', flexDirection:'column', alignItems:'center', gap:20, backgroundColor:'rgba(19,19,31,0.60)' }}>
        {numero && <div style={{ fontSize:fsNum, fontWeight:900, color:VIOLET, lineHeight:0.9, letterSpacing:-6 }}>{numero[0].trim()}</div>}
        {resto && <div style={{ fontSize:fsRest, fontWeight:700, color:TEXT, lineHeight:1.05, letterSpacing:-1.5, textAlign:'center' }}>{resto}</div>}
        <div style={{ width:64, height:3, backgroundImage:GRAD_H, borderRadius:2, display:'flex' }} />
        {corpo && <div style={{ fontSize:24, fontWeight:400, color:TEXT_DIM, lineHeight:1.5, textAlign:'center', maxWidth:680 }}>{corpo}</div>}
      </div>
      <div style={{ position:'absolute', bottom:EDGE, right:EDGE, display:'flex' }}><Dots total={total} active={slide.ordem-1} /></div>
    </div>
  )
}

// ─── Archetype 24: magazine_full ─────────────────────────────────────────────
// Foto full-bleed com painel de texto flutuante no centro — estética de revista de luxo
function renderMagazineFull(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 44)
  const corpo  = trunc(slide.corpo, 80)
  const fs = titulo.length > 28 ? 52 : titulo.length > 18 ? 64 : 78
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, display:'flex', backgroundColor:BG }}>
      {imgSrc ? <Photo src={imgSrc} foco={slide.foto_foco} /> : <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:GRAD_D, display:'flex' }} />}
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)', display:'flex' }} />
      <div style={{ position:'absolute', left:EDGE, right:EDGE, bottom:100, backgroundColor:'rgba(8,8,15,0.72)', borderRadius:20, paddingTop:40, paddingBottom:40, paddingLeft:52, paddingRight:52, border:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', gap:16 }}>
        {slide.eyebrow && <span style={{ fontSize:12, color:VIOLET, fontWeight:700, letterSpacing:2 }}>{trunc(slide.eyebrow,40).toUpperCase()}</span>}
        {titulo && <div style={{ fontSize:fs, fontWeight:800, color:TEXT, lineHeight:1.05, letterSpacing:-1.5 }}>{titulo}</div>}
        {corpo && <div style={{ fontSize:20, fontWeight:400, color:TEXT_DIM, lineHeight:1.4 }}>{corpo}</div>}
      </div>
      <div style={{ position:'absolute', top:EDGE, left:EDGE, display:'flex', alignItems:'center', gap:10 }}>
        <IaraStar size={20} />
        <span style={{ fontSize:15, color:'rgba(255,255,255,0.80)', fontWeight:600 }}>{String(slide.ordem).padStart(2,'0')}/{String(total).padStart(2,'0')}</span>
      </div>
      <div style={{ position:'absolute', bottom:EDGE-16, right:EDGE+52, display:'flex' }}><Dots total={total} active={slide.ordem-1} /></div>
    </div>
  )
}

// ─── Archetype 25: story_arc ─────────────────────────────────────────────────
// Layout de storytelling — número grande decorativo, foto à direita, texto à esquerda
function renderStoryArc(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 40)
  const corpo  = trunc(slide.corpo, 90)
  const fs = titulo.length > 26 ? 56 : titulo.length > 16 ? 70 : 84
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, display:'flex', backgroundColor:BG }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(8,8,15,0) 55%)', display:'flex' }} />
      <div style={{ position:'absolute', left:EDGE-20, top:60, fontSize:420, fontWeight:900, color:'rgba(99,102,241,0.06)', lineHeight:1, letterSpacing:-20 }}>{String(slide.ordem).padStart(2,'0')}</div>
      <div style={{ width:500, display:'flex', flexDirection:'column', justifyContent:'center', paddingLeft:EDGE, paddingRight:40, gap:28, zIndex:1 }}>
        <div style={{ width:5, height:72, backgroundImage:GRAD_H, borderRadius:3, display:'flex' }} />
        {slide.eyebrow && <span style={{ fontSize:13, color:TEXT_MUTED, fontWeight:600, letterSpacing:1.5 }}>{trunc(slide.eyebrow,35)}</span>}
        {titulo && <div style={{ fontSize:fs, fontWeight:800, color:TEXT, lineHeight:1.05, letterSpacing:-1.5 }}>{titulo}</div>}
        {corpo && <div style={{ fontSize:22, fontWeight:400, color:TEXT_DIM, lineHeight:1.5 }}>{corpo}</div>}
        <Dots total={total} active={slide.ordem-1} />
      </div>
      <div style={{ flex:1, position:'relative', display:'flex', overflow:'hidden' }}>
        {imgSrc ? <Photo src={imgSrc} foco={slide.foto_foco} /> : <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:'linear-gradient(135deg, #1a1a2e 0%, rgba(99,102,241,0.35) 100%)', display:'flex' }} />}
        <div style={{ position:'absolute', top:0, left:0, width:80, bottom:0, backgroundImage:`linear-gradient(90deg, ${BG} 0%, rgba(8,8,15,0) 100%)`, display:'flex' }} />
        <div style={{ position:'absolute', top:0, left:0, right:0, height:4, backgroundImage:GRAD_H, display:'flex' }} />
      </div>
    </div>
  )
}

// ─── Archetype 26: dark_card_center ──────────────────────────────────────────
// Card centralizado com moldura — estética premium, ideal para citações e dicas isoladas
function renderDarkCardCenter(slide: Slide, _imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 52)
  const corpo  = trunc(slide.corpo, 110)
  const fs = titulo.length > 34 ? 56 : titulo.length > 22 ? 70 : 86
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#050510', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 60%)', display:'flex' }} />
      <div style={{ position:'absolute', top:EDGE, left:EDGE, right:EDGE, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}><IaraStar size={18} /><span style={{ fontSize:14, color:TEXT_MUTED, fontWeight:600, letterSpacing:1 }}>{trunc(slide.eyebrow||'IARA HUB',35).toUpperCase()}</span></div>
        <span style={{ fontSize:13, color:TEXT_FAINT, fontWeight:700 }}>{String(slide.ordem).padStart(2,'0')} / {String(total).padStart(2,'0')}</span>
      </div>
      <div style={{ width:924, paddingTop:64, paddingBottom:64, paddingLeft:72, paddingRight:72, border:'1px solid rgba(255,255,255,0.07)', borderRadius:28, backgroundColor:'rgba(19,19,31,0.50)', display:'flex', flexDirection:'column', gap:32 }}>
        <div style={{ width:56, height:4, backgroundImage:GRAD_H, borderRadius:2, display:'flex' }} />
        {titulo && <div style={{ fontSize:fs, fontWeight:800, color:TEXT, lineHeight:1.05, letterSpacing:-1.5 }}>{titulo}</div>}
        {corpo && <div style={{ fontSize:26, fontWeight:400, color:TEXT_DIM, lineHeight:1.55 }}>{corpo}</div>}
      </div>
      <div style={{ position:'absolute', bottom:EDGE, right:EDGE, display:'flex' }}><Dots total={total} active={slide.ordem-1} /></div>
    </div>
  )
}

// ─── Archetype 27: photo_frame ───────────────────────────────────────────────
// Foto com moldura branca estilo polaroid — para conteúdo pessoal e nostálgico
function renderPhotoFrame(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 40)
  const corpo  = trunc(slide.corpo, 80)
  const FRAME  = 32
  const CAP    = 90
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#f0ede8' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:'radial-gradient(circle at 30% 70%, rgba(200,190,180,0.5) 0%, transparent 60%)', display:'flex' }} />
      <div style={{ width:860, height:970, backgroundColor:'#ffffff', borderRadius:4, boxShadow:'0 8px 60px rgba(0,0,0,0.18)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ flex:1, position:'relative', margin:FRAME, marginBottom:0, display:'flex', overflow:'hidden' }}>
          {imgSrc ? <Photo src={imgSrc} foco={slide.foto_foco} /> : <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:'linear-gradient(135deg, #e8e0d8 0%, #d0c8c0 100%)', display:'flex' }} />}
        </div>
        <div style={{ height:CAP+FRAME, paddingLeft:FRAME+12, paddingRight:FRAME+12, paddingTop:20, paddingBottom:16, display:'flex', flexDirection:'column', gap:6, backgroundColor:'#ffffff' }}>
          {titulo && <div style={{ fontSize:22, fontWeight:700, color:'#1a1a1a', lineHeight:1.2, letterSpacing:-0.5 }}>{titulo}</div>}
          {corpo && <div style={{ fontSize:16, fontWeight:400, color:'#666660', lineHeight:1.4 }}>{corpo}</div>}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}><IaraStar size={12} /><span style={{ fontSize:11, color:'#aaaaaa', fontWeight:600 }}>IARA HUB</span></div>
            <Dots total={total} active={slide.ordem-1} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Archetype 28: color_block ───────────────────────────────────────────────
// Bloco de cor sólido vibrante — sem foto, puramente tipográfico com cor de destaque
function renderColorBlock(slide: Slide, _imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 45)
  const corpo  = trunc(slide.corpo, 100)
  const fs = titulo.length > 30 ? 68 : titulo.length > 18 ? 84 : 104
  const COLORS = ['#6366f1','#7c3aed','#a855f7','#ec4899','#0891b2','#059669']
  const accent = COLORS[(slide.ordem - 1) % COLORS.length]
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, display:'flex', flexDirection:'column', backgroundColor:BG }}>
      <div style={{ height:6, backgroundImage:GRAD_H, display:'flex' }} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', paddingLeft:EDGE, paddingRight:EDGE, gap:32 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:14, backgroundColor:accent, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:24, fontWeight:900, color:'#fff' }}>{String(slide.ordem).padStart(2,'0')}</span>
          </div>
          {slide.eyebrow && <span style={{ fontSize:14, color:TEXT_MUTED, fontWeight:600, letterSpacing:1.5 }}>{trunc(slide.eyebrow,40).toUpperCase()}</span>}
        </div>
        {titulo && <div style={{ fontSize:fs, fontWeight:800, color:TEXT, lineHeight:1.05, letterSpacing:-2 }}>{titulo}</div>}
        <div style={{ width:100, height:4, backgroundColor:accent, borderRadius:2, display:'flex' }} />
        {corpo && <div style={{ fontSize:26, fontWeight:400, color:TEXT_DIM, lineHeight:1.5, maxWidth:860 }}>{corpo}</div>}
      </div>
      <div style={{ height:72, paddingLeft:EDGE, paddingRight:EDGE, display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}><IaraStar size={14} /><span style={{ fontSize:12, color:TEXT_FAINT }}>iarahub.com.br</span></div>
        <Dots total={total} active={slide.ordem-1} />
      </div>
    </div>
  )
}

// ─── Archetype 29: duo_panel ─────────────────────────────────────────────────
// Dois painéis lado a lado com foto no painel direito e texto no esquerdo — mais espaçoso
function renderDuoPanel(slide: Slide, imgSrc: string | undefined, total: number) {
  const titulo = trunc(slide.titulo, 38)
  const corpo  = trunc(slide.corpo, 90)
  const fs = titulo.length > 25 ? 58 : titulo.length > 16 ? 72 : 88
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, display:'flex', backgroundColor:CARD }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between', paddingTop:EDGE, paddingBottom:EDGE, paddingLeft:EDGE, paddingRight:48 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}><GradBar w={32} h={3} />{slide.eyebrow && <span style={{ fontSize:12, color:TEXT_MUTED, fontWeight:600, letterSpacing:2 }}>{trunc(slide.eyebrow,35).toUpperCase()}</span>}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          {titulo && <div style={{ fontSize:fs, fontWeight:800, color:TEXT, lineHeight:1.05, letterSpacing:-1.5 }}>{titulo}</div>}
          {corpo && <div style={{ fontSize:22, fontWeight:400, color:TEXT_DIM, lineHeight:1.5 }}>{corpo}</div>}
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}><IaraStar size={16} /><Dots total={total} active={slide.ordem-1} /></div>
      </div>
      <div style={{ width:480, position:'relative', display:'flex', overflow:'hidden', flexShrink:0 }}>
        {imgSrc ? <Photo src={imgSrc} foco={slide.foto_foco} /> : <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:GRAD_D, display:'flex' }} />}
        <div style={{ position:'absolute', top:0, right:0, bottom:0, width:4, backgroundImage:GRAD_H, display:'flex' }} />
        <div style={{ position:'absolute', top:0, left:0, width:60, bottom:0, backgroundImage:`linear-gradient(90deg, ${CARD} 0%, rgba(19,19,31,0) 100%)`, display:'flex' }} />
      </div>
    </div>
  )
}

// ─── Archetype 30: step_card ─────────────────────────────────────────────────
// Card de passo a passo — número grande, seta decorativa, passo claro e corpo de apoio
function renderStepCard(slide: Slide, _imgSrc: string | undefined, total: number) {
  const passo  = trunc(slide.titulo, 50)
  const corpo  = trunc(slide.corpo, 110)
  const num    = slide.ordem - 1 // passo atual (slide 2 = passo 1, etc.)
  const fs = passo.length > 32 ? 56 : passo.length > 20 ? 68 : 82
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:BG, display:'flex', flexDirection:'column', justifyContent:'center', paddingLeft:EDGE, paddingRight:EDGE }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(8,8,15,0) 50%)', display:'flex' }} />
      <div style={{ position:'absolute', right:EDGE-20, top:60, fontSize:360, fontWeight:900, color:'rgba(99,102,241,0.07)', lineHeight:1, letterSpacing:-15 }}>{String(num).padStart(2,'0')}</div>
      <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:44 }}>
        <div style={{ width:64, height:64, borderRadius:18, backgroundImage:GRAD_D, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ fontSize:28, fontWeight:900, color:'#fff' }}>{num}</span>
        </div>
        {slide.eyebrow && <span style={{ fontSize:14, color:VIOLET, fontWeight:600, letterSpacing:1.5 }}>{trunc(slide.eyebrow,40).toUpperCase()}</span>}
      </div>
      {passo && <div style={{ fontSize:fs, fontWeight:800, color:TEXT, lineHeight:1.05, letterSpacing:-1.5, marginBottom:32 }}>{passo}</div>}
      {corpo && <div style={{ fontSize:26, fontWeight:400, color:TEXT_DIM, lineHeight:1.5, maxWidth:880 }}>{corpo}</div>}
      <div style={{ position:'absolute', bottom:EDGE, right:EDGE, display:'flex' }}><Dots total={total} active={slide.ordem-1} /></div>
    </div>
  )
}

// ─── Resolver ─────────────────────────────────────────────────────────────────
// Ciclo para slides COM foto — arquétipos que exibem a foto sem overlay pesado
const CYCLE_PHOTO = ['split_v','editorial','caption_bar','side_right','cinematic','duo_panel','photo_top_full','story_arc','photo_frame','inset_photo','dark_split','magazine_full'] as const
// Ciclo para slides SEM foto — arquétipos tipográficos
const CYCLE_NOIMG = ['top_text','bold_type','list_card','highlight_box','dark_card_center','color_block','step_card','minimal_text','gradient_text','neon_card','quote','dark_card_center'] as const

// Arquétipos que sobrepõem texto no centro/base da foto (risco de cobrir rosto)
const ARCHS_RISCO_ROSTO = new Set(['cover_full', 'full_bleed', 'brand_cover'])

function resolveArq(slide: Slide, hasBg: boolean, modo: string): string {
  let arq = slide.arquetipo
  if (!arq) {
    if (slide.tipo === 'capa') arq = modo === 'marca' ? 'brand_cover' : 'cover_full'
    else if (slide.tipo === 'encerramento') arq = modo === 'marca' ? 'brand_promo' : 'closing'
    else {
      const idx = (slide.ordem - 2) % (hasBg ? CYCLE_PHOTO.length : CYCLE_NOIMG.length)
      arq = (hasBg ? CYCLE_PHOTO : CYCLE_NOIMG)[idx]
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
      case 'cover_full':   content = renderCoverFull(slide, imgSrc, total); break
      case 'split_v':      content = renderSplitV(slide, imgSrc, total); break
      case 'top_text':     content = renderTopText(slide, imgSrc, total); break
      case 'full_bleed':   content = renderFullBleed(slide, imgSrc, total); break
      case 'quote':        content = renderQuote(slide, imgSrc, total); break
      case 'closing':      content = renderClosing(slide, total, imgSrc); break
      case 'brand_cover':  content = renderBrandCover(slide, imgSrc, total); break
      case 'brand_story':  content = renderBrandStory(slide, imgSrc, total); break
      case 'brand_promo':  content = renderBrandPromo(slide, imgSrc, total); break
      case 'editorial':    content = renderEditorial(slide, imgSrc, total); break
      case 'cinematic':    content = renderCinematic(slide, imgSrc, total); break
      case 'caption_bar':  content = renderCaptionBar(slide, imgSrc, total); break
      case 'inset_photo':  content = renderInsetPhoto(slide, imgSrc, total); break
      case 'warm_overlay': content = renderWarmOverlay(slide, imgSrc, total); break
      case 'bold_type':    content = renderBoldType(slide, imgSrc, total); break
      case 'side_right':   content = renderSideRight(slide, imgSrc, total); break
      case 'neon_card':       content = renderNeonCard(slide, imgSrc, total); break
      case 'minimal_text':    content = renderMinimalText(slide, imgSrc, total); break
      case 'gradient_text':   content = renderGradientText(slide, imgSrc, total); break
      case 'photo_top_full':  content = renderPhotoTopFull(slide, imgSrc, total); break
      case 'list_card':       content = renderListCard(slide, imgSrc, total); break
      case 'dark_split':      content = renderDarkSplit(slide, imgSrc, total); break
      case 'highlight_box':   content = renderHighlightBox(slide, imgSrc, total); break
      case 'magazine_full':   content = renderMagazineFull(slide, imgSrc, total); break
      case 'story_arc':       content = renderStoryArc(slide, imgSrc, total); break
      case 'dark_card_center':content = renderDarkCardCenter(slide, imgSrc, total); break
      case 'photo_frame':     content = renderPhotoFrame(slide, imgSrc, total); break
      case 'color_block':     content = renderColorBlock(slide, imgSrc, total); break
      case 'duo_panel':       content = renderDuoPanel(slide, imgSrc, total); break
      case 'step_card':       content = renderStepCard(slide, imgSrc, total); break
      default:                content = renderFallback(slide, total)
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
