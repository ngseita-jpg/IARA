import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import type { ThumbnailLayout } from '../gerar/route'

async function fetchFont(): Promise<ArrayBuffer> {
  const res = await fetch(
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff'
  )
  return res.arrayBuffer()
}

const FONT_SIZE = { pequeno: 52, medio: 72, grande: 96, gigante: 120 }

export async function POST(req: NextRequest) {
  const { layout, imagem_base64 }: {
    layout: ThumbnailLayout
    imagem_base64?: string
  } = await req.json()

  const fs = FONT_SIZE[layout.tamanho_titulo] ?? 72
  const hasBg = !!imagem_base64

  // Posicionamento do texto
  const posMap: Record<string, { jc: string; ai: string }> = {
    centro:   { jc: 'center',     ai: 'center' },
    topo:     { jc: 'flex-start', ai: 'center' },
    base:     { jc: 'flex-end',   ai: 'center' },
    esquerda: { jc: 'center',     ai: 'flex-start' },
    direita:  { jc: 'center',     ai: 'flex-end' },
  }
  const pos = posMap[layout.posicao_texto] ?? posMap.centro

  // Fundo gradiente quando não tem foto
  const gradientBg = `linear-gradient(135deg, ${layout.cor_primaria} 0%, ${layout.cor_secundaria} 100%)`

  const fontData = await fetchFont()

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          position: 'relative',
          background: hasBg ? layout.cor_primaria : gradientBg,
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

        {/* Overlay para melhorar legibilidade */}
        {hasBg && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)',
            display: 'flex',
          }} />
        )}

        {/* Badge */}
        {layout.badge && (
          <div style={{
            position: 'absolute',
            top: 24, right: 24,
            backgroundColor: layout.cor_secundaria,
            color: '#ffffff',
            fontSize: 28,
            fontWeight: 900,
            padding: '8px 20px',
            borderRadius: 12,
            display: 'flex',
            letterSpacing: '-0.02em',
          }}>
            {layout.badge}
          </div>
        )}

        {/* Conteúdo principal */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: pos.jc,
            alignItems: pos.ai,
            padding: '40px 48px',
            gap: 12,
          }}
        >
          {/* Emoji */}
          {layout.emoji && (
            <div style={{ fontSize: fs * 0.7, lineHeight: 1, display: 'flex' }}>
              {layout.emoji}
            </div>
          )}

          {/* Título principal */}
          <div
            style={{
              fontSize: fs,
              fontWeight: 900,
              color: layout.cor_texto,
              backgroundColor: layout.estilo_titulo === 'caixa'
                ? (layout.cor_fundo_texto ?? 'rgba(0,0,0,0.7)')
                : layout.estilo_titulo === 'destaque'
                ? layout.cor_primaria
                : 'transparent',
              padding: layout.estilo_titulo !== 'normal' ? '12px 24px' : '0',
              borderRadius: layout.estilo_titulo !== 'normal' ? 14 : 0,
              lineHeight: 1.05,
              textAlign: pos.ai === 'flex-start' ? 'left' : pos.ai === 'flex-end' ? 'right' : 'center',
              maxWidth: 1100,
              display: 'flex',
              flexWrap: 'wrap',
              letterSpacing: '-0.03em',
              textShadow: layout.estilo_titulo === 'sombra' ? '3px 3px 12px rgba(0,0,0,0.8)' : 'none',
            }}
          >
            {layout.titulo_principal.toUpperCase()}
          </div>

          {/* Subtítulo */}
          {layout.subtitulo && (
            <div
              style={{
                fontSize: Math.round(fs * 0.38),
                fontWeight: 600,
                color: layout.cor_texto,
                backgroundColor: layout.cor_fundo_texto
                  ? layout.cor_fundo_texto.replace(/[\d.]+\)/, '0.5)')
                  : 'transparent',
                padding: layout.cor_fundo_texto ? '6px 14px' : '0',
                borderRadius: 8,
                lineHeight: 1.3,
                textAlign: pos.ai === 'flex-start' ? 'left' : pos.ai === 'flex-end' ? 'right' : 'center',
                maxWidth: 1000,
                display: 'flex',
                flexWrap: 'wrap',
                opacity: 0.9,
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
      fonts: [{ name: 'Inter', data: fontData, weight: 900, style: 'normal' }],
    }
  )
}
