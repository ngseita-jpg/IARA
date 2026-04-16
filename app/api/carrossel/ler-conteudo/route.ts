import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as cheerio from 'cheerio'

export const maxDuration = 60

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

type CaptionTrack = { baseUrl: string; languageCode: string; kind?: string }

// ─────────────────────────────────────────────────────────
// InnerTube API
// ─────────────────────────────────────────────────────────
async function fetchInnerTube(videoId: string, clientName: string, clientVersion: string, extraHeaders: Record<string, string> = {}): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(
      'https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': 'pt-BR,pt;q=0.9', ...extraHeaders },
        body: JSON.stringify({
          context: { client: { clientName, clientVersion, hl: 'pt', gl: 'BR' } },
          videoId,
        }),
      }
    )
    if (!res.ok) return null
    return await res.json() as Record<string, unknown>
  } catch { return null }
}

function getCaptionTracks(pr: Record<string, unknown>): CaptionTrack[] {
  const tracks = ((pr?.captions as Record<string, unknown>)
    ?.playerCaptionsTracklistRenderer as Record<string, unknown>)
    ?.captionTracks as CaptionTrack[] | undefined
  return tracks ?? []
}

function getVideoTitle(pr: Record<string, unknown>): string {
  return ((pr?.videoDetails as Record<string, unknown>)?.title as string | undefined) ?? ''
}

function getVideoDescription(pr: Record<string, unknown>): string {
  const details = pr?.videoDetails as Record<string, unknown> | undefined
  return (details?.shortDescription as string | undefined) ?? ''
}

// ─────────────────────────────────────────────────────────
// Extrai legendas
// ─────────────────────────────────────────────────────────
async function transcriptFromCaptions(tracks: CaptionTrack[]): Promise<string | null> {
  const track =
    tracks.find((t) => t.languageCode === 'pt-BR') ??
    tracks.find((t) => t.languageCode === 'pt') ??
    tracks.find((t) => t.languageCode?.startsWith('pt')) ??
    tracks.find((t) => t.kind === 'asr') ??
    tracks[0]

  if (!track?.baseUrl) return null

  try {
    const r = await fetch(track.baseUrl + '&fmt=json3')
    if (r.ok) {
      const j = await r.json() as { events?: Array<{ segs?: Array<{ utf8?: string }> }> }
      const t = (j.events ?? [])
        .flatMap((e) => e.segs ?? [])
        .map((s) => s.utf8 ?? '')
        .join(' ').replace(/\s+/g, ' ').trim()
      if (t.length > 50) return t.slice(0, 8000)
    }
  } catch { /* tenta XML */ }

  try {
    const r = await fetch(track.baseUrl)
    if (r.ok) {
      const xml = await r.text()
      const t = xml
        .replace(/<text[^>]*>/g, ' ').replace(/<\/text>/g, ' ').replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ').trim()
      if (t.length > 50) return t.slice(0, 8000)
    }
  } catch { /* falhou */ }

  return null
}

// ─────────────────────────────────────────────────────────
// Extrai metadados da página (fallback sem legenda)
// ─────────────────────────────────────────────────────────
async function fetchYouTubeMetadata(videoId: string): Promise<{ titulo: string; descricao: string; capitulos: string } | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    })
    if (!res.ok) return null
    const html = await res.text()

    // Extrai ytInitialData para pegar descrição e capítulos
    const dataMatch = html.match(/ytInitialData\s*=\s*(\{[\s\S]+?\});\s*(?:var|const|let|<\/script>)/)
    let descricao = ''
    let capitulos = ''

    if (dataMatch) {
      try {
        const data = JSON.parse(dataMatch[1]) as Record<string, unknown>
        // Descrição
        const contents = (((data?.contents as Record<string, unknown>)
          ?.twoColumnWatchNextResults as Record<string, unknown>)
          ?.results as Record<string, unknown>)
          ?.results as Record<string, unknown>
        const items = (contents?.contents as Array<Record<string, unknown>>) ?? []
        for (const item of items) {
          const video = item?.videoPrimaryInfoRenderer as Record<string, unknown> | undefined
          if (video) {
            const desc = (video?.description as Record<string, unknown>)?.runs as Array<{ text?: string }> | undefined
            if (desc) descricao = desc.map((r) => r.text ?? '').join('').slice(0, 3000)
          }
          // Capítulos
          const secondary = item?.videoSecondaryInfoRenderer as Record<string, unknown> | undefined
          if (secondary) {
            const descRuns = ((secondary?.description as Record<string, unknown>)?.runs) as Array<{ text?: string }> | undefined
            if (descRuns) {
              const texto = descRuns.map((r) => r.text ?? '').join('')
              // Detecta padrão de capítulos (00:00 Intro etc.)
              const capMatches = texto.match(/\d+:\d+\s+.+/g)
              if (capMatches?.length) capitulos = capMatches.join('\n')
            }
          }
        }
      } catch { /* continua */ }
    }

    // Título via oEmbed (mais confiável)
    let titulo = ''
    try {
      const oembed = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
      if (oembed.ok) titulo = ((await oembed.json()) as { title?: string }).title ?? ''
    } catch { /* ignora */ }

    if (!titulo && !descricao) return null

    return { titulo, descricao, capitulos }
  } catch { return null }
}

// ─────────────────────────────────────────────────────────
// Pipeline principal
// ─────────────────────────────────────────────────────────
async function fetchYouTubeContent(videoId: string): Promise<{ texto: string; titulo: string; tipo: string } | null> {
  const clients: Array<{ name: string; version: string; headers: Record<string, string> }> = [
    { name: 'ANDROID', version: '17.31.35', headers: { 'User-Agent': 'com.google.android.youtube/17.31.35 (Linux; U; Android 11)', 'X-YouTube-Client-Name': '3', 'X-YouTube-Client-Version': '17.31.35' } },
    { name: 'WEB',     version: '2.20231121.08.00', headers: {} },
    { name: 'TVHTML5', version: '7.20230727.00.00', headers: {} },
  ]

  let bestTitle = ''

  for (const client of clients) {
    const pr = await fetchInnerTube(videoId, client.name, client.version, client.headers)
    if (!pr) continue

    if (!bestTitle) bestTitle = getVideoTitle(pr)

    // 1. Tenta legendas
    const tracks = getCaptionTracks(pr)
    if (tracks.length > 0) {
      const texto = await transcriptFromCaptions(tracks)
      if (texto) return { texto, titulo: getVideoTitle(pr) || bestTitle, tipo: 'transcricao' }
    }

    // 2. Tenta descrição do player response
    const descricao = getVideoDescription(pr)
    if (descricao.length > 100) {
      return {
        texto: `Título: ${getVideoTitle(pr)}\n\nDescrição:\n${descricao}`,
        titulo: getVideoTitle(pr) || bestTitle,
        tipo: 'descricao',
      }
    }
  }

  // 3. Fallback: scraping da página (título + descrição + capítulos)
  const meta = await fetchYouTubeMetadata(videoId)
  if (meta) {
    const partes = [
      `Título: ${meta.titulo}`,
      meta.descricao ? `Descrição do vídeo:\n${meta.descricao}` : '',
      meta.capitulos ? `Capítulos/estrutura do vídeo:\n${meta.capitulos}` : '',
    ].filter(Boolean)

    if (partes.length > 1) {
      return { texto: partes.join('\n\n'), titulo: meta.titulo, tipo: 'descricao' }
    }
  }

  return null
}

// ─────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────
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
      const resultado = await fetchYouTubeContent(videoId)

      if (resultado) {
        const aviso = resultado.tipo === 'descricao'
          ? 'Este vídeo não tem legenda — usando título e descrição como base para o carrossel.'
          : undefined

        return NextResponse.json({
          plataforma,
          titulo: resultado.titulo,
          conteudo: resultado.texto,
          tipo: resultado.tipo,
          ...(aviso ? { aviso } : {}),
        })
      }

      return NextResponse.json({
        plataforma,
        titulo: `Vídeo YouTube (${videoId})`,
        conteudo: '',
        tipo: 'sem_conteudo',
        aviso: 'Não foi possível extrair conteúdo deste vídeo. Cole o texto manualmente abaixo.',
      })
    } catch (err) {
      console.error('Erro YouTube:', err)
      return NextResponse.json({
        plataforma,
        titulo: `Vídeo YouTube (${videoId})`,
        conteudo: '',
        tipo: 'sem_conteudo',
        aviso: 'Erro ao processar o vídeo. Cole o conteúdo manualmente abaixo.',
      })
    }
  }

  // ── Artigo ───────────────────────────────────────────
  if (plataforma === 'artigo') {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IARABot/1.0)' } })
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
    aviso: `${plataforma === 'tiktok' ? 'TikTok' : 'Instagram'} não permite extração automática. Cole o texto manualmente abaixo.`,
  })
}
