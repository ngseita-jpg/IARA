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
const BG   = '#08080f'
const CARD = '#13131f'
const GRAD_H = 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)'
const GRAD_D = 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)'
const VIOLET = '#a855f7'
const TEXT  = '#ffffff'
const TEXT_DIM   = 'rgba(255,255,255,0.72)'
const TEXT_MUTED = 'rgba(255,255,255,0.52)'
const TEXT_FAINT = 'rgba(255,255,255,0.28)'
const BORDER     = 'rgba(255,255,255,0.08)'
const EDGE = 72

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
function trunc(s: string, max: number) { return s.length > max ? s.slice(0, max) + '…' : s }

// ─── Shared UI pieces ─────────────────────────────────────────────────────────

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

function SlideIndicator({ total, active, style = {} }: { total: number; active: number; style?: React.CSSProperties }) {
  const count = clamp(total, 1, 10)
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', ...style }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width:  i === active ? 24 : 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: i === active ? VIOLET : 'rgba(255,255,255,0.28)',
        }} />
      ))}
    </div>
  )
}

function AccentLine({ w = 64, h = 4 }: { w?: number; h?: number }) {
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
      padding: '7px 14px 7px 10px',
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 999,
      border: '1px solid rgba(255,255,255,0.09)',
      opacity: 0.65,
    }}>
      <IaraStar size={16} />
      <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: -0.2 }}>Iara Hub</span>
    </div>
  )
}

// Image: full absolute cover
function CoverImg({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
  )
}

// ─── Archetype 1: cover_full ──────────────────────────────────────────────────
// Foto cheia + scrim topo/base + título dominante em baixo
function renderCoverFull(slide: Slide, imgSrc: string | undefined, total: number) {
  const hasImg = !!imgSrc
  const titleLen = (slide.titulo || slide.corpo).length
  const titleSize = titleLen > 55 ? 80 : titleLen > 35 ? 100 : 124
  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: BG, display: 'flex' }}>
      {hasImg
        ? <CoverImg src={imgSrc!} />
        : <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAD_D, opacity: 0.30, display: 'flex' }} />
      }

      {/* Scrim duplo — topo + base */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.80) 100%)',
      }} />

      {/* Eyebrow topo */}
      <div style={{ position: 'absolute', top: EDGE, left: EDGE, display: 'flex', alignItems: 'center', gap: 14 }}>
        <IaraStar size={26} />
        <span style={{ fontSize: 18, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.90)', fontWeight: 600 }}>
          {slide.eyebrow || 'novo post'}
        </span>
      </div>

      {/* Título dominante */}
      <div style={{ position: 'absolute', left: EDGE, right: EDGE, bottom: 116 }}>
        <h1 style={{
          fontWeight: 800, fontSize: titleSize,
          lineHeight: 1.0, letterSpacing: -2,
          margin: 0, color: TEXT,
        }}>
          {(slide.titulo || slide.corpo).slice(0, 80)}
        </h1>
      </div>

      {/* Meta + indicador */}
      <div style={{ position: 'absolute', left: EDGE, right: EDGE, bottom: EDGE, display: 'flex', alignItems: 'center', gap: 24 }}>
        <AccentLine />
        {slide.handle && (
          <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{slide.handle}</span>
        )}
        <div style={{ flex: 1, display: 'flex' }} />
        <SlideIndicator total={total} active={slide.ordem - 1} />
      </div>
    </div>
  )
}

// ─── Archetype 2: split_v ─────────────────────────────────────────────────────
// 40% texto (fundo escuro) / 60% foto — editorial
function renderSplitV(slide: Slide, imgSrc: string | undefined, total: number) {
  const hasImg = !!imgSrc
  const titleSize = (slide.titulo || '').length > 35 ? 50 : 68
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', backgroundColor: BG }}>

      {/* Esquerda — texto 40% */}
      <div style={{
        width: 432,
        padding: `${EDGE}px 48px`,
        backgroundColor: BG,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        borderRight: `1px solid ${BORDER}`,
      }}>
        <span style={{ fontSize: 17, letterSpacing: 2.5, textTransform: 'uppercase', color: TEXT_MUTED, fontWeight: 600 }}>
          {slide.eyebrow || `${String(Math.max(1, slide.ordem - 1)).padStart(2, '0')} / ${String(Math.max(1, total - 2)).padStart(2, '0')}`}
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {slide.titulo && (
            <h2 style={{ fontWeight: 800, fontSize: titleSize, lineHeight: 0.96, letterSpacing: -2, margin: 0, color: TEXT }}>
              {slide.titulo}
            </h2>
          )}
          <p style={{ fontWeight: 400, fontSize: 26, lineHeight: 1.45, color: TEXT_DIM, margin: 0 }}>
            {trunc(slide.corpo, 120)}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IaraStar size={14} />
          <span style={{ fontSize: 14, color: TEXT_FAINT, letterSpacing: 0.5 }}>iarahub.com.br</span>
        </div>
      </div>

      {/* Direita — foto 60% */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        {hasImg
          ? <CoverImg src={imgSrc!} />
          : <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(135deg, ${CARD} 0%, rgba(99,102,241,0.25) 100%)`, display: 'flex' }} />
        }
        {/* Barra gradiente lateral esquerda */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 3, bottom: 0, backgroundImage: 'linear-gradient(180deg, #6366f1, #a855f7, #ec4899)', display: 'flex' }} />
      </div>
    </div>
  )
}

// ─── Archetype 3: top_text ────────────────────────────────────────────────────
// Topo escuro com título dominante / base foto
function renderTopText(slide: Slide, imgSrc: string | undefined, total: number) {
  const hasImg = !!imgSrc
  const titleSize = (slide.titulo || '').length > 45 ? 76 : (slide.titulo || '').length > 30 ? 92 : 108
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', backgroundColor: BG }}>

      {/* Foto na metade inferior */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 510, bottom: 0, display: 'flex', overflow: 'hidden' }}>
        {hasImg
          ? <CoverImg src={imgSrc!} />
          : <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(180deg, ${CARD} 0%, rgba(168,85,247,0.35) 100%)`, display: 'flex' }} />
        }
        {/* Scrim de transição entre preto e foto */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, backgroundImage: `linear-gradient(180deg, ${BG} 0%, rgba(8,8,15,0) 100%)`, display: 'flex' }} />
      </div>

      {/* Número fantasma */}
      <span style={{
        position: 'absolute', top: 52, right: 48,
        fontSize: 200, fontWeight: 900, lineHeight: 0.8,
        color: 'rgba(255,255,255,0.05)', letterSpacing: -10,
      }}>
        {String(Math.max(1, slide.ordem - 1)).padStart(2, '0')}
      </span>

      {/* Eyebrow */}
      <span style={{
        position: 'absolute', top: EDGE + 20, left: EDGE,
        fontSize: 17, letterSpacing: 2.5, textTransform: 'uppercase', color: TEXT_MUTED, fontWeight: 600,
      }}>
        {slide.eyebrow || `dica #${Math.max(1, slide.ordem - 1)}`}
      </span>

      {/* Título */}
      {slide.titulo && (
        <h2 style={{
          position: 'absolute', left: EDGE, right: EDGE, top: 155,
          fontWeight: 800, fontSize: titleSize,
          lineHeight: 0.94, letterSpacing: -2, margin: 0, color: TEXT,
        }}>
          {slide.titulo}
        </h2>
      )}

      {/* Corpo */}
      <p style={{
        position: 'absolute', left: EDGE, right: 300, top: 430,
        fontWeight: 400, fontSize: 26, lineHeight: 1.4, color: TEXT_DIM, margin: 0,
      }}>
        {slide.corpo.length > 130 ? slide.corpo.slice(0, 130) + '...' : slide.corpo}
      </p>

      <SlideIndicator total={total} active={slide.ordem - 1} style={{ position: 'absolute', bottom: 50, left: EDGE }} />
    </div>
  )
}

// ─── Archetype 4: full_bleed ──────────────────────────────────────────────────
// Foto total + texto limpo num canto com scrim radial cirúrgico
function renderFullBleed(slide: Slide, imgSrc: string | undefined, total: number) {
  const hasImg = !!imgSrc
  const titleSize = (slide.titulo || '').length > 35 ? 56 : (slide.titulo || '').length > 25 ? 68 : 80
  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: BG, display: 'flex' }}>
      {hasImg
        ? <CoverImg src={imgSrc!} />
        : <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAD_D, display: 'flex' }} />
      }

      {/* Scrim radial — canto inferior direito onde fica o texto */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        backgroundImage: 'radial-gradient(ellipse at 82% 88%, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 52%)',
      }} />

      {/* Chip número — topo direito */}
      <div style={{
        position: 'absolute', top: EDGE, right: EDGE,
        padding: '10px 18px',
        backgroundColor: 'rgba(0,0,0,0.42)',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
      }}>
        <span style={{ fontSize: 17, letterSpacing: 1.5, color: 'rgba(255,255,255,0.92)', fontWeight: 700 }}>
          {String(slide.ordem).padStart(2, '0')}
        </span>
      </div>

      {/* Texto canto inferior direito */}
      <div style={{
        position: 'absolute', right: EDGE, bottom: 112,
        width: 560, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-end',
      }}>
        {slide.titulo && (
          <h2 style={{
            fontWeight: 800, fontSize: titleSize,
            lineHeight: 0.96, letterSpacing: -2, margin: 0,
            color: TEXT, textAlign: 'right',
          }}>
            {slide.titulo}
          </h2>
        )}
        <p style={{
          fontWeight: 400, fontSize: 26, lineHeight: 1.4,
          color: 'rgba(255,255,255,0.90)', margin: 0, textAlign: 'right',
        }}>
          {slide.corpo.length > 100 ? slide.corpo.slice(0, 100) + '...' : slide.corpo}
        </p>
      </div>

      <SlideIndicator total={total} active={slide.ordem - 1} style={{ position: 'absolute', bottom: EDGE, left: EDGE }} />
    </div>
  )
}

// ─── Archetype 5: quote ───────────────────────────────────────────────────────
// Foto com overlay escuro forte (simula blur), quote centralizado
function renderQuote(slide: Slide, imgSrc: string | undefined, total: number) {
  const hasImg = !!imgSrc
  const titleSize = (slide.titulo || '').length > 70 ? 48 : (slide.titulo || '').length > 50 ? 58 : 68
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
      {hasImg
        ? <CoverImg src={imgSrc!} />
        : <div style={{ position: 'absolute', inset: 0, backgroundColor: CARD, display: 'flex' }} />
      }

      {/* Overlay escuro forte — simula glassmorphism blur */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(8,8,15,0.72)', display: 'flex' }} />
      {/* Toque de violet no centro */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.14) 0%, transparent 55%)', display: 'flex' }} />

      {/* Eyebrow */}
      <span style={{
        position: 'absolute', top: 96, left: 0, right: 0,
        textAlign: 'center',
        fontSize: 17, letterSpacing: 3, textTransform: 'uppercase', color: TEXT_MUTED, fontWeight: 600,
      }}>
        {slide.eyebrow || `— fato #${Math.max(1, slide.ordem - 1)}`}
      </span>

      {/* Aspas decorativas */}
      <span style={{
        position: 'absolute', left: 72, top: 230,
        fontSize: 220, fontWeight: 300, lineHeight: 0.8,
        color: VIOLET, opacity: 0.45,
      }}>"</span>

      {/* Conteúdo central */}
      <div style={{
        position: 'absolute', left: 96, right: 96, top: 320,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36,
      }}>
        {slide.titulo && (
          <h2 style={{
            fontWeight: 700, fontSize: titleSize,
            lineHeight: 1.1, letterSpacing: -1.5, margin: 0,
            textAlign: 'center', color: TEXT,
          }}>
            {slide.titulo}
          </h2>
        )}
        <p style={{
          fontWeight: 400, fontSize: 26, lineHeight: 1.4,
          color: TEXT_DIM, margin: 0, textAlign: 'center',
        }}>
          {trunc(slide.corpo, 100)}
        </p>
      </div>

      {/* Indicador centralizado */}
      <div style={{ position: 'absolute', bottom: EDGE, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <SlideIndicator total={total} active={slide.ordem - 1} />
      </div>
    </div>
  )
}

// ─── Archetype 6: closing ─────────────────────────────────────────────────────
// Fundo escuro, CTA com gradiente, barra gradiente base
function renderClosing(slide: Slide, total: number) {
  const ctaText = slide.cta || 'Salve esse post.'
  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: BG, display: 'flex' }}>
      {/* Mesh gradiente de fundo sutil */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        backgroundImage: 'radial-gradient(circle at 90% 15%, rgba(99,102,241,0.14) 0%, transparent 40%), radial-gradient(circle at 10% 85%, rgba(168,85,247,0.10) 0%, transparent 40%)',
      }} />

      {/* Estrela + Iara Hub topo esquerdo */}
      <div style={{ position: 'absolute', top: EDGE, left: EDGE, display: 'flex', alignItems: 'center', gap: 14 }}>
        <IaraStar size={32} />
        <span style={{ fontSize: 26, fontWeight: 700, color: TEXT, letterSpacing: -0.3 }}>Iara Hub</span>
      </div>

      {/* Eyebrow */}
      <span style={{
        position: 'absolute', top: 220, left: EDGE,
        fontSize: 18, letterSpacing: 2.5, textTransform: 'uppercase', color: TEXT_MUTED, fontWeight: 600,
      }}>
        {slide.eyebrow || 'gostou?'}
      </span>

      {/* Título CTA */}
      <h2 style={{
        position: 'absolute', left: EDGE, right: EDGE, top: 290,
        fontWeight: 800,
        fontSize: ctaText.length > 25 ? 88 : 120,
        lineHeight: 1.0, letterSpacing: -2, margin: 0, color: TEXT,
      }}>
        {ctaText}
      </h2>

      {/* Linha accent */}
      <div style={{ position: 'absolute', left: EDGE, top: 560, width: 180, height: 6, backgroundImage: GRAD_H, borderRadius: 3, display: 'flex' }} />

      {/* Corpo */}
      <p style={{
        position: 'absolute', left: EDGE, right: EDGE, top: 600,
        fontWeight: 400, fontSize: 30, lineHeight: 1.4, color: TEXT_DIM, margin: 0,
      }}>
        {trunc(slide.corpo, 100)}
      </p>

      {/* Handle */}
      {slide.handle && (
        <div style={{
          position: 'absolute', left: EDGE, top: 760,
          display: 'flex', alignItems: 'center', gap: 28,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, color: TEXT_FAINT, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>siga</span>
            <span style={{ fontSize: 34, fontWeight: 700, color: TEXT, letterSpacing: -0.5 }}>{slide.handle}</span>
          </div>
          <div style={{ width: 1, height: 52, backgroundColor: BORDER, display: 'flex' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, color: TEXT_FAINT, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>compartilhe</span>
            <span style={{ fontSize: 28, fontWeight: 600, color: TEXT_MUTED }}>com quem precisa ler</span>
          </div>
        </div>
      )}

      <BottomBar />
      <SlideIndicator total={total} active={slide.ordem - 1} style={{ position: 'absolute', bottom: 40, left: EDGE }} />
    </div>
  )
}

// ─── Archetype 7: brand_cover ─────────────────────────────────────────────────
// Card escuro, produto em destaque, título bottom
function renderBrandCover(slide: Slide, imgSrc: string | undefined, total: number) {
  const hasImg = !!imgSrc
  const titleSize = (slide.titulo || '').length > 25 ? 88 : 116
  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: CARD, display: 'flex' }}>
      {/* Radial violet no centro (halo de produto) */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 50% 55%, rgba(168,85,247,0.20) 0%, transparent 45%)', display: 'flex' }} />

      {hasImg && <CoverImg src={imgSrc!} />}
      {hasImg && (
        /* Scrim topo + base para texto */
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          backgroundImage: 'linear-gradient(180deg, rgba(19,19,31,0.85) 0%, rgba(19,19,31,0) 30%, rgba(19,19,31,0) 55%, rgba(19,19,31,0.92) 100%)',
        }} />
      )}

      {/* Header marca */}
      <div style={{ position: 'absolute', top: EDGE, left: EDGE, right: EDGE, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <IaraStar size={28} />
          <span style={{ fontSize: 20, letterSpacing: 3, textTransform: 'uppercase', color: TEXT_MUTED, fontWeight: 600 }}>
            {slide.eyebrow || 'lançamento'}
          </span>
        </div>
        <span style={{ fontSize: 17, letterSpacing: 2, color: 'rgba(168,85,247,0.85)', textTransform: 'uppercase', fontWeight: 600 }}>
          novo
        </span>
      </div>

      {/* Título bottom */}
      <div style={{ position: 'absolute', left: EDGE, right: EDGE, bottom: 116 }}>
        <h1 style={{
          fontWeight: 800, fontSize: titleSize,
          lineHeight: 1.0, letterSpacing: -2, margin: 0, color: TEXT,
        }}>
          {trunc(slide.titulo || slide.corpo, 70)}
        </h1>
      </div>

      <div style={{ position: 'absolute', left: EDGE, right: EDGE, bottom: EDGE, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <AccentLine w={80} />
        <SlideIndicator total={total} active={slide.ordem - 1} />
      </div>
    </div>
  )
}

// ─── Archetype 8: brand_story ─────────────────────────────────────────────────
// Foto full bleed, scrim esquerdo, texto narrativo editorial
function renderBrandStory(slide: Slide, imgSrc: string | undefined, total: number) {
  const hasImg = !!imgSrc
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
      {hasImg
        ? <CoverImg src={imgSrc!} />
        : <div style={{ position: 'absolute', inset: 0, backgroundColor: CARD, backgroundImage: 'radial-gradient(ellipse at 60% 40%, rgba(99,102,241,0.20) 0%, transparent 55%)', display: 'flex' }} />
      }

      {/* Scrim esquerdo gradiente */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        backgroundImage: 'linear-gradient(90deg, rgba(8,8,15,0.90) 0%, rgba(8,8,15,0.72) 38%, rgba(8,8,15,0) 65%)',
      }} />

      {/* Eyebrow */}
      <div style={{ position: 'absolute', top: EDGE, left: EDGE, display: 'flex', alignItems: 'center', gap: 14 }}>
        <IaraStar size={20} />
        <span style={{ fontSize: 16, letterSpacing: 2.5, textTransform: 'uppercase', color: TEXT_MUTED, fontWeight: 600 }}>
          {slide.eyebrow || 'bastidores'}
        </span>
      </div>

      {/* Título curto */}
      {slide.titulo && (
        <h2 style={{
          position: 'absolute', left: EDGE, top: 220, width: 560,
          fontWeight: 700, fontSize: 56, lineHeight: 1, letterSpacing: -1.5, margin: 0, color: TEXT,
        }}>
          {slide.titulo}
        </h2>
      )}

      {/* Corpo narrativo */}
      <p style={{
        position: 'absolute', left: EDGE, top: 340, width: 540,
        fontWeight: 400, fontSize: 28, lineHeight: 1.55,
        color: 'rgba(255,255,255,0.88)', margin: 0,
      }}>
        {trunc(slide.corpo, 120)}
      </p>

      {/* Linha inferior */}
      <div style={{ position: 'absolute', bottom: EDGE, left: EDGE, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 1, backgroundColor: 'rgba(255,255,255,0.20)', display: 'flex' }} />
        {slide.handle && (
          <span style={{ fontSize: 16, color: TEXT_MUTED, letterSpacing: 0.5, fontWeight: 500 }}>{slide.handle}</span>
        )}
      </div>

      <SlideIndicator total={total} active={slide.ordem - 1} style={{ position: 'absolute', bottom: EDGE, right: EDGE }} />
    </div>
  )
}

// ─── Archetype 9: brand_promo ─────────────────────────────────────────────────
// Tipografia como arte — número/desconto gigante com gradiente
function renderBrandPromo(slide: Slide, _imgSrc: string | undefined, total: number) {
  const titleSize = (slide.titulo || '').length > 30 ? 56 : (slide.titulo || '').length > 20 ? 68 : 80
  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: BG, display: 'flex' }}>
      {/* Mesh gradiente */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(236,72,153,0.18) 0%, transparent 40%), radial-gradient(circle at 15% 80%, rgba(99,102,241,0.18) 0%, transparent 42%)',
      }} />

      {/* Eyebrow */}
      <div style={{ position: 'absolute', top: EDGE, left: EDGE, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 32, height: 2, backgroundImage: GRAD_H, borderRadius: 1, display: 'flex' }} />
        <span style={{ fontSize: 17, letterSpacing: 2.5, textTransform: 'uppercase', color: TEXT_MUTED, fontWeight: 600 }}>
          {slide.eyebrow || 'oferta especial'}
        </span>
      </div>

      {/* Título grande */}
      <h2 style={{
        position: 'absolute', left: EDGE, right: EDGE, top: 200,
        fontWeight: 800, fontSize: titleSize,
        lineHeight: 1.0, letterSpacing: -2, margin: 0, color: TEXT,
      }}>
        {slide.titulo}
      </h2>

      {/* Gradient accent line */}
      <div style={{ position: 'absolute', left: EDGE, top: 440, width: 120, height: 6, backgroundImage: GRAD_H, borderRadius: 3, display: 'flex' }} />

      {/* Corpo */}
      <p style={{
        position: 'absolute', left: EDGE, right: EDGE, top: 490,
        fontWeight: 400, fontSize: 30, lineHeight: 1.4, color: TEXT_DIM, margin: 0,
      }}>
        {trunc(slide.corpo, 100)}
      </p>

      {/* CTA pill */}
      {slide.cta && (
        <div style={{
          position: 'absolute', left: EDGE, top: 700,
          padding: '18px 44px',
          backgroundImage: GRAD_H,
          borderRadius: 999,
          display: 'flex',
        }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: TEXT }}>{slide.cta}</span>
        </div>
      )}

      <SlideIndicator total={total} active={slide.ordem - 1} style={{ position: 'absolute', bottom: EDGE, left: EDGE }} />
      <BottomBar />
    </div>
  )
}

// ─── Fallback slide (usado se arquétipo crashar) ──────────────────────────────
function renderFallback(slide: Slide, total: number) {
  const title = (slide.titulo || slide.corpo).slice(0, 80)
  const body = slide.titulo ? slide.corpo.slice(0, 160) : ''
  const titleSize = title.length > 45 ? 72 : title.length > 30 ? 88 : 108
  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: BG, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${EDGE}px` }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAD_D, opacity: 0.12, display: 'flex' }} />
      <span style={{ fontSize: 17, letterSpacing: 2.5, textTransform: 'uppercase', color: TEXT_MUTED, fontWeight: 600, marginBottom: 32, display: 'flex' }}>
        {slide.eyebrow || `${String(slide.ordem).padStart(2, '0')} / ${String(total).padStart(2, '0')}`}
      </span>
      <h2 style={{ fontWeight: 800, fontSize: titleSize, lineHeight: 1.0, letterSpacing: -2, margin: '0 0 36px', color: TEXT, display: 'flex' }}>
        {title}
      </h2>
      {body && (
        <p style={{ fontWeight: 400, fontSize: 30, lineHeight: 1.45, color: TEXT_DIM, margin: 0, display: 'flex' }}>
          {body}
        </p>
      )}
      <SlideIndicator total={total} active={slide.ordem - 1} style={{ position: 'absolute', bottom: EDGE, left: EDGE }} />
      <BottomBar />
    </div>
  )
}

// ─── Archetype resolver ───────────────────────────────────────────────────────
const CONTENT_CYCLE = ['split_v', 'top_text', 'full_bleed', 'quote'] as const
const CONTENT_CYCLE_NO_IMG = ['top_text', 'quote', 'split_v', 'full_bleed'] as const

function resolveArchetipo(slide: Slide, hasBg: boolean, modo: string): string {
  if (slide.arquetipo) return slide.arquetipo
  if (slide.tipo === 'capa') return modo === 'marca' ? 'brand_cover' : 'cover_full'
  if (slide.tipo === 'encerramento') return modo === 'marca' ? 'brand_promo' : 'closing'
  // Conteúdo — cicla entre os 4 arquétipos
  const idx = (slide.ordem - 2 + 400) % 4
  return (hasBg ? CONTENT_CYCLE : CONTENT_CYCLE_NO_IMG)[idx]
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const slide: Slide = body.slide
    const imagem_base64: string | undefined = body.imagem_base64
    const paleta: { primaria: string; secundaria: string; texto: string } = body.paleta ?? {}
    const total_slides: number = typeof body.total_slides === 'number' ? body.total_slides : 6
    const show_watermark: boolean = body.show_watermark === true
    const modo: string = body.modo || 'criador'

    const fontData = await loadFont(req.url)
    const fontOptions = fontData
      ? [{ name: 'Inter', data: fontData, weight: 700 as const, style: 'normal' as const }]
      : []

    const imgSrc = prepImg(imagem_base64)
    const hasBg = !!imgSrc
    const arquetipo = resolveArchetipo(slide, hasBg, modo)

    // Fallback: se paleta tem cor primaria diferente do padrão, pode ser usado em versões futuras
    void paleta

    let slideContent: React.ReactElement

    try {
      switch (arquetipo) {
        case 'cover_full':   slideContent = renderCoverFull(slide, imgSrc, total_slides); break
        case 'split_v':      slideContent = renderSplitV(slide, imgSrc, total_slides); break
        case 'top_text':     slideContent = renderTopText(slide, imgSrc, total_slides); break
        case 'full_bleed':   slideContent = renderFullBleed(slide, imgSrc, total_slides); break
        case 'quote':        slideContent = renderQuote(slide, imgSrc, total_slides); break
        case 'closing':      slideContent = renderClosing(slide, total_slides); break
        case 'brand_cover':  slideContent = renderBrandCover(slide, imgSrc, total_slides); break
        case 'brand_story':  slideContent = renderBrandStory(slide, imgSrc, total_slides); break
        case 'brand_promo':  slideContent = renderBrandPromo(slide, imgSrc, total_slides); break
        default:             slideContent = renderCoverFull(slide, imgSrc, total_slides)
      }
    } catch (archErr) {
      console.error('[renderizar] arquétipo falhou, usando fallback:', arquetipo, archErr)
      slideContent = renderFallback(slide, total_slides)
    }

    const makeRoot = (content: React.ReactElement) => (
      <div style={{
        width: 1080, height: 1080,
        position: 'relative',
        backgroundColor: BG,
        display: 'flex',
        fontFamily: 'Inter',
        overflow: 'hidden',
      }}>
        {content}
        {show_watermark && <Watermark />}
      </div>
    )

    let buffer: ArrayBuffer
    try {
      const imgResponse = new ImageResponse(makeRoot(slideContent), { width: 1080, height: 1080, fonts: fontOptions })
      buffer = await imgResponse.arrayBuffer()
    } catch (satoriErr) {
      console.error('[renderizar] satori falhou, usando fallback:', arquetipo, satoriErr)
      const fallbackResponse = new ImageResponse(makeRoot(renderFallback(slide, total_slides)), { width: 1080, height: 1080, fonts: fontOptions })
      buffer = await fallbackResponse.arrayBuffer()
    }
    return new Response(buffer, { headers: { 'Content-Type': 'image/png' } })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[renderizar] ERRO:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
