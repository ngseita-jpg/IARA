/**
 * Pipeline de transcrição do YouTube — ESPELHA EXATAMENTE o que o carrossel
 * usa em /api/carrossel/ler-conteudo (que já funciona bem em produção).
 *
 * Diferença: cortes precisa de TIMESTAMPS por segmento pra identificar trechos.
 * Quando o pipeline retorna texto BRUTO (sem captions estruturados, ex:
 * Whisper retornando texto puro ou descrição do vídeo), distribuímos
 * timestamps proporcionalmente ao comprimento das frases.
 *
 * Isso garante que QUALQUER vídeo que o carrossel consegue ler, o cortes
 * também consegue gerar trechos — mesmo que com timestamps aproximados.
 */

type AudioFormat = { url?: string; mimeType?: string; bitrate?: number }

export type TranscriptSegment = {
  offset: number     // segundos
  duration: number   // segundos
  text: string
}

export type TranscriptResult = {
  segmentos: TranscriptSegment[]
  titulo: string
  fonte: 'youtube-transcript' | 'html-scrape' | 'innertube' | 'whisper' | 'descricao'
  tem_timestamps_reais: boolean   // false se foi distribuído proporcionalmente
}

const YT_HEADERS = {
  Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+294; VISITOR_INFO1_LIVE=; YSC=',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

// ─── 1. lib youtube-transcript ──────────────────────────────
async function tryYoutubeTranscript(videoId: string): Promise<string | null> {
  try {
    const { YoutubeTranscript } = await import('youtube-transcript')
    const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt' })
      .catch(() => YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt-BR' }))
      .catch(() => YoutubeTranscript.fetchTranscript(videoId))
    const texto = segments.map((s) => s.text).join(' ').replace(/\s+/g, ' ').trim()
    return texto.length > 50 ? texto.slice(0, 8000) : null
  } catch { return null }
}

// Variante: pega segmentos com timestamps reais (preferencial)
async function tryYoutubeTranscriptWithSegments(videoId: string): Promise<TranscriptSegment[] | null> {
  try {
    const { YoutubeTranscript } = await import('youtube-transcript')
    const raw = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt' })
      .catch(() => YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt-BR' }))
      .catch(() => YoutubeTranscript.fetchTranscript(videoId))
    if (!raw?.length) return null
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

// ─── 2. HTML scrape ──────────────────────────────────────────
async function tryYouTubePageScrape(videoId: string): Promise<Record<string, unknown> | null> {
  try {
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: YT_HEADERS,
      signal: ctrl.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    const html = await res.text()
    const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})(?:;|\s*<\/script>)/)
    if (!match) return null
    return JSON.parse(match[1]) as Record<string, unknown>
  } catch { return null }
}

// ─── 3. InnerTube ────────────────────────────────────────────
async function fetchInnerTube(
  videoId: string,
  clientName: string,
  clientVersion: string,
  extraHeaders: Record<string, string> = {},
): Promise<Record<string, unknown> | null> {
  try {
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch('https://www.youtube.com/youtubei/v1/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...YT_HEADERS, ...extraHeaders },
      body: JSON.stringify({
        context: { client: { clientName, clientVersion, hl: 'pt', gl: 'BR' } },
        videoId,
      }),
      signal: ctrl.signal,
    })
    clearTimeout(timeout)
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

function getDuration(pr: Record<string, unknown>) {
  const raw = ((pr?.videoDetails as Record<string, unknown>)?.lengthSeconds as string | undefined)
  return raw ? Number(raw) : 0
}

// Caption tracks → texto bruto (mesmo formato do carrossel)
async function captionTracksToText(
  tracks: Array<{ baseUrl: string; languageCode: string; kind?: string }>
): Promise<string | null> {
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

// Caption tracks → segmentos COM timestamps (preferencial pra cortes)
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
  } catch { /* tenta XML */ }

  try {
    const r = await fetch(track.baseUrl)
    if (r.ok) {
      const xml = await r.text()
      const re = /<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g
      const segs: TranscriptSegment[] = []
      let m: RegExpExecArray | null
      while ((m = re.exec(xml)) !== null) {
        const texto = m[3]
          .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
          .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
        if (texto) segs.push({ offset: Number(m[1]), duration: Number(m[2]), text: texto })
      }
      if (segs.length) return segs
    }
  } catch { /* falhou */ }

  return null
}

// ─── 4. Whisper API (texto puro, sem timestamps) ──────────────
async function tryWhisper(audioFormats: AudioFormat[]): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key || !audioFormats.length) return null

  const chosen = [...audioFormats].sort((a, b) => (a.bitrate ?? 999999) - (b.bitrate ?? 999999))[0]
  if (!chosen?.url) return null

  const ext = chosen.mimeType?.includes('webm') ? 'webm' : 'mp4'

  try {
    const audioRes = await fetch(chosen.url, { headers: { Range: 'bytes=0-6291456' } })
    if (!audioRes.ok) return null
    const audioBuffer = await audioRes.arrayBuffer()

    const form = new FormData()
    form.append('file', new Blob([audioBuffer], { type: chosen.mimeType ?? 'audio/mp4' }), `audio.${ext}`)
    form.append('model', 'whisper-1')
    form.append('language', 'pt')
    form.append('response_format', 'text')

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    })
    if (!whisperRes.ok) return null

    const texto = (await whisperRes.text()).trim()
    return texto.length > 50 ? texto.slice(0, 8000) : null
  } catch { return null }
}

// ─── DISTRIBUIR TIMESTAMPS PROPORCIONAIS ───────────────────────
// Quando temos só texto bruto sem timestamps reais, quebramos em sentenças
// e distribuímos o tempo proporcional ao comprimento. Não é perfeito mas
// permite a IA identificar trechos e o user pode ajustar manual depois.
function textoParaSegmentosProporcionais(
  texto: string,
  duracaoTotal: number,
): TranscriptSegment[] {
  // Quebra em sentenças por pontuação forte ou newline
  const sentencas = texto
    .split(/(?<=[.!?\n])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 2)

  if (sentencas.length === 0) {
    return [{ offset: 0, duration: duracaoTotal, text: texto }]
  }

  // Estima duração total se não veio: ~150 wpm → 2.5 palavras/segundo
  const dur = duracaoTotal > 0
    ? duracaoTotal
    : Math.max(60, Math.ceil(texto.split(/\s+/).length / 2.5))

  const totalChars = sentencas.reduce((a, s) => a + s.length, 0)
  let cursor = 0
  return sentencas.map(s => {
    const segDur = (s.length / totalChars) * dur
    const seg = { offset: cursor, duration: segDur, text: s }
    cursor += segDur
    return seg
  })
}

// ─── PIPELINE PRINCIPAL ────────────────────────────────────────
export async function fetchYouTubeTranscricao(videoId: string): Promise<TranscriptResult | null> {
  // Título via oEmbed
  let titulo = ''
  try {
    const oe = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    )
    if (oe.ok) titulo = ((await oe.json()) as { title?: string }).title ?? ''
  } catch { /* ignora */ }

  // 1a. youtube-transcript COM SEGMENTOS (preferencial — timestamps reais)
  const seg1 = await tryYoutubeTranscriptWithSegments(videoId)
  if (seg1?.length) return { segmentos: seg1, titulo, fonte: 'youtube-transcript', tem_timestamps_reais: true }

  // 1b. youtube-transcript com texto bruto (fallback se segments falhar)
  const text1 = await tryYoutubeTranscript(videoId)
  if (text1) {
    return {
      segmentos: textoParaSegmentosProporcionais(text1, 0),
      titulo,
      fonte: 'youtube-transcript',
      tem_timestamps_reais: false,
    }
  }

  // 2. HTML scrape — tenta extrair caption tracks
  const pageData = await tryYouTubePageScrape(videoId)
  let duracao = 0
  if (pageData) {
    if (!titulo) titulo = getTitle(pageData)
    duracao = getDuration(pageData)
    const tracks = getCaptionTracks(pageData)
    if (tracks.length) {
      // Tenta segments primeiro
      const segs = await captionTracksToSegments(tracks)
      if (segs?.length) return { segmentos: segs, titulo, fonte: 'html-scrape', tem_timestamps_reais: true }
      // Fallback: texto bruto
      const texto = await captionTracksToText(tracks)
      if (texto) return {
        segmentos: textoParaSegmentosProporcionais(texto, duracao),
        titulo,
        fonte: 'html-scrape',
        tem_timestamps_reais: false,
      }
    }
  }

  // 3. InnerTube — múltiplos clientes (mesma config do carrossel)
  const clients: Array<{ name: string; version: string; headers: Record<string, string> }> = [
    { name: 'IOS', version: '19.45.4', headers: {
      'User-Agent': 'com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 18_1 like Mac OS X)',
      'X-YouTube-Client-Name': '5', 'X-YouTube-Client-Version': '19.45.4' } },
    { name: 'TVHTML5', version: '7.20230105.08.01', headers: {
      'User-Agent': 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/6.0 TV Safari/538.1',
      'X-YouTube-Client-Name': '7', 'X-YouTube-Client-Version': '7.20230105.08.01' } },
    { name: 'ANDROID', version: '19.44.38', headers: {
      'User-Agent': 'com.google.android.youtube/19.44.38 (Linux; U; Android 14) gzip',
      'X-YouTube-Client-Name': '3', 'X-YouTube-Client-Version': '19.44.38' } },
    { name: 'WEB', version: '2.20241126.01.00', headers: {} },
  ]

  let melhorAudio: AudioFormat[] = []
  let melhorDesc = ''

  for (const c of clients) {
    const pr = await fetchInnerTube(videoId, c.name, c.version, c.headers)
    if (!pr) continue
    if (!titulo) titulo = getTitle(pr)
    if (!duracao) duracao = getDuration(pr)

    const tracks = getCaptionTracks(pr)
    if (tracks.length) {
      const segs = await captionTracksToSegments(tracks)
      if (segs?.length) return { segmentos: segs, titulo, fonte: 'innertube', tem_timestamps_reais: true }
      const texto = await captionTracksToText(tracks)
      if (texto) return {
        segmentos: textoParaSegmentosProporcionais(texto, duracao),
        titulo,
        fonte: 'innertube',
        tem_timestamps_reais: false,
      }
    }

    const audio = getAudioFormats(pr)
    if (audio.length > melhorAudio.length) melhorAudio = audio
    const desc = getDescription(pr)
    if (desc.length > melhorDesc.length) melhorDesc = desc
  }

  // 4. Whisper — para vídeos sem legenda nenhuma (mesmo do carrossel)
  if (melhorAudio.length > 0) {
    const texto = await tryWhisper(melhorAudio)
    if (texto) return {
      segmentos: textoParaSegmentosProporcionais(texto, duracao),
      titulo,
      fonte: 'whisper',
      tem_timestamps_reais: false,
    }
  }

  // 5. Fallback final — descrição do vídeo (igual carrossel)
  // Permite cortes "narrativos" baseados no que o vídeo é, mesmo sem transcrição
  if (melhorDesc.length > 100) {
    const conteudo = `Título: ${titulo}\n\n${melhorDesc.slice(0, 4000)}`
    return {
      segmentos: textoParaSegmentosProporcionais(conteudo, duracao || 600),
      titulo,
      fonte: 'descricao',
      tem_timestamps_reais: false,
    }
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
