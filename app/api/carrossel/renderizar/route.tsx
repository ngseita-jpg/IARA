import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import type { Slide } from '../gerar/route'

async function fetchFont(): Promise<ArrayBuffer> {
  const res = await fetch(
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff'
  )
  return res.arrayBuffer()
}

const FONT_SIZE = { pequeno: 26, medio: 36, grande: 50, gigante: 66 }

export async function POST(req: NextRequest) {
  const { slide, imagem_base64, paleta }: {
    slide: Slide
    imagem_base64?: string
    paleta: { primaria: string; secundaria: string; texto: string }
  } = await req.json()

  const fs = FONT_SIZE[slide.tamanho_fonte] ?? 36
  const bgFallback = slide.tipo === 'capa' ? paleta.primaria : '#0a0a14'
  const hasBg = !!imagem_base64

  // Traduzir layout para posicionamento flexbox
  const pos: Record<string, { jc: string; ai: string; px: number; py: number }> = {
    centro:        { jc: 'center',      ai: 'center',     px: 60, py: 60 },
    topo:          { jc: 'flex-start',  ai: 'center',     px: 60, py: 60 },
    base:          { jc: 'flex-end',    ai: 'center',     px: 60, py: 60 },
    esquerda:      { jc: 'center',      ai: 'flex-start', px: 60, py: 80 },
    direita:       { jc: 'center',      ai: 'flex-end',   px: 60, py: 80 },
    overlay_escuro:{ jc: 'center',      ai: 'center',     px: 60, py: 60 },
    moldura_branca:{ jc: 'center',      ai: 'center',     px: 80, py: 80 },
    moldura_preta: { jc: 'center',      ai: 'center',     px: 80, py: 80 },
  }
  const p = pos[slide.layout] ?? pos.centro

  const fontData = await fetchFont()

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          position: 'relative',
          backgroundColor: bgFallback,
          overflow: 'hidden',
          fontFamily: 'Inter',
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

        {/* Overlay escuro */}
        {slide.layout === 'overlay_escuro' && hasBg && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex' }} />
        )}

        {/* Moldura branca */}
        {slide.layout === 'moldura_branca' && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '24px solid white', display: 'flex' }} />
        )}

        {/* Moldura preta */}
        {slide.layout === 'moldura_preta' && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '24px solid #111', display: 'flex' }} />
        )}

        {/* Conteúdo de texto */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: p.jc,
            alignItems: p.ai,
            padding: `${p.py}px ${p.px}px`,
            gap: 16,
          }}
        >
          {/* Emoji */}
          {slide.emoji && (
            <div style={{ fontSize: fs * 1.2, lineHeight: 1, display: 'flex' }}>
              {slide.emoji}
            </div>
          )}

          {/* Título */}
          {slide.titulo && (
            <div
              style={{
                fontSize: fs,
                fontWeight: 800,
                color: slide.cor_texto,
                backgroundColor: slide.cor_fundo_texto ?? 'transparent',
                padding: slide.cor_fundo_texto ? '10px 20px' : '0',
                borderRadius: 10,
                lineHeight: 1.2,
                textAlign: p.ai === 'flex-start' ? 'left' : p.ai === 'flex-end' ? 'right' : 'center',
                maxWidth: 920,
                display: 'flex',
                flexWrap: 'wrap',
              }}
            >
              {slide.titulo}
            </div>
          )}

          {/* Corpo */}
          <div
            style={{
              fontSize: Math.round(fs * 0.6),
              fontWeight: 500,
              color: slide.cor_texto,
              backgroundColor: slide.cor_fundo_texto
                ? slide.cor_fundo_texto.replace(/[\d.]+\)/, '0.35)')
                : 'transparent',
              padding: slide.cor_fundo_texto ? '8px 18px' : '0',
              borderRadius: 8,
              lineHeight: 1.55,
              textAlign: p.ai === 'flex-start' ? 'left' : p.ai === 'flex-end' ? 'right' : 'center',
              maxWidth: 900,
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            {slide.corpo}
          </div>

          {/* CTA */}
          {slide.cta && (
            <div
              style={{
                fontSize: Math.round(fs * 0.48),
                fontWeight: 700,
                color: paleta.primaria,
                backgroundColor: 'rgba(255,255,255,0.92)',
                padding: '12px 28px',
                borderRadius: 999,
                marginTop: 8,
                display: 'flex',
              }}
            >
              {slide.cta}
            </div>
          )}
        </div>

        {/* Número do slide */}
        {slide.tipo !== 'capa' && (
          <div
            style={{
              position: 'absolute',
              bottom: 24, right: 32,
              fontSize: 22,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.35)',
              display: 'flex',
            }}
          >
            {slide.ordem}
          </div>
        )}
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      fonts: [{ name: 'Inter', data: fontData, weight: 700, style: 'normal' }],
    }
  )
}
