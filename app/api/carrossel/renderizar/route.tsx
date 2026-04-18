import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import type { Slide } from '../gerar/route'

let _fontCache: ArrayBuffer | null = null

async function fetchFont(): Promise<ArrayBuffer | null> {
  if (_fontCache) return _fontCache
  try {
    const res = await fetch(
      'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff',
      { signal: AbortSignal.timeout(4000) }
    )
    if (!res.ok) return null
    _fontCache = await res.arrayBuffer()
    return _fontCache
  } catch {
    return null
  }
}

const FONT_SIZE = { pequeno: 28, medio: 38, grande: 54, gigante: 72 }

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function luminance(r: number, g: number, b: number): number {
  const [rl, gl, bl] = [r, g, b].map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

function contrastColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex)
  return luminance(r, g, b) > 0.35 ? '#0a0a14' : '#ffffff'
}

export async function POST(req: NextRequest) {
  const { slide, imagem_base64, paleta, total_slides }: {
    slide: Slide
    imagem_base64?: string
    paleta: { primaria: string; secundaria: string; texto: string }
    total_slides?: number
  } = await req.json()

  const fontData = await fetchFont()
  const fontOptions = fontData
    ? [{ name: 'Inter', data: fontData, weight: 700 as const, style: 'normal' as const }]
    : []

  const fs = FONT_SIZE[slide.tamanho_fonte] ?? 38
  const hasBg = !!imagem_base64
  const isCapa = slide.tipo === 'capa'
  const isEncerramento = slide.tipo === 'encerramento'

  const pri = paleta.primaria
  const sec = paleta.secundaria
  const txtColor = slide.cor_texto || paleta.texto || '#ffffff'
  const [pr, pg, pb] = hexToRgb(pri)
  const total = total_slides ?? 0

  const pos: Record<string, { jc: string; ai: string; px: number; py: number }> = {
    centro:         { jc: 'center',     ai: 'center',     px: 72, py: 72 },
    topo:           { jc: 'flex-start', ai: 'center',     px: 72, py: 80 },
    base:           { jc: 'flex-end',   ai: 'center',     px: 72, py: 80 },
    esquerda:       { jc: 'center',     ai: 'flex-start', px: 72, py: 80 },
    direita:        { jc: 'center',     ai: 'flex-end',   px: 72, py: 80 },
    overlay_escuro: { jc: 'center',     ai: 'center',     px: 72, py: 72 },
    moldura_branca: { jc: 'center',     ai: 'center',     px: 100, py: 100 },
    moldura_preta:  { jc: 'center',     ai: 'center',     px: 100, py: 100 },
  }
  const p = pos[slide.layout] ?? pos.centro
  const textAlign = p.ai === 'flex-start' ? 'left' : p.ai === 'flex-end' ? 'right' : 'center'
  const alignItems = p.ai

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Inter',
          backgroundColor: pri,
          backgroundImage: hasBg ? 'none' : `linear-gradient(135deg, ${pri} 0%, ${sec} 100%)`,
        }}
      >
        {/* Imagem de fundo */}
        {hasBg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagem_base64}
            alt=""
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Overlay gradiente para imagem */}
        {hasBg && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundImage: slide.layout === 'overlay_escuro'
              ? 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.70) 100%)'
              : 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)',
            display: 'flex',
          }} />
        )}

        {/* Círculos decorativos (apenas sem imagem) */}
        {!hasBg && (
          <>
            <div style={{
              position: 'absolute', width: 800, height: 800, borderRadius: '50%',
              backgroundColor: `rgba(${pr},${pg},${pb},0.18)`,
              top: -280, right: -280, display: 'flex',
            }} />
            <div style={{
              position: 'absolute', width: 500, height: 500, borderRadius: '50%',
              backgroundColor: `rgba(255,255,255,0.05)`,
              bottom: -150, left: -150, display: 'flex',
            }} />
          </>
        )}

        {/* Moldura branca */}
        {slide.layout === 'moldura_branca' && (
          <div style={{
            position: 'absolute', top: 28, left: 28, right: 28, bottom: 28,
            borderWidth: 3, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.80)',
            borderRadius: 10, display: 'flex',
          }} />
        )}

        {/* Moldura preta */}
        {slide.layout === 'moldura_preta' && (
          <div style={{
            position: 'absolute', top: 28, left: 28, right: 28, bottom: 28,
            borderWidth: 3, borderStyle: 'solid', borderColor: 'rgba(0,0,0,0.70)',
            borderRadius: 10, display: 'flex',
          }} />
        )}

        {/* Barra superior */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 76,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingLeft: 48, paddingRight: 48,
        }}>
          {/* Badge capa / dots de progresso */}
          {isCapa ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              paddingTop: 8, paddingBottom: 8, paddingLeft: 18, paddingRight: 18,
              borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.25)',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', letterSpacing: '0.10em' }}>
                NOVO POST
              </span>
            </div>
          ) : total > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
                <div key={i} style={{
                  width: i === slide.ordem - 1 ? 28 : 8,
                  height: 8, borderRadius: 999,
                  backgroundColor: i === slide.ordem - 1 ? '#ffffff' : 'rgba(255,255,255,0.28)',
                  display: 'flex',
                }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex' }} />
          )}

          {/* Número do slide */}
          {!isCapa && (
            <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>
              {slide.ordem}{total > 0 ? `/${total}` : ''}
            </span>
          )}
        </div>

        {/* Conteúdo principal */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          justifyContent: p.jc, alignItems: alignItems,
          paddingTop: p.py + 40, paddingBottom: p.py,
          paddingLeft: p.px, paddingRight: p.px,
          gap: 0,
        }}>
          {/* Emoji */}
          {slide.emoji && (
            <div style={{
              fontSize: isCapa ? Math.round(fs * 1.5) : Math.round(fs * 1.1),
              lineHeight: 1, marginBottom: 18, display: 'flex',
            }}>
              {slide.emoji}
            </div>
          )}

          {/* Pill decorativo para slides de conteúdo */}
          {!isCapa && !isEncerramento && (
            <div style={{
              display: 'flex', alignItems: 'center', marginBottom: 22, alignSelf: alignItems,
            }}>
              <div style={{
                width: 36, height: 4, borderRadius: 999,
                backgroundColor: sec, marginRight: 12, display: 'flex',
              }} />
              <span style={{
                fontSize: 13, fontWeight: 700, color: sec, letterSpacing: '0.12em',
              }}>
                {`DICA ${slide.ordem > 1 ? slide.ordem - 1 : slide.ordem}`}
              </span>
            </div>
          )}

          {/* Título */}
          {slide.titulo && (
            <div style={{
              fontSize: isCapa ? fs : Math.round(fs * 0.85),
              fontWeight: 700,
              color: txtColor,
              lineHeight: isCapa ? 1.1 : 1.2,
              textAlign: textAlign as 'center' | 'left' | 'right',
              letterSpacing: isCapa ? '-0.02em' : '-0.01em',
              maxWidth: 900,
              alignSelf: alignItems,
              ...(slide.cor_fundo_texto ? {
                backgroundColor: slide.cor_fundo_texto,
                paddingTop: 14, paddingBottom: 14, paddingLeft: 24, paddingRight: 24,
                borderRadius: 14,
              } : {}),
              display: 'flex', flexWrap: 'wrap',
            }}>
              {slide.titulo}
            </div>
          )}

          {/* Corpo */}
          {slide.corpo && (
            <div style={{
              fontSize: isCapa ? Math.round(fs * 0.48) : Math.round(fs * 0.58),
              fontWeight: 400,
              color: isCapa ? 'rgba(255,255,255,0.82)' : txtColor,
              lineHeight: 1.6,
              textAlign: textAlign as 'center' | 'left' | 'right',
              maxWidth: 860,
              marginTop: slide.titulo ? 20 : 0,
              alignSelf: alignItems,
              ...(slide.cor_fundo_texto && !isCapa ? {
                backgroundColor: slide.cor_fundo_texto.replace(/[\d.]+\)/, '0.30)'),
                paddingTop: 10, paddingBottom: 10, paddingLeft: 20, paddingRight: 20,
                borderRadius: 10,
              } : {}),
              display: 'flex', flexWrap: 'wrap',
            }}>
              {slide.corpo}
            </div>
          )}

          {/* CTA */}
          {slide.cta && (
            <div style={{
              marginTop: 32, display: 'flex', alignItems: 'center',
              gap: 14, alignSelf: alignItems,
            }}>
              <div style={{
                fontSize: Math.round(fs * 0.46),
                fontWeight: 700,
                color: contrastColor(sec),
                backgroundColor: sec,
                paddingTop: 16, paddingBottom: 16, paddingLeft: 36, paddingRight: 36,
                borderRadius: 999,
                letterSpacing: '0.03em',
                display: 'flex',
              }}>
                {slide.cta}
              </div>
            </div>
          )}
        </div>

        {/* Linha inferior accent */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 5,
          backgroundImage: `linear-gradient(90deg, ${pri} 0%, ${sec} 50%, ${pri} 100%)`,
          display: 'flex',
        }} />

        {/* Capa: hint "arraste" */}
        {isCapa && (
          <div style={{
            position: 'absolute', bottom: 44, right: 48,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: 'rgba(255,255,255,0.40)', letterSpacing: '0.08em',
            }}>
              ARRASTE
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  backgroundColor: i === 1 ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.25)',
                  display: 'flex',
                }} />
              ))}
            </div>
          </div>
        )}
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      fonts: fontOptions,
    }
  )
}
