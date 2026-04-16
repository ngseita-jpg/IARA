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

// Extrai transcrição diretamente da página do YouTube
async function fetchYouTubeTranscript(videoId: string): Promise<{ texto: string; titulo: string } | null> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  }

  // 1. Buscar a página do vídeo
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers })
  if (!pageRes.ok) return null
  const html = await pageRes.text()

  // 2. Extrair ytInitialPlayerResponse do HTML
  const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});(?:var|const|let|\s*<\/script>)/)
  if (!match) return null

  let playerResponse: Record<string, unknown>
  try {
    playerResponse = JSON.parse(match[1])
  } catch {
    return null
  }

  // 3. Extrair título do vídeo
  const titulo = (playerResponse?.videoDetails as Record<string, unknown>)?.title as string | undefined

  // 4. Encontrar as trilhas de legenda
  const captions = playerResponse?.captions as Record<string, unknown> | undefined
  const trackList = (captions?.playerCaptionsTracklistRenderer as Record<string, unknown>)?.captionTracks as Array<Record<string, unknown>> | undefined

  if (!trackList?.length) return null

  // 5. Priorizar: PT-BR → PT → qualquer idioma
  const track =
    trackList.find((t) => String(t.languageCode).toLowerCase().startsWith('pt')) ??
    trackList[0]

  const captionUrl = track?.baseUrl as string | undefined
  if (!captionUrl) return null

  // 6. Buscar o XML da legenda
  const captionRes = await fetch(captionUrl + '&fmt=json3', { headers })
  if (!captionRes.ok) {
    // fallback: tentar XML
    const xmlRes = await fetch(captionUrl, { headers })
    if (!xmlRes.ok) return null
    const xml = await xmlRes.text()
    const texto = xml
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)
    return { texto, titulo: titulo ?? `Vídeo ${videoId}` }
  }

  // 7. Parsear JSON3 format (mais limpo)
  const captionJson = await captionRes.json() as { events?: Array<{ segs?: Array<{ utf8?: string }> }> }
  const texto = (captionJson.events ?? [])
    .flatMap((e) => e.segs ?? [])
    .map((s) => s.utf8 ?? '')
    .join(' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000)

  if (!texto) return null

  return { texto, titulo: titulo ?? `Vídeo ${videoId}` }
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

      // Sem legenda disponível
      return NextResponse.json({
        plataforma,
        titulo: `Vídeo YouTube (${videoId})`,
        conteudo: '',
        tipo: 'sem_transcricao',
        aviso: 'Este vídeo não tem legenda/transcrição disponível. Cole o conteúdo do vídeo manualmente abaixo.',
      })
    } catch (err) {
      console.error('Erro transcrição YouTube:', err)
      return NextResponse.json({
        plataforma,
        titulo: `Vídeo YouTube (${videoId})`,
        conteudo: '',
        tipo: 'sem_transcricao',
        aviso: 'Não foi possível acessar a transcrição. Cole o conteúdo do vídeo manualmente abaixo.',
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
