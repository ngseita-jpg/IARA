import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Slide } from '../gerar/route'

let _fontCache: ArrayBuffer | null = null

async function loadFont(reqUrl: string): Promise<ArrayBuffer | null> {
  if (_fontCache) return _fontCache
  // 1) filesystem — funciona local
  try {
    const buf = readFileSync(join(process.cwd(), 'public', 'inter-bold.ttf'))
    _fontCache = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
    return _fontCache
  } catch {}
  // 2) fetch via origin da requisição — funciona em qualquer ambiente Vercel/Cloudflare
  try {
    const origin = new URL(reqUrl).origin
    const res = await fetch(`${origin}/inter-bold.ttf`)
    if (res.ok) {
      _fontCache = await res.arrayBuffer()
      return _fontCache
    }
  } catch {}
  return null
}

const FONT_SIZE = { pequeno: 28, medio: 38, grande: 54, gigante: 72 }

function hexToRgb(hex: string): [number, number, number] {
  try {
    const clean = (hex || '#6B5FD0').replace('#', '')
    const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
    const n = parseInt(full, 16)
    if (isNaN(n)) return [107, 95, 208]
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  } catch {
    return [107, 95, 208]
  }
}

// Detecta o media_type real do base64 pelo cabeçalho mágico
function detectMediaType(b64: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  try {
    const header = b64.slice(0, 16)
    if (header.startsWith('/9j/')) return 'image/jpeg'
    if (header.startsWith('iVBORw')) return 'image/png'
    if (header.startsWith('R0lGOD')) return 'image/gif'
    if (header.startsWith('UklGR')) return 'image/webp'
    return 'image/jpeg'
  } catch {
    return 'image/jpeg'
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const slide: Slide = body.slide
    const imagem_base64: string | undefined = body.imagem_base64
    const paleta: { primaria: string; secundaria: string; texto: string } = body.paleta ?? { primaria: '#6B5FD0', secundaria: '#C9A84C', texto: '#ffffff' }
    const total_slides: number = typeof body.total_slides === 'number' ? body.total_slides : 0

    const fontData = await loadFont(req.url)
    const fontOptions = fontData
      ? [{ name: 'Inter', data: fontData, weight: 700 as const, style: 'normal' as const }]
      : []

    const fs = FONT_SIZE[slide.tamanho_fonte as keyof typeof FONT_SIZE] ?? 38
    const hasBg = typeof imagem_base64 === 'string' && imagem_base64.length > 0
    const isCapa = slide.tipo === 'capa'
    const isEncerramento = slide.tipo === 'encerramento'

    const pri = paleta.primaria || '#6B5FD0'
    const sec = paleta.secundaria || '#C9A84C'
    const txtColor = slide.cor_texto || paleta.texto || '#ffffff'
    const [pr, pg, pb] = hexToRgb(pri)
    const [sr, sg, sb] = hexToRgb(sec)

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

    // Prepara src da imagem com media_type correto
    let imgSrc: string | undefined
    if (hasBg && imagem_base64) {
      const clean = imagem_base64.replace(/^data:image\/[^;]+;base64,/, '')
      const mt = detectMediaType(clean)
      imgSrc = `data:${mt};base64,${clean}`
    }

    // Dots de progresso (max 10)
    const dotCount = Math.min(total_slides, 10)
    const dotIndexes = dotCount > 0 ? Array.from({ length: dotCount }, (_, i) => i) : []

    // Força rendering dentro do try/catch
    const imgResponse = new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'Inter', backgroundColor: pri }}>

          {/* Camada 2: gradiente de fundo (sem imagem) */}
          {!hasBg && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', backgroundImage: `linear-gradient(135deg, ${pri} 0%, ${sec} 100%)` }} />
          )}

          {/* Camada 2b: círculo decorativo */}
          {!hasBg && (
            <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: 300, backgroundColor: `rgba(${pr},${pg},${pb},0.35)`, top: -200, right: -200, display: 'flex' }} />
          )}

          {/* Camada 3: imagem */}
          {hasBg && imgSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgSrc} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )}

          {/* Camada 4: overlay na imagem */}
          {hasBg && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.58) 100%)' }} />
          )}

          {/* Overlay escuro extra */}
          {hasBg && slide.layout === 'overlay_escuro' && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', backgroundColor: 'rgba(0,0,0,0.30)' }} />
          )}

          {/* Molduras */}
          {slide.layout === 'moldura_branca' && (
            <div style={{ position: 'absolute', top: 28, left: 28, right: 28, bottom: 28, borderWidth: 3, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.85)', borderRadius: 10, display: 'flex' }} />
          )}
          {slide.layout === 'moldura_preta' && (
            <div style={{ position: 'absolute', top: 28, left: 28, right: 28, bottom: 28, borderWidth: 3, borderStyle: 'solid', borderColor: 'rgba(0,0,0,0.75)', borderRadius: 10, display: 'flex' }} />
          )}

          {/* Barra superior */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 48, paddingRight: 48 }}>
            {isCapa ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8, paddingBottom: 8, paddingLeft: 18, paddingRight: 18, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.25)' }}>
                <div style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#ffffff', display: 'flex' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', letterSpacing: '0.10em' }}>NOVO POST</span>
              </div>
            ) : dotIndexes.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {dotIndexes.map(i => (
                  <div key={i} style={{ width: i === slide.ordem - 1 ? 26 : 8, height: 8, borderRadius: 4, backgroundColor: i === slide.ordem - 1 ? '#ffffff' : 'rgba(255,255,255,0.28)', display: 'flex' }} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex' }} />
            )}
            {!isCapa && (
              <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.50)' }}>
                {slide.ordem}{total_slides > 0 ? `/${total_slides}` : ''}
              </span>
            )}
          </div>

          {/* Conteúdo principal */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: p.jc as 'center' | 'flex-start' | 'flex-end', alignItems: p.ai as 'center' | 'flex-start' | 'flex-end', paddingTop: p.py + 36, paddingBottom: p.py, paddingLeft: p.px, paddingRight: p.px }}>

            {slide.emoji ? (
              <div style={{ fontSize: isCapa ? Math.round(fs * 1.4) : Math.round(fs * 1.1), lineHeight: 1, marginBottom: 16, display: 'flex' }}>
                {slide.emoji}
              </div>
            ) : null}

            {!isCapa && !isEncerramento ? (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, alignSelf: p.ai as 'center' | 'flex-start' | 'flex-end' }}>
                <div style={{ width: 32, height: 4, borderRadius: 2, backgroundColor: sec, marginRight: 10, display: 'flex' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: sec, letterSpacing: '0.12em' }}>
                  {`DICA ${slide.ordem > 1 ? slide.ordem - 1 : slide.ordem}`}
                </span>
              </div>
            ) : null}

            {slide.titulo ? (
              <div style={{
                fontSize: isCapa ? fs : Math.round(fs * 0.85),
                fontWeight: 700,
                color: txtColor,
                lineHeight: isCapa ? 1.1 : 1.2,
                textAlign: textAlign as 'center' | 'left' | 'right',
                maxWidth: 900,
                alignSelf: p.ai as 'center' | 'flex-start' | 'flex-end',
                display: 'flex',
                flexWrap: 'wrap',
                ...(slide.cor_fundo_texto ? { backgroundColor: slide.cor_fundo_texto, paddingTop: 12, paddingBottom: 12, paddingLeft: 22, paddingRight: 22, borderRadius: 12 } : {}),
              }}>
                {slide.titulo}
              </div>
            ) : null}

            {slide.corpo ? (
              <div style={{
                fontSize: isCapa ? Math.round(fs * 0.48) : Math.round(fs * 0.58),
                fontWeight: 400,
                color: isCapa ? 'rgba(255,255,255,0.82)' : txtColor,
                lineHeight: 1.6,
                textAlign: textAlign as 'center' | 'left' | 'right',
                maxWidth: 860,
                marginTop: slide.titulo ? 18 : 0,
                alignSelf: p.ai as 'center' | 'flex-start' | 'flex-end',
                display: 'flex',
                flexWrap: 'wrap',
                ...(slide.cor_fundo_texto && !isCapa ? {
                  backgroundColor: slide.cor_fundo_texto.replace(/[\d.]+\)$/, '0.30)'),
                  paddingTop: 10, paddingBottom: 10, paddingLeft: 18, paddingRight: 18, borderRadius: 10,
                } : {}),
              }}>
                {slide.corpo}
              </div>
            ) : null}

            {slide.cta ? (
              <div style={{ marginTop: 28, display: 'flex', alignSelf: p.ai as 'center' | 'flex-start' | 'flex-end' }}>
                <div style={{ fontSize: Math.round(fs * 0.46), fontWeight: 700, color: `rgba(${sr},${sg},${sb},1)` === sec ? '#0a0a14' : '#ffffff', backgroundColor: sec, paddingTop: 16, paddingBottom: 16, paddingLeft: 36, paddingRight: 36, borderRadius: 999, display: 'flex' }}>
                  {slide.cta}
                </div>
              </div>
            ) : null}
          </div>

          {/* Linha accent inferior */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, display: 'flex', backgroundColor: sec }} />

          {/* Hint "arraste" na capa */}
          {isCapa ? (
            <div style={{ position: 'absolute', bottom: 40, right: 48, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.38)' }}>ARRASTE →</span>
            </div>
          ) : null}

        </div>
      ),
      { width: 1080, height: 1080, fonts: fontOptions }
    )

    // Força rendering dentro do try/catch para capturar erros do satori
    const buffer = await imgResponse.arrayBuffer()
    return new Response(buffer, {
      headers: { 'Content-Type': 'image/png' },
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[renderizar] ERRO:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
