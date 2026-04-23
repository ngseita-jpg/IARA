/**
 * Pipeline robusto de transcrição do YouTube com TIMESTAMPS por segmento.
 * Estratégias (mesmas do carrossel, adaptadas pra preservar offsets):
 *  1. youtube-transcript (lib npm, ~90% dos vídeos)
 *  2. Scrape do ytInitialPlayerResponse na página HTML
 *  3. InnerTube API com 3 clientes (TVHTML5, ANDROID, WEB)
 *  4. Whisper no áudio (verbose_json dá timestamps por palavra/segmento)
 *
 * Retorna segmentos {offset, duration, text} em SEGUNDOS.
 */

export type TranscriptSegment = {
  offset: number     // segundos
  duration: number   // segundos
  text: string
}

export type TranscriptResult = {
  segmentos: TranscriptSegment[]
  titulo: string
  fonte: 'youtube-transcript' | 'html-scrape' | 'innertube' | 'whisper'
}

const YT_HEADERS = {
  Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+294; VISITOR_INFO1_LIVE=; YSC=',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

// ─── Estratégia 1: lib youtube-transcript ───────────────────
async function tryYoutubeTranscriptLib(videoId: string): Promise<TranscriptSegment[] | null> {
  try {
    const { YoutubeTranscript } = await import('youtube-transcript')
    const raw = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt' })
      .catch(() => YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt-BR' }))
      .catch(() => YoutubeTranscript.fetchTranscript(videoId))

    if (!raw?.length) return null

    // A lib retorna offset em ms na versão nova e em s na antiga — normalizamos
    const precisaConverter = raw.some(r => r.offset > 10_000 || r.duration > 500)
    return raw
      .map(r => ({
        offset: precisaConverter ? r.offset / 1000 : r.offset,
        duration: precisaConverter ? r.duration / 1000 : r.duration,
        text: (r.text ?? '').replace(/\s+/g, ' ').trim(),
      }))
      .filter(s => s.text)
  } catch { return null }
}

// ─── Estratégia 2: scrape HTML ──────────────────────────────
async function tryHtmlScrape(videoId: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers: YT_HEADERS })
    if (!res.ok) return null
    const html = await res.text()
    const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})(?:;|\s*<\/script>)/)
    if (!match) return null
    return JSON.parse(match[1]) as Record<string, unknown>
  } catch { return null }
}

// ─── Estratégia 3: InnerTube ────────────────────────────────
async function fetchInnerTube(
  videoId: string,
  clientName: string,
  clientVersion: string,
  extraHeaders: Record<string, string> = {},
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...YT_HEADERS, ...extraHeaders },
      body: JSON.stringify({
        context: { client: { clientName, clientVersion, hl: 'pt', gl: 'BR' } },
        videoId,
      }),
    })
    if (!res.ok) return null
    return await res.json() as Record<string, unknown>
  } catch { return null }
}

function getCaptionTracks(pr: Record<string, unknown>) {
  return (((pr?.captions as Record<string, unknown>)
    ?.playerCaptionsTracklistRenderer as Record<string, unknown>)
    ?.captionTracks as Array<{ baseUrl: string; languageCode: string; kind?: string }> | undefined) ?? []
}

function getAudioFormats(pr: Record<string, unknown>) {
  const fmts = ((pr?.streamingData as Record<string, unknown>)?.adaptiveFormats as Array<{
    url?: string; mimeType?: string; bitrate?: number
  }> | undefined) ?? []
  return fmts.filter(f => f.url && f.mimeType?.includes('audio'))
}

function getTitle(pr: Record<string, unknown>) {
  return ((pr?.videoDetails as Record<string, unknown>)?.title as string | undefined) ?? ''
}

function getDuration(pr: Record<string, unknown>) {
  const raw = ((pr?.videoDetails as Record<string, unknown>)?.lengthSeconds as string | undefined)
  return raw ? Number(raw) : 0
}

// Decodifica legendas json3 (formato nativo do YT) — já vem com timestamps em ms
async function captionTracksToSegments(
  tracks: Array<{ baseUrl: string; languageCode: string; kind?: string }>,
): Promise<TranscriptSegment[] | null> {
  const track =
    tracks.find(t => t.languageCode === 'pt-BR') ??
    tracks.find(t => t.languageCode === 'pt') ??
    tracks.find(t => t.languageCode?.startsWith('pt')) ??
    tracks.find(t => t.kind === 'asr') ??
    tracks[0]

  if (!track?.baseUrl) return null

  // json3: mais rico (timestamps por segmento)
  try {
    const r = await fetch(track.baseUrl + '&fmt=json3')
    if (r.ok) {
      const j = await r.json() as { events?: Array<{ tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8?: string }> }> }
      const segs = (j.events ?? [])
        .filter(e => e.segs?.length && e.tStartMs !== undefined)
        .map(e => ({
          offset: (e.tStartMs ?? 0) / 1000,
          duration: (e.dDurationMs ?? 0) / 1000,
          text: (e.segs ?? []).map(s => s.utf8 ?? '').join('').replace(/\s+/g, ' ').trim(),
        }))
        .filter(s => s.text)
      if (segs.length) return segs
    }
  } catch { /* fallback pra XML */ }

  // XML: <text start="s" dur="s">conteúdo</text>
  try {
    const r = await fetch(track.baseUrl)
    if (r.ok) {
      const xml = await r.text()
      const re = /<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g
      const segs: TranscriptSegment[] = []
      let m: RegExpExecArray | null
      while ((m = re.exec(xml)) !== null) {
        const texto = decodeHtml(m[3]).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
        if (texto) segs.push({ offset: Number(m[1]), duration: Number(m[2]), text: texto })
      }
      if (segs.length) return segs
    }
  } catch { /* falhou */ }

  return null
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
}

// ─── Estratégia 4: Whisper (verbose_json → timestamps por segmento) ─────
async function tryWhisper(audioFormats: Array<{ url?: string; mimeType?: string; bitrate?: number }>, duracaoVideo: number): Promise<TranscriptSegment[] | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key || !audioFormats.length) return null

  const chosen = [...audioFormats].sort((a, b) => (a.bitrate ?? 999_999) - (b.bitrate ?? 999_999))[0]
  if (!chosen?.url) return null

  const ext = chosen.mimeType?.includes('webm') ? 'webm' : 'mp4'

  try {
    // Baixa até 20MB (~~ 20min de áudio low-bitrate) — suficiente pra vídeo típico
    const audioRes = await fetch(chosen.url, { headers: { Range: 'bytes=0-20971520' } })
    if (!audioRes.ok) return null
    const audioBuffer = await audioRes.arrayBuffer()

    const form = new FormData()
    form.append('file', new Blob([audioBuffer], { type: chosen.mimeType ?? 'audio/mp4' }), `audio.${ext}`)
    form.append('model', 'whisper-1')
    form.append('language', 'pt')
    form.append('response_format', 'verbose_json')
    form.append('timestamp_granularities[]', 'segment')

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    })

    if (!whisperRes.ok) return null

    const data = await whisperRes.json() as {
      segments?: Array<{ start?: number; end?: number; text?: string }>
      text?: string
    }

    if (data.segments?.length) {
      return data.segments
        .map(s => ({
          offset: s.start ?? 0,
          duration: (s.end ?? 0) - (s.start ?? 0),
          text: (s.text ?? '').trim(),
        }))
        .filter(s => s.text)
    }

    // Fallback: texto sem timestamps, aproxima proporcionalmente
    if (data.text) {
      const words = data.text.split(/\s+/)
      const CHUNK = 8 // 8 palavras por "segmento"
      const chunks: string[] = []
      for (let i = 0; i < words.length; i += CHUNK) chunks.push(words.slice(i, i + CHUNK).join(' '))
      const dur = duracaoVideo > 0 ? duracaoVideo / chunks.length : 3
      return chunks.map((t, i) => ({ offset: i * dur, duration: dur, text: t }))
    }

    return null
  } catch { return null }
}

// ─── Pipeline principal ────────────────────────────────────
export async function fetchYouTubeTranscricao(videoId: string): Promise<TranscriptResult | null> {
  // Título via oEmbed
  let titulo = ''
  try {
    const oe = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
    if (oe.ok) titulo = ((await oe.json()) as { title?: string }).title ?? ''
  } catch { /* ignora */ }

  // 1. youtube-transcript lib
  const seg1 = await tryYoutubeTranscriptLib(videoId)
  if (seg1?.length) return { segmentos: seg1, titulo, fonte: 'youtube-transcript' }

  // 2. HTML scrape
  const pageData = await tryHtmlScrape(videoId)
  if (pageData) {
    if (!titulo) titulo = getTitle(pageData)
    const tracks = getCaptionTracks(pageData)
    if (tracks.length) {
      const segs = await captionTracksToSegments(tracks)
      if (segs?.length) return { segmentos: segs, titulo, fonte: 'html-scrape' }
    }
  }

  // 3. InnerTube — múltiplos clientes
  const clients: Array<{ name: string; version: string; headers: Record<string, string> }> = [
    {
      name: 'TVHTML5', version: '7.20230105.08.01',
      headers: {
        'User-Agent': 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/6.0 TV Safari/538.1',
        'X-YouTube-Client-Name': '7', 'X-YouTube-Client-Version': '7.20230105.08.01',
      },
    },
    {
      name: 'ANDROID', version: '17.31.35',
      headers: {
        'User-Agent': 'com.google.android.youtube/17.31.35 (Linux; U; Android 11) gzip',
        'X-YouTube-Client-Name': '3', 'X-YouTube-Client-Version': '17.31.35',
      },
    },
    { name: 'WEB', version: '2.20231121.08.00', headers: {} },
  ]

  let melhorAudio: Array<{ url?: string; mimeType?: string; bitrate?: number }> = []
  let duracao = 0

  for (const c of clients) {
    const pr = await fetchInnerTube(videoId, c.name, c.version, c.headers)
    if (!pr) continue
    if (!titulo) titulo = getTitle(pr)
    if (!duracao) duracao = getDuration(pr)

    const tracks = getCaptionTracks(pr)
    if (tracks.length) {
      const segs = await captionTracksToSegments(tracks)
      if (segs?.length) return { segmentos: segs, titulo, fonte: 'innertube' }
    }

    const audio = getAudioFormats(pr)
    if (audio.length > melhorAudio.length) melhorAudio = audio
  }

  // Se o HTML scrape achou audio, usa também
  if (pageData && !melhorAudio.length) {
    const audio = getAudioFormats(pageData)
    if (audio.length) melhorAudio = audio
    if (!duracao) duracao = getDuration(pageData)
  }

  // 4. Whisper como último recurso
  if (melhorAudio.length) {
    const segs = await tryWhisper(melhorAudio, duracao)
    if (segs?.length) return { segmentos: segs, titulo, fonte: 'whisper' }
  }

  return null
}

export function extrairVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtube\.com\/live\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}
