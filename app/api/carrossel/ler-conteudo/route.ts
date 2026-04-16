import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as cheerio from 'cheerio'

function extractYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] ?? null
}

function detectPlatform(url: string) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('instagram.com')) return 'instagram'
  return 'artigo'
}

type CaptionTrack = {
  baseUrl: string
  languageCode: string
  kind?: string
}

// Usa a InnerTube API do YouTube (muito mais confiável que scraping)
async function fetchPlayerResponse(videoId: string): Promise<Record<string, unknown> | null> {
  // Tentativa 1: cliente ANDROID (retorna captions mesmo sem login)
  try {
    const res = await fetch(
      'https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'com.google.android.youtube/17.31.35 (Linux; U; Android 11)',
          'X-YouTube-Client-Name': '3',
          'X-YouTube-Client-Version': '17.31.35',
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'ANDROID',
              clientVersion: '17.31.35',
              androidSdkVersion: 30,
              hl: 'pt',
              gl: 'BR',
            },
          },
          videoId,
        }),
      }
    )
    if (res.ok) {
      const data = await res.json() as Record<string, unknown>
      const tracks = getCaptionTracks(data)
      if (tracks.length > 0) return data
    }
  } catch { /* tenta próximo */ }

  // Tentativa 2: cliente WEB
  try {
    const res = await fetch(
      'https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20231121.08.00',
              hl: 'pt',
              gl: 'BR',
            },
          },
          videoId,
        }),
      }
    )
    if (res.ok) {
      const data = await res.json() as Record<string, unknown>
      const tracks = getCaptionTracks(data)
      if (tracks.length > 0) return data
    }
  } catch { /* tenta próximo */ }

  // Tentativa 3: scraping da página
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    })
    if (pageRes.ok) {
      const html = await pageRes.text()
      // Tenta múltiplos padrões de extração
      const patterns = [
        /ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|const|let|<\/script>)/,
        /ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});\s*(?:var|const|let|<)/,
        /"ytInitialPlayerResponse"\s*:\s*(\{[\s\S]+?\}),\s*"ytInitialData"/,
      ]
      for (const pattern of patterns) {
        const match = html.match(pattern)
        if (match) {
          try {
            const data = JSON.parse(match[1]) as Record<string, unknown>
            const tracks = getCaptionTracks(data)
            if (tracks.length > 0) return data
          } catch { /* continua */ }
        }
      }
    }
  } catch { /* falhou */ }

  return null
}

function getCaptionTracks(playerResponse: Record<string, unknown>): CaptionTrack[] {
  const captions = playerResponse?.captions as Record<string, unknown> | undefined
  const renderer = captions?.playerCaptionsTracklistRenderer as Record<string, unknown> | undefined
  const tracks = renderer?.captionTracks as CaptionTrack[] | undefined
  return tracks ?? []
}

function getVideoTitle(playerResponse: Record<string, unknown>): string {
  const details = playerResponse?.videoDetails as Record<string, unknown> | undefined
  return (details?.title as string | undefined) ?? ''
}

async function parseCaptionXml(xml: string): Promise<string> {
  return xml
    .replace(/<text[^>]*>/g, ' ')
    .replace(/<\/text>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

async function parseCaptionJson3(json: unknown): Promise<string> {
  const data = json as { events?: Array<{ segs?: Array<{ utf8?: string }> }> }
  return (data.events ?? [])
    .flatMap((e) => e.segs ?? [])
    .map((s) => s.utf8 ?? '')
    .join(' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchYouTubeTranscript(videoId: string): Promise<{ texto: string; titulo: string } | null> {
  const playerResponse = await fetchPlayerResponse(videoId)
  if (!playerResponse) return null

  const titulo = getVideoTitle(playerResponse) || `Vídeo ${videoId}`
  const tracks = getCaptionTracks(playerResponse)
  if (!tracks.length) return null

  // Prioridade: PT-BR → PT → ASR (auto) em qualquer idioma → primeira disponível
  const track =
    tracks.find((t) => t.languageCode === 'pt-BR') ??
    tracks.find((t) => t.languageCode === 'pt') ??
    tracks.find((t) => t.languageCode?.startsWith('pt')) ??
    tracks.find((t) => t.kind === 'asr') ??
    tracks[0]

  if (!track?.baseUrl) return null

  // Tentar JSON3 primeiro (mais limpo)
  try {
    const jsonRes = await fetch(track.baseUrl + '&fmt=json3')
    if (jsonRes.ok) {
      const json = await jsonRes.json()
      const texto = await parseCaptionJson3(json)
      if (texto.length > 50) return { texto: texto.slice(0, 8000), titulo }
    }
  } catch { /* tenta XML */ }

  // Fallback: XML
  try {
    const xmlRes = await fetch(track.baseUrl)
    if (xmlRes.ok) {
      const xml = await xmlRes.text()
      const texto = await parseCaptionXml(xml)
      if (texto.length > 50) return { texto: texto.slice(0, 8000), titulo }
    }
  } catch { /* falhou */ }

  return null
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL não informada' }, { status: 400 })

  const plataforma = detectPlatform(url)

  // ── YouTube ──────────────────────────────────────────
  if (plataforma === 'youtube') {
    const videoId = extractYouTubeId(url)
    if (!videoId) return NextResponse.json({ error: 'URL do YouTube inválida' }, { status: 400 })

    try {
      const resultado = await fetchYouTubeTranscript(videoId)

      if (resultado?.texto) {
        return NextResponse.json({
          plataforma,
          titulo: resultado.titulo,
          conteudo: resultado.texto,
          tipo: 'transcricao',
        })
      }

      return NextResponse.json({
        plataforma,
        titulo: `Vídeo YouTube (${videoId})`,
        conteudo: '',
        tipo: 'sem_transcricao',
        aviso: 'Este vídeo não tem legenda disponível. Cole o conteúdo manualmente abaixo.',
      })
    } catch (err) {
      console.error('Erro transcrição YouTube:', err)
      return NextResponse.json({
        plataforma,
        titulo: `Vídeo YouTube (${videoId})`,
        conteudo: '',
        tipo: 'sem_transcricao',
        aviso: 'Não foi possível acessar este vídeo. Cole o conteúdo manualmente abaixo.',
      })
    }
  }

  // ── Artigo ───────────────────────────────────────────
  if (plataforma === 'artigo') {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IARABot/1.0)' },
      })
      const html = await res.text()
      const $ = cheerio.load(html)

      $('script, style, nav, footer, header, aside, [class*="menu"], [class*="sidebar"], [class*="ad"], [class*="banner"]').remove()

      const titulo = $('h1').first().text().trim() || $('title').text().trim() || url

      const seletores = ['article', 'main', '[class*="content"]', '[class*="article"]', '[class*="post"]', 'body']
      let conteudo = ''
      for (const sel of seletores) {
        const texto = $(sel).first().text().replace(/\s+/g, ' ').trim()
        if (texto.length > 200) { conteudo = texto.slice(0, 6000); break }
      }

      return NextResponse.json({ plataforma, titulo, conteudo, tipo: 'artigo' })
    } catch {
      return NextResponse.json({ error: 'Não foi possível acessar essa URL' }, { status: 400 })
    }
  }

  // ── TikTok / Instagram ───────────────────────────────
  return NextResponse.json({
    plataforma,
    titulo: url,
    conteudo: '',
    tipo: 'sem_suporte',
    aviso: `${plataforma === 'tiktok' ? 'TikTok' : 'Instagram'} não permite extração automática. Cole o texto do vídeo manualmente abaixo.`,
  })
}
