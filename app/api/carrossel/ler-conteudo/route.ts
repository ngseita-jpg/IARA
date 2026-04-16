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

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL não informada' }, { status: 400 })

  const plataforma = detectPlatform(url)

  // YouTube — usa transcrição
  if (plataforma === 'youtube') {
    const videoId = extractYouTubeId(url)
    if (!videoId) return NextResponse.json({ error: 'URL do YouTube inválida' }, { status: 400 })

    try {
      const { YoutubeTranscript } = await import('youtube-transcript')
      const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt' })
        .catch(() => YoutubeTranscript.fetchTranscript(videoId))

      const transcricao = segments.map((s) => s.text).join(' ').replace(/\s+/g, ' ').trim().slice(0, 6000)

      let titulo = `Vídeo YouTube (${videoId})`
      try {
        const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
        if (r.ok) titulo = (await r.json()).title ?? titulo
      } catch { /* ok */ }

      return NextResponse.json({ plataforma, titulo, conteudo: transcricao, tipo: 'transcricao' })
    } catch {
      return NextResponse.json({ plataforma, titulo: url, conteudo: '', tipo: 'sem_transcricao', aviso: 'Não foi possível extrair transcrição deste vídeo.' })
    }
  }

  // Artigo — faz scraping do texto principal
  if (plataforma === 'artigo') {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IARABot/1.0)' } })
      const html = await res.text()
      const $ = cheerio.load(html)

      // Remove scripts, styles, nav, footer
      $('script, style, nav, footer, header, aside, [class*="menu"], [class*="sidebar"], [class*="ad"], [class*="banner"]').remove()

      const titulo = $('h1').first().text().trim() || $('title').text().trim() || url

      // Tenta extrair texto do artigo
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

  // TikTok / Instagram — não dá para extrair sem API oficial
  return NextResponse.json({
    plataforma,
    titulo: url,
    conteudo: '',
    tipo: 'sem_suporte',
    aviso: `${plataforma === 'tiktok' ? 'TikTok' : 'Instagram'} não permite extração automática de conteúdo. Cole o texto do vídeo manualmente.`,
  })
}
