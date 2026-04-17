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

type AudioFormat = { url?: string; mimeType?: string; bitrate?: number }

// Consent cookie header to bypass YouTube's bot gate on cloud IPs
const YT_CONSENT_HEADERS = {
  Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+294; VISITOR_INFO1_LIVE=; YSC=',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

// ─────────────────────────────────────────────────────────
// Tentativa 1: youtube-transcript (lida com legendas de qualquer vídeo)
// ─────────────────────────────────────────────────────────
async function tryYoutubeTranscript(videoId: string): Promise<string | null> {
  try {
    const { YoutubeTranscript } = await import('youtube-transcript')
    const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt' })
      .catch(() => YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt-BR' }))
      .catch(() => YoutubeTranscript.fetchTranscript(videoId))
    const texto = segments.map((s) => s.text).join(' ').replace(/\s+/g, ' ').trim()
    return texto.length > 50 ? texto.slice(0, 8000) : null
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────
// Tentativa 2: Página HTML do YouTube (extrai ytInitialPlayerResponse)
// Mais confiável do que InnerTube API direto em IPs de cloud
// ─────────────────────────────────────────────────────────
async function tryYouTubePageScrape(videoId: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: YT_CONSENT_HEADERS,
    })
    if (!res.ok) return null
    const html = await res.text()

    // Extrai ytInitialPlayerResponse do HTML
    const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})(?:;|\s*<\/script>)/)
    if (!match) return null

    return JSON.parse(match[1]) as Record<string, unknown>
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────
// InnerTube API com múltiplos clientes
// ─────────────────────────────────────────────────────────
async function fetchInnerTube(
  videoId: string,
  clientName: string,
  clientVersion: string,
  extraHeaders: Record<string, string> = {}
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(
      'https://www.youtube.com/youtubei/v1/player',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...YT_CONSENT_HEADERS,
          ...extraHeaders,
        },
        body: JSON.stringify({
          context: {
            client: { clientName, clientVersion, hl: 'pt', gl: 'BR' },
          },
          videoId,
        }),
      }
    )
    if (!res.ok) return null
    return await res.json() as Record<string, unknown>
  } catch { return null }
}

function getCaptionTracks(pr: Record<string, unknown>) {
  return (((pr?.captions as Record<string, unknown>)
    ?.playerCaptionsTracklistRenderer as Record<string, unknown>)
    ?.captionTracks as Array<{ baseUrl: string; languageCode: string; kind?: string }> | undefined) ?? []
}

function getAudioFormats(pr: Record<string, unknown>): AudioFormat[] {
  const fmts = ((pr?.streamingData as Record<string, unknown>)?.adaptiveFormats as AudioFormat[] | undefined) ?? []
  return fmts.filter((f) => f.url && f.mimeType?.includes('audio'))
}

function getTitle(pr: Record<string, unknown>) {
  return ((pr?.videoDetails as Record<string, unknown>)?.title as string | undefined) ?? ''
}

function getDescription(pr: Record<string, unknown>) {
  return ((pr?.videoDetails as Record<string, unknown>)?.shortDescription as string | undefined) ?? ''
}

async function captionTracksToText(
  tracks: Array<{ baseUrl: string; languageCode: string; kind?: string }>
): Promise<string | null> {
  // Prioridade: pt-BR > pt > qualquer pt > auto-gerada (asr) > qualquer
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
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (t.length > 50) return t.slice(0, 8000)
    }
  } catch { /* tenta XML */ }

  try {
    const r = await fetch(track.baseUrl)
    if (r.ok) {
      const t = (await r.text())
        .replace(/<text[^>]*>/g, ' ')
        .replace(/<\/text>/g, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim()
      if (t.length > 50) return t.slice(0, 8000)
    }
  } catch { /* falhou */ }

  return null
}

// ─────────────────────────────────────────────────────────
// Tentativa 3: Transcrição de áudio via OpenAI Whisper
// Funciona para vídeos SEM legenda automática
// ─────────────────────────────────────────────────────────
async function tryWhisper(audioFormats: AudioFormat[]): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key || !audioFormats.length) return null

  // Escolhe o menor bitrate (menos dados para baixar, ainda inteligível)
  const chosen = [...audioFormats].sort((a, b) => (a.bitrate ?? 999999) - (b.bitrate ?? 999999))[0]
  if (!chosen?.url) return null

  const ext = chosen.mimeType?.includes('webm') ? 'webm' : 'mp4'

  try {
    // Baixa apenas os primeiros 6 MB do áudio
    const audioRes = await fetch(chosen.url, {
      headers: { Range: 'bytes=0-6291456' },
    })
    if (!audioRes.ok) return null
    const audioBuffer = await audioRes.arrayBuffer()

    const form = new FormData()
    form.append(
      'file',
      new Blob([audioBuffer], { type: chosen.mimeType ?? 'audio/mp4' }),
      `audio.${ext}`
    )
    form.append('model', 'whisper-1')
    form.append('language', 'pt')
    form.append('response_format', 'text')

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    })

    if (!whisperRes.ok) {
      console.error('Whisper error:', await whisperRes.text())
      return null
    }

    const texto = (await whisperRes.text()).trim()
    return texto.length > 50 ? texto.slice(0, 8000) : null
  } catch (err) {
    console.error('Whisper exception:', err)
    return null
  }
}

// ─────────────────────────────────────────────────────────
// Pipeline principal do YouTube
// ─────────────────────────────────────────────────────────
async function fetchYouTubeContent(
  videoId: string
): Promise<{ texto: string; titulo: string; tipo: string } | null> {

  // Título via oEmbed (muito confiável)
  let titulo = ''
  try {
    const oe = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    )
    if (oe.ok) titulo = ((await oe.json()) as { title?: string }).title ?? ''
  } catch { /* ignora */ }

  // 1. youtube-transcript (funciona para ~90% dos vídeos com legenda)
  const transcript1 = await tryYoutubeTranscript(videoId)
  if (transcript1) return { texto: transcript1, titulo, tipo: 'transcricao' }

  // 2. Scrape direto da página HTML (extrai ytInitialPlayerResponse)
  // Este método funciona mesmo quando a API InnerTube bloqueia IPs de cloud
  const pageData = await tryYouTubePageScrape(videoId)
  if (pageData) {
    if (!titulo) titulo = getTitle(pageData)

    const tracks = getCaptionTracks(pageData)
    if (tracks.length > 0) {
      const texto = await captionTracksToText(tracks)
      if (texto) return { texto, titulo, tipo: 'transcricao' }
    }
  }

  // 3. InnerTube com múltiplos clientes
  const clients: Array<{
    name: string
    version: string
    headers: Record<string, string>
  }> = [
    // TVHTML5 — cliente de TV, bypassa proteções anti-bot com mais frequência
    {
      name: 'TVHTML5',
      version: '7.20230105.08.01',
      headers: {
        'User-Agent': 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/6.0 TV Safari/538.1',
        'X-YouTube-Client-Name': '7',
        'X-YouTube-Client-Version': '7.20230105.08.01',
      },
    },
    // ANDROID — app nativo do Android
    {
      name: 'ANDROID',
      version: '17.31.35',
      headers: {
        'User-Agent': 'com.google.android.youtube/17.31.35 (Linux; U; Android 11) gzip',
        'X-YouTube-Client-Name': '3',
        'X-YouTube-Client-Version': '17.31.35',
      },
    },
    // WEB — browser padrão
    {
      name: 'WEB',
      version: '2.20231121.08.00',
      headers: {},
    },
  ]

  let bestAudio: AudioFormat[] = []
  let bestDesc = ''

  for (const client of clients) {
    const pr = await fetchInnerTube(videoId, client.name, client.version, client.headers)
    if (!pr) continue

    if (!titulo) titulo = getTitle(pr)

    // Tenta legendas
    const tracks = getCaptionTracks(pr)
    if (tracks.length > 0) {
      const texto = await captionTracksToText(tracks)
      if (texto) return { texto, titulo, tipo: 'transcricao' }
    }

    // Guarda áudio e descrição para fallbacks
    const audio = getAudioFormats(pr)
    if (audio.length > bestAudio.length) bestAudio = audio
    const desc = getDescription(pr)
    if (desc.length > bestDesc.length) bestDesc = desc
  }

  // 4. Whisper: para vídeos SEM qualquer legenda disponível
  // Transcreve diretamente do áudio — funciona para qualquer vídeo público
  if (bestAudio.length > 0) {
    const texto = await tryWhisper(bestAudio)
    if (texto) return { texto, titulo, tipo: 'transcricao' }
  }

  // 5. Fallback: descrição do vídeo
  if (bestDesc.length > 100) {
    return {
      texto: `Título: ${titulo}\n\nDescrição do vídeo:\n${bestDesc.slice(0, 4000)}`,
      titulo,
      tipo: 'descricao',
    }
  }

  return titulo ? { texto: `Título: ${titulo}`, titulo, tipo: 'descricao' } : null
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

  // ── YouTube ──
  if (plataforma === 'youtube') {
    const videoId = extractYouTubeId(url)
    if (!videoId) return NextResponse.json({ error: 'URL do YouTube inválida' }, { status: 400 })

    try {
      const resultado = await fetchYouTubeContent(videoId)

      if (resultado) {
        return NextResponse.json({
          plataforma,
          titulo: resultado.titulo,
          conteudo: resultado.texto,
          tipo: resultado.tipo,
          ...(resultado.tipo === 'descricao'
            ? { aviso: 'Sem legenda disponível — usando a descrição do vídeo como base.' }
            : {}),
        })
      }

      return NextResponse.json({
        plataforma,
        titulo: '',
        conteudo: '',
        tipo: 'sem_conteudo',
        aviso:
          'Não foi possível extrair o conteúdo deste vídeo. Cole o texto manualmente abaixo.',
      })
    } catch (err) {
      console.error('Erro YouTube:', err)
      return NextResponse.json({
        plataforma,
        titulo: '',
        conteudo: '',
        tipo: 'sem_conteudo',
        aviso: 'Erro ao processar o vídeo. Cole o conteúdo manualmente abaixo.',
      })
    }
  }

  // ── Artigo ──
  if (plataforma === 'artigo') {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IARABot/1.0)' },
      })
      const html = await res.text()
      const $ = cheerio.load(html)
      $(
        'script, style, nav, footer, header, aside, [class*="menu"], [class*="sidebar"], [class*="ad"], [class*="banner"]'
      ).remove()
      const titulo =
        $('h1').first().text().trim() || $('title').text().trim() || url
      const seletores = [
        'article',
        'main',
        '[class*="content"]',
        '[class*="article"]',
        '[class*="post"]',
        'body',
      ]
      let conteudo = ''
      for (const sel of seletores) {
        const texto = $(sel).first().text().replace(/\s+/g, ' ').trim()
        if (texto.length > 200) {
          conteudo = texto.slice(0, 6000)
          break
        }
      }
      return NextResponse.json({ plataforma, titulo, conteudo, tipo: 'artigo' })
    } catch {
      return NextResponse.json(
        { error: 'Não foi possível acessar essa URL' },
        { status: 400 }
      )
    }
  }

  // ── TikTok / Instagram ──
  return NextResponse.json({
    plataforma,
    titulo: url,
    conteudo: '',
    tipo: 'sem_suporte',
    aviso: `${plataforma === 'tiktok' ? 'TikTok' : 'Instagram'} não permite extração automática. Cole o texto manualmente abaixo.`,
  })
}
