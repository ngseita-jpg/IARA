import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { ThumbnailLayout } from '../gerar/route'

// ── Cache de fontes ──────────────────────────────────────
const _fontCache: Record<string, ArrayBuffer> = {}

async function loadFont(reqUrl: string, fonte: string): Promise<ArrayBuffer | null> {
  if (_fontCache[fonte]) return _fontCache[fonte]

  const fileMap: Record<string, string> = {
    bebas:             'bebas-neue.ttf',
    anton:             'anton.ttf',
    russo:             'russo-one.ttf',
    oswald:            'oswald-bold.woff2',
    inter:             'inter-bold.ttf',
    playfair:          'playfair-bold.woff2',
    playfair_italic:   'playfair-italic.woff2',
    cormorant_italic:  'cormorant-italic.woff2',
    dm_serif:          'dm-serif.woff2',
    abril:             'abril-fatface.woff2',
    archivo_black:     'archivo-black.woff2',
    montserrat_black:  'montserrat-black.woff2',
    dancing:           'dancing-script.woff2',
    caveat:            'caveat-bold.woff2',
    space_grotesk:     'space-grotesk.woff2',
    poppins_black:     'poppins-black.woff2',
    syne:              'syne-black.woff2',
  }
  const fileName = fileMap[fonte] ?? 'inter-bold.ttf'

  try {
    const buf = readFileSync(join(process.cwd(), 'public', fileName))
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
    _fontCache[fonte] = ab
    return ab
  } catch {}
  try {
    const origin = new URL(reqUrl).origin
    const res = await fetch(`${origin}/${fileName}`)
    if (res.ok) {
      const ab = await res.arrayBuffer()
      _fontCache[fonte] = ab
      return ab
    }
  } catch {}
  return null
}

// ── Helpers ──────────────────────────────────────────────
function anchoraToFlex(ancora: string): { jc: string; ai: string } {
  const map: Record<string, { jc: string; ai: string }> = {
    topo_esq:    { jc: 'flex-start', ai: 'flex-start' },
    topo_centro: { jc: 'flex-start', ai: 'center' },
    topo_dir:    { jc: 'flex-start', ai: 'flex-end' },
    meio_esq:    { jc: 'center',     ai: 'flex-start' },
    meio_centro: { jc: 'center',     ai: 'center' },
    meio_dir:    { jc: 'center',     ai: 'flex-end' },
    base_esq:    { jc: 'flex-end',   ai: 'flex-start' },
    base_centro: { jc: 'flex-end',   ai: 'center' },
    base_dir:    { jc: 'flex-end',   ai: 'flex-end' },
  }
  return map[ancora] ?? { jc: 'flex-end', ai: 'center' }
}

function textAlign(ai: string): 'left' | 'center' | 'right' {
  if (ai === 'flex-start') return 'left'
  if (ai === 'flex-end') return 'right'
  return 'center'
}

function fotoZonaToStyle(zona: string, hasBg: boolean): React.CSSProperties | null {
  if (!hasBg || zona === 'nenhuma') return null
  const map: Record<string, React.CSSProperties> = {
    full:        { top: 0, left: 0, width: '100%', height: '100%' },
    esquerda_40: { top: 0, left: 0, width: '40%',  height: '100%' },
    esquerda_50: { top: 0, left: 0, width: '50%',  height: '100%' },
    esquerda_60: { top: 0, left: 0, width: '60%',  height: '100%' },
    direita_40:  { top: 0, right: 0, width: '40%', height: '100%' },
    direita_50:  { top: 0, right: 0, width: '50%', height: '100%' },
    direita_60:  { top: 0, right: 0, width: '60%', height: '100%' },
    topo_50:     { top: 0, left: 0, width: '100%', height: '50%' },
    base_50:     { bottom: 0, left: 0, width: '100%', height: '50%' },
  }
  const s = map[zona]
  if (!s) return { top: 0, left: 0, width: '100%', height: '100%' }
  return s
}

function badgePosToStyle(pos?: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    topo_esq:  { top: 28, left: 28 },
    topo_dir:  { top: 28, right: 28 },
    base_esq:  { bottom: 28, left: 28 },
    base_dir:  { bottom: 28, right: 28 },
  }
  return map[pos ?? 'topo_dir'] ?? { top: 28, right: 28 }
}

function buildBackground(l: ThumbnailLayout): React.CSSProperties {
  if (l.fundo_tipo === 'cor_solida') {
    return { background: l.fundo_cor1 }
  }
  const dir = {
    horizontal:    'to right',
    vertical:      'to bottom',
    diagonal_135:  'to bottom right',
    diagonal_45:   'to bottom left',
  }[l.fundo_direcao ?? 'diagonal_135'] ?? 'to bottom right'

  if (l.fundo_tipo === 'gradiente_radial') {
    return { background: `radial-gradient(ellipse at center, ${l.fundo_cor1}, ${l.fundo_cor2 ?? l.fundo_cor1})` }
  }
  return { background: `linear-gradient(${dir}, ${l.fundo_cor1}, ${l.fundo_cor2 ?? l.fundo_cor1})` }
}

// ── Handler ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { layout, imagem_base64 }: { layout: ThumbnailLayout; imagem_base64?: string } = await req.json()

  const fonte = layout.fonte ?? 'inter'
  const fontData = await loadFont(req.url, fonte)
  const fontName = fonte.charAt(0).toUpperCase() + fonte.slice(1)
  const fontOptions = fontData
    ? [{ name: fontName, data: fontData, weight: 900 as const, style: 'normal' as const }]
    : []

  const hasBg = !!imagem_base64
  const fotoStyle = fotoZonaToStyle(layout.foto_zona, hasBg)
  const pos = anchoraToFlex(layout.texto_ancora)
  const tAlign = textAlign(pos.ai)
  const fs = Math.max(48, Math.min(180, layout.tamanho_titulo ?? 100))
  const bgStyle = buildBackground(layout)
  const badgePos = badgePosToStyle(layout.badge_posicao)
  const maxTextW = Math.round(1280 * ((layout.texto_largura_pct ?? 85) / 100))

  // Sombra no texto
  const textShadow = layout.titulo_sombra
    ? '0 4px 24px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8)'
    : undefined

  // Contorno (stroke via text-stroke CSS não é suportado em Satori — usamos shadow como fallback)
  const contornoShadow = layout.titulo_contorno && layout.titulo_contorno_cor
    ? `2px 2px 0 ${layout.titulo_contorno_cor}, -2px -2px 0 ${layout.titulo_contorno_cor}, 2px -2px 0 ${layout.titulo_contorno_cor}, -2px 2px 0 ${layout.titulo_contorno_cor}`
    : undefined

  const finalShadow = [textShadow, contornoShadow].filter(Boolean).join(', ') || undefined

  // Maiúsculas automáticas para fontes condensadas de impacto
  const upperCaseFonts = ['bebas', 'anton', 'russo']
  const titulo = upperCaseFonts.includes(fonte)
    ? layout.titulo.toUpperCase()
    : layout.titulo

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: fontName,
          ...bgStyle,
        }}
      >
        {/* ── Foto ── */}
        {hasBg && fotoStyle && (
          <div style={{ position: 'absolute', display: 'flex', ...fotoStyle }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagem_base64}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: layout.foto_object_pos ?? 'center',
              }}
            />
          </div>
        )}

        {/* ── Overlay sobre a foto ── */}
        {hasBg && fotoStyle && layout.foto_overlay_cor && (
          <div style={{
            position: 'absolute',
            display: 'flex',
            ...fotoStyle,
            backgroundColor: layout.foto_overlay_cor,
          }} />
        )}

        {/* ── Badge ── */}
        {layout.badge && (
          <div style={{
            position: 'absolute',
            display: 'flex',
            ...badgePos,
            backgroundColor: layout.badge_cor_fundo ?? '#ef4444',
            color: layout.badge_cor_texto ?? '#ffffff',
            fontSize: 30,
            fontWeight: 900,
            fontFamily: fontName,
            padding: '8px 22px',
            borderRadius: 10,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}>
            {layout.badge}
          </div>
        )}

        {/* ── Bloco de texto ── */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: pos.jc,
            alignItems: pos.ai,
            padding: '44px 52px',
            gap: 10,
          }}
        >
          {/* Eyebrow */}
          {layout.eyebrow && (
            <div style={{
              display: 'flex',
              fontSize: Math.round(fs * 0.28),
              fontWeight: 900,
              fontFamily: fontName,
              color: layout.eyebrow_cor ?? '#f59e0b',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textAlign: tAlign,
              maxWidth: maxTextW,
            }}>
              {layout.eyebrow}
            </div>
          )}

          {/* Linha de acento acima do título */}
          {layout.linha_acento && layout.linha_acento_cor && !layout.eyebrow && (
            <div style={{
              display: 'flex',
              width: Math.min(120, maxTextW),
              height: 6,
              backgroundColor: layout.linha_acento_cor,
              borderRadius: 3,
              alignSelf: tAlign === 'center' ? 'center' : tAlign === 'right' ? 'flex-end' : 'flex-start',
            }} />
          )}

          {/* Título principal */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              fontSize: fs,
              fontWeight: 900,
              fontFamily: fontName,
              color: layout.titulo_cor,
              lineHeight: 1.0,
              letterSpacing: upperCaseFonts.includes(fonte) ? '0.01em' : '-0.03em',
              textAlign: tAlign,
              maxWidth: maxTextW,
              textShadow: finalShadow,
              backgroundColor: layout.titulo_fundo ?? 'transparent',
              padding: layout.titulo_fundo ? `10px ${Math.round(fs * 0.2)}px` : '0',
              borderRadius: layout.titulo_fundo ? (layout.titulo_fundo_raio ?? 8) : 0,
            }}
          >
            {titulo}
          </div>

          {/* Linha de acento abaixo do título */}
          {layout.linha_acento && layout.linha_acento_cor && layout.eyebrow && (
            <div style={{
              display: 'flex',
              width: Math.min(100, maxTextW),
              height: 5,
              backgroundColor: layout.linha_acento_cor,
              borderRadius: 3,
              alignSelf: tAlign === 'center' ? 'center' : tAlign === 'right' ? 'flex-end' : 'flex-start',
            }} />
          )}

          {/* Subtítulo */}
          {layout.subtitulo && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                fontSize: Math.round(fs * 0.32),
                fontWeight: 600,
                fontFamily: fontName,
                color: layout.subtitulo_cor ?? layout.titulo_cor,
                lineHeight: 1.25,
                textAlign: tAlign,
                maxWidth: maxTextW,
                opacity: 0.88,
                textShadow: layout.titulo_sombra ? '0 2px 12px rgba(0,0,0,0.8)' : undefined,
              }}
            >
              {layout.subtitulo}
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1280,
      height: 720,
      fonts: fontOptions,
    }
  )
}
