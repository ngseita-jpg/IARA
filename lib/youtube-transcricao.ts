/**
 * Pipeline de transcrição do YouTube — projetado pra cobrir ~99% dos vídeos
 * públicos. Cada etapa loga `[yt-transcricao]` no console pra debug Vercel.
 *
 * Ordem de tentativas:
 *  0. timedtext direto (endpoint público, sem scraping)
 *  1. youtube-transcript lib (com timestamps reais)
 *  2. HTML scrape → captions (com auto-translate pt se só houver outro idioma)
 *  3. InnerTube com 6 clientes diferentes (cada um bypassa restrição diferente)
 *  4. Whisper API no áudio (15MB range, múltiplos formatos)
 *  5. Descrição do vídeo (gera cortes narrativos)
 */

type AudioFormat = { url?: string; mimeType?: string; bitrate?: number; contentLength?: string }

export type TranscriptSegment = {
  offset: number     // segundos
  duration: number   // segundos
  text: string
}

export type TranscriptResult = {
  segmentos: TranscriptSegment[]
  titulo: string
  fonte: 'timedtext' | 'youtube-transcript' | 'html-scrape' | 'innertube' | 'whisper' | 'descricao'
  tem_timestamps_reais: boolean
}

const YT_HEADERS = {
  Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+294; VISITOR_INFO1_LIVE=; YSC=',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

const log = (etapa: string, msg: string) => console.log(`[yt-transcricao] ${etapa}: ${msg}`)

// ─── 0. TIMEDTEXT DIRETO ─────────────────────────────────────
// Endpoint público do YouTube, não depende de scraping. Tentamos:
// pt-BR → pt → en com tlang=pt → primeira lang com tlang=pt → asr (auto-gerado)
async function tryDirectTimedText(videoId: string): Promise<TranscriptSegment[] | null> {
  const tentativas: string[] = [
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=pt-BR&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=pt&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=pt-BR&kind=asr&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=pt&kind=asr&fmt=json3`,
    // Auto-traduz inglês pra PT
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&tlang=pt&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr&tlang=pt&fmt=json3`,
    // Espanhol traduzido
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=es&tlang=pt&fmt=json3`,
  ]

  for (const url of tentativas) {
    try {
      const ctrl = new AbortController()
      const timeout = setTimeout(() => ctrl.abort(), 5000)
      const r = await fetch(url, { headers: YT_HEADERS, signal: ctrl.signal })
      clearTimeout(timeout)
      if (!r.ok) continue
      const txt = await r.text()
      if (!txt || txt.length < 30) continue
      const j = JSON.parse(txt) as { events?: Array<{ tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8?: string }> }> }
      const segs = (j.events ?? [])
        .filter(e => e.segs?.length && e.tStartMs !== undefined)
        .map(e => ({
          offset: (e.tStartMs ?? 0) / 1000,
          duration: (e.dDurationMs ?? 0) / 1000,
          text: (e.segs ?? []).map(s => s.utf8 ?? '').join('').replace(/\s+/g, ' ').trim(),
        }))
        .filter(s => s.text)
      if (segs.length >= 3) {
        log('timedtext-direto', `OK ${url.split('lang=')[1]?.split('&')[0]}, ${segs.length} segs`)
        return segs
      }
    } catch { /* tenta próxima */ }
  }
  return null
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
  extraContext: Record<string, unknown> = {},
): Promise<Record<string, unknown> | null> {
  try {
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...YT_HEADERS, ...extraHeaders },
      body: JSON.stringify({
        context: {
          client: { clientName, clientVersion, hl: 'pt', gl: 'BR', ...extraContext },
        },
        videoId,
        contentCheckOk: true,
        racyCheckOk: true,
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

// Caption tracks → texto bruto
async function captionTracksToText(
  tracks: Array<{ baseUrl: string; languageCode: string; kind?: string }>
): Promise<string | null> {
  const ordenados = ordenarTracks(tracks)
  for (const track of ordenados) {
    const urlBase = precisaTraduzir(track) ? track.baseUrl + '&tlang=pt' : track.baseUrl
    try {
      const r = await fetch(urlBase + '&fmt=json3')
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
      const r = await fetch(urlBase)
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
    } catch { /* próxima track */ }
  }
  return null
}

// Caption tracks → segmentos COM timestamps (preferencial pra cortes)
async function captionTracksToSegments(
  tracks: Array<{ baseUrl: string; languageCode: string; kind?: string }>,
): Promise<TranscriptSegment[] | null> {
  const ordenados = ordenarTracks(tracks)

  for (const track of ordenados) {
    const urlBase = precisaTraduzir(track) ? track.baseUrl + '&tlang=pt' : track.baseUrl
    try {
      const r = await fetch(urlBase + '&fmt=json3')
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
        if (segs.length >= 3) return segs
      }
    } catch { /* tenta XML */ }

    try {
      const r = await fetch(urlBase)
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
        if (segs.length >= 3) return segs
      }
    } catch { /* próxima track */ }
  }
  return null
}

// Prioriza pt, depois pt-*, depois inglês (vai ser auto-traduzido), depois qualquer
function ordenarTracks(tracks: Array<{ baseUrl: string; languageCode: string; kind?: string }>) {
  return [...tracks].sort((a, b) => prioridadeLang(a) - prioridadeLang(b))
}

function prioridadeLang(t: { languageCode: string; kind?: string }) {
  if (t.languageCode === 'pt-BR') return 0
  if (t.languageCode === 'pt') return 1
  if (t.languageCode?.startsWith('pt')) return 2
  if (t.languageCode === 'en') return 3
  if (t.languageCode === 'en-US') return 3
  if (t.languageCode?.startsWith('en')) return 4
  if (t.languageCode === 'es') return 5
  return 6
}

function precisaTraduzir(t: { languageCode: string }) {
  return !t.languageCode?.startsWith('pt')
}

// ─── 4. Whisper API ──────────────────────────────────────────
async function tryWhisper(audioFormats: AudioFormat[]): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key || !audioFormats.length) return null

  // Tenta os 2 formatos de menor bitrate (maior chance de caber em 15MB)
  const candidatos = [...audioFormats]
    .sort((a, b) => (a.bitrate ?? 999999) - (b.bitrate ?? 999999))
    .slice(0, 2)

  for (const chosen of candidatos) {
    if (!chosen?.url) continue
    const ext = chosen.mimeType?.includes('webm') ? 'webm' : 'mp4'

    try {
      // 15MB cobre ~25min de áudio em 64kbps
      const audioRes = await fetch(chosen.url, { headers: { Range: 'bytes=0-15728640' } })
      if (!audioRes.ok) continue
      const audioBuffer = await audioRes.arrayBuffer()
      if (audioBuffer.byteLength < 10_000) continue // áudio inválido

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
      if (!whisperRes.ok) continue

      const texto = (await whisperRes.text()).trim()
      if (texto.length > 50) return texto.slice(0, 8000)
    } catch { /* próximo formato */ }
  }
  return null
}

// ─── DISTRIBUIR TIMESTAMPS PROPORCIONAIS ───────────────────────
function textoParaSegmentosProporcionais(
  texto: string,
  duracaoTotal: number,
): TranscriptSegment[] {
  const sentencas = texto
    .split(/(?<=[.!?\n])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 2)

  if (sentencas.length === 0) {
    return [{ offset: 0, duration: duracaoTotal || 60, text: texto }]
  }

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
  log('inicio', `videoId=${videoId}`)

  // Título via oEmbed (paralelo, não bloqueia)
  let titulo = ''
  const tituloPromise = (async () => {
    try {
      const oe = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      )
      if (oe.ok) titulo = ((await oe.json()) as { title?: string }).title ?? ''
    } catch { /* ignora */ }
  })()

  // 0. timedtext direto — caminho mais rápido e sem scraping
  const seg0 = await tryDirectTimedText(videoId)
  if (seg0?.length) {
    await tituloPromise
    return { segmentos: seg0, titulo, fonte: 'timedtext', tem_timestamps_reais: true }
  }
  log('timedtext-direto', 'falhou')

  // 1a. youtube-transcript COM SEGMENTOS
  const seg1 = await tryYoutubeTranscriptWithSegments(videoId)
  if (seg1?.length) {
    await tituloPromise
    log('youtube-transcript-segments', `OK ${seg1.length} segs`)
    return { segmentos: seg1, titulo, fonte: 'youtube-transcript', tem_timestamps_reais: true }
  }

  // 1b. youtube-transcript com texto bruto
  const text1 = await tryYoutubeTranscript(videoId)
  if (text1) {
    await tituloPromise
    log('youtube-transcript-texto', `OK ${text1.length} chars`)
    return {
      segmentos: textoParaSegmentosProporcionais(text1, 0),
      titulo,
      fonte: 'youtube-transcript',
      tem_timestamps_reais: false,
    }
  }
  log('youtube-transcript', 'falhou')

  // 2. HTML scrape — tenta extrair caption tracks
  const pageData = await tryYouTubePageScrape(videoId)
  let duracao = 0
  if (pageData) {
    if (!titulo) titulo = getTitle(pageData)
    duracao = getDuration(pageData)
    const tracks = getCaptionTracks(pageData)
    if (tracks.length) {
      const segs = await captionTracksToSegments(tracks)
      if (segs?.length) {
        log('html-scrape-segments', `OK ${segs.length} segs (${tracks.length} tracks)`)
        return { segmentos: segs, titulo, fonte: 'html-scrape', tem_timestamps_reais: true }
      }
      const texto = await captionTracksToText(tracks)
      if (texto) {
        log('html-scrape-texto', `OK ${texto.length} chars`)
        return {
          segmentos: textoParaSegmentosProporcionais(texto, duracao),
          titulo,
          fonte: 'html-scrape',
          tem_timestamps_reais: false,
        }
      }
    }
    log('html-scrape', `sem captions úteis (${tracks.length} tracks tentadas)`)
  } else {
    log('html-scrape', 'falhou no fetch')
  }

  // 3. InnerTube — 6 clientes. Cada um bypassa restrição diferente
  const clients: Array<{ name: string; version: string; headers: Record<string, string>; context?: Record<string, unknown> }> = [
    // iOS — geralmente o mais permissivo
    { name: 'IOS', version: '19.45.4', headers: {
      'User-Agent': 'com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 18_1 like Mac OS X)',
      'X-YouTube-Client-Name': '5', 'X-YouTube-Client-Version': '19.45.4' } },
    // TVHTML5_SIMPLY_EMBEDDED_PLAYER — bypassa age-gate e region-lock
    { name: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', version: '2.0', headers: {
      'X-YouTube-Client-Name': '85', 'X-YouTube-Client-Version': '2.0' } },
    // Android VR — funciona em vídeos privados/restritos
    { name: 'ANDROID_VR', version: '1.57.29', headers: {
      'User-Agent': 'com.google.android.apps.youtube.vr.oculus/1.57.29 (Linux; U; Android 12; GB) gzip',
      'X-YouTube-Client-Name': '28', 'X-YouTube-Client-Version': '1.57.29' } },
    // TVHTML5
    { name: 'TVHTML5', version: '7.20230105.08.01', headers: {
      'User-Agent': 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/6.0 TV Safari/538.1',
      'X-YouTube-Client-Name': '7', 'X-YouTube-Client-Version': '7.20230105.08.01' } },
    // Android padrão
    { name: 'ANDROID', version: '19.44.38', headers: {
      'User-Agent': 'com.google.android.youtube/19.44.38 (Linux; U; Android 14) gzip',
      'X-YouTube-Client-Name': '3', 'X-YouTube-Client-Version': '19.44.38' } },
    // MWEB — versão mobile do site, às vezes funciona quando outras falham
    { name: 'MWEB', version: '2.20241126.01.00', headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'X-YouTube-Client-Name': '2', 'X-YouTube-Client-Version': '2.20241126.01.00' } },
  ]

  let melhorAudio: AudioFormat[] = []
  let melhorDesc = ''

  for (const c of clients) {
    const pr = await fetchInnerTube(videoId, c.name, c.version, c.headers, c.context)
    if (!pr) { log('innertube', `${c.name} sem resposta`); continue }
    if (!titulo) titulo = getTitle(pr)
    if (!duracao) duracao = getDuration(pr)

    const tracks = getCaptionTracks(pr)
    if (tracks.length) {
      const segs = await captionTracksToSegments(tracks)
      if (segs?.length) {
        log('innertube-segments', `${c.name} OK ${segs.length} segs`)
        return { segmentos: segs, titulo, fonte: 'innertube', tem_timestamps_reais: true }
      }
      const texto = await captionTracksToText(tracks)
      if (texto) {
        log('innertube-texto', `${c.name} OK ${texto.length} chars`)
        return {
          segmentos: textoParaSegmentosProporcionais(texto, duracao),
          titulo,
          fonte: 'innertube',
          tem_timestamps_reais: false,
        }
      }
    }

    const audio = getAudioFormats(pr)
    if (audio.length > melhorAudio.length) melhorAudio = audio
    const desc = getDescription(pr)
    if (desc.length > melhorDesc.length) melhorDesc = desc
  }
  log('innertube', `falhou em todos clientes — coletou ${melhorAudio.length} audios e desc=${melhorDesc.length}`)

  // 4. Whisper
  if (melhorAudio.length > 0) {
    const texto = await tryWhisper(melhorAudio)
    if (texto) {
      log('whisper', `OK ${texto.length} chars`)
      return {
        segmentos: textoParaSegmentosProporcionais(texto, duracao),
        titulo,
        fonte: 'whisper',
        tem_timestamps_reais: false,
      }
    }
    log('whisper', 'falhou')
  }

  // 5. Descrição
  if (melhorDesc.length > 100) {
    log('descricao', `OK ${melhorDesc.length} chars`)
    const conteudo = `Título: ${titulo}\n\n${melhorDesc.slice(0, 4000)}`
    return {
      segmentos: textoParaSegmentosProporcionais(conteudo, duracao || 600),
      titulo,
      fonte: 'descricao',
      tem_timestamps_reais: false,
    }
  }

  log('FALHA-TOTAL', `videoId=${videoId} todas as fontes falharam`)
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
