import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as cheerio from 'cheerio'

// Aumenta o timeout da rota para 60s (necessário para transcrição de áudio)
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
type AudioFormat  = { url?: string; mimeType?: string; bitrate?: number; contentLength?: string }

// ─────────────────────────────────────────────────────────
// InnerTube: busca o player response do YouTube
// ─────────────────────────────────────────────────────────
async function fetchInnerTube(videoId: string, clientName: string, clientVersion: string, extraHeaders: Record<string, string> = {}): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(
      'https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'pt-BR,pt;q=0.9',
          ...extraHeaders,
        },
        body: JSON.stringify({
          context: { client: { clientName, clientVersion, hl: 'pt', gl: 'BR' } },
          videoId,
        }),
      }
    )
    if (!res.ok) return null
    return await res.json() as Record<string, unknown>
  } catch {
    return null
  }
}

function getCaptionTracks(pr: Record<string, unknown>): CaptionTrack[] {
  const tracks = ((pr?.captions as Record<string, unknown>)
    ?.playerCaptionsTracklistRenderer as Record<string, unknown>)
    ?.captionTracks as CaptionTrack[] | undefined
  return tracks ?? []
}

function getAudioFormats(pr: Record<string, unknown>): AudioFormat[] {
  const formats = ((pr?.streamingData as Record<string, unknown>)
    ?.adaptiveFormats as AudioFormat[] | undefined) ?? []
  return formats.filter((f) => f.url && f.mimeType?.includes('audio'))
}

function getVideoTitle(pr: Record<string, unknown>): string {
  return ((pr?.videoDetails as Record<string, unknown>)?.title as string | undefined) ?? ''
}

// ─────────────────────────────────────────────────────────
// Extrai legendas do player response
// ─────────────────────────────────────────────────────────
async function transcriptFromCaptions(tracks: CaptionTrack[]): Promise<string | null> {
  const track =
    tracks.find((t) => t.languageCode === 'pt-BR') ??
    tracks.find((t) => t.languageCode === 'pt') ??
    tracks.find((t) => t.languageCode?.startsWith('pt')) ??
    tracks.find((t) => t.kind === 'asr') ??
    tracks[0]

  if (!track?.baseUrl) return null

  // JSON3 (mais limpo)
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

  // XML fallback
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
// Transcrição de áudio via Groq Whisper (para vídeos sem legenda)
// ─────────────────────────────────────────────────────────
async function transcriptFromAudio(audioFormats: AudioFormat[]): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return null

  // Escolhe o formato de menor bitrate (menos dados para baixar)
  const sorted = audioFormats
    .filter((f) => f.url)
    .sort((a, b) => (a.bitrate ?? 999999) - (b.bitrate ?? 999999))

  const chosen = sorted[0]
  if (!chosen?.url) return null

  // Determina a extensão pelo mimeType
  const ext = chosen.mimeType?.includes('webm') ? 'webm' : 'mp4'

  // Baixa no máximo 6MB do áudio (≈ 10 min a 64kbps)
  let audioBuffer: ArrayBuffer
  try {
    const audioRes = await fetch(chosen.url, {
      headers: { Range: 'bytes=0-6291456' }, // 6MB
    })
    if (!audioRes.ok) return null
    audioBuffer = await audioRes.arrayBuffer()
  } catch {
    return null
  }

  // Envia ao Groq Whisper
  try {
    const blob = new Blob([audioBuffer], { type: chosen.mimeType ?? 'audio/mp4' })
    const form = new FormData()
    form.append('file', blob, `audio.${ext}`)
    form.append('model', 'whisper-large-v3-turbo')
    form.append('language', 'pt')
    form.append('response_format', 'text')

    const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}` },
      body: form,
    })

    if (!whisperRes.ok) {
      console.error('Groq Whisper error:', await whisperRes.text())
      return null
    }

    const texto = (await whisperRes.text()).trim()
    return texto.length > 50 ? texto.slice(0, 8000) : null
  } catch (err) {
    console.error('Erro Groq Whisper:', err)
    return null
  }
}

// ─────────────────────────────────────────────────────────
// Pipeline principal do YouTube
// ─────────────────────────────────────────────────────────
async function fetchYouTubeContent(videoId: string): Promise<{ texto: string; titulo: string } | null> {
  // Tenta 3 clientes em ordem de confiabilidade
  const clients = [
    { name: 'ANDROID', version: '17.31.35', headers: { 'User-Agent': 'com.google.android.youtube/17.31.35 (Linux; U; Android 11)', 'X-YouTube-Client-Name': '3', 'X-YouTube-Client-Version': '17.31.35' } as Record<string, string> },
    { name: 'WEB',     version: '2.20231121.08.00', headers: {} as Record<string, string> },
    { name: 'TVHTML5', version: '7.20230727.00.00', headers: {} as Record<string, string> },
  ]

  let bestPlayerResponse: Record<string, unknown> | null = null
  let bestAudioFormats: AudioFormat[] = []

  for (const client of clients) {
    const pr = await fetchInnerTube(videoId, client.name, client.version, client.headers)
    if (!pr) continue

    const tracks = getCaptionTracks(pr)
    if (tracks.length > 0) {
      // Tem legenda — usa diretamente
      const texto = await transcriptFromCaptions(tracks)
      if (texto) {
        return { texto, titulo: getVideoTitle(pr) || `Vídeo ${videoId}` }
      }
    }

    // Guarda formatos de áudio para fallback
    const audioFmts = getAudioFormats(pr)
    if (audioFmts.length > bestAudioFormats.length) {
      bestAudioFormats = audioFmts
      bestPlayerResponse = pr
    }
  }

  // Sem legenda — tenta transcrever via Groq Whisper
  if (bestAudioFormats.length > 0) {
    const titulo = bestPlayerResponse ? getVideoTitle(bestPlayerResponse) : `Vídeo ${videoId}`
    const texto = await transcriptFromAudio(bestAudioFormats)
    if (texto) return { texto, titulo: titulo || `Vídeo ${videoId}` }
  }

  return null
}

// ─────────────────────────────────────────────────────────
// Handler principal
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

      if (resultado?.texto) {
        return NextResponse.json({
          plataforma,
          titulo: resultado.titulo,
          conteudo: resultado.texto,
          tipo: 'transcricao',
        })
      }

      const semGroq = !process.env.GROQ_API_KEY
      return NextResponse.json({
        plataforma,
        titulo: `Vídeo YouTube (${videoId})`,
        conteudo: '',
        tipo: 'sem_transcricao',
        aviso: semGroq
          ? 'Configure a variável GROQ_API_KEY no Vercel para transcrever vídeos sem legenda.'
          : 'Não foi possível extrair o conteúdo deste vídeo. Cole o texto manualmente abaixo.',
      })
    } catch (err) {
      console.error('Erro YouTube:', err)
      return NextResponse.json({
        plataforma,
        titulo: `Vídeo YouTube (${videoId})`,
        conteudo: '',
        tipo: 'sem_transcricao',
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
