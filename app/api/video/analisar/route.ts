import { YoutubeTranscript } from 'youtube-transcript'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

function detectPlatform(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('instagram.com')) return 'instagram'
  return 'outro'
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL não informada' }, { status: 400 })

  const plataforma = detectPlatform(url)

  if (plataforma !== 'youtube') {
    // Para outras plataformas não temos como puxar transcrição automaticamente
    return NextResponse.json({
      url,
      plataforma,
      titulo: url,
      transcricao: null,
      aviso: 'Transcrição automática disponível apenas para YouTube. O link foi salvo como referência.',
    })
  }

  const videoId = extractYouTubeId(url)
  if (!videoId) {
    return NextResponse.json({ error: 'URL do YouTube inválida' }, { status: 400 })
  }

  try {
    // Buscar transcrição
    const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt' })
      .catch(() => YoutubeTranscript.fetchTranscript(videoId)) // fallback para qualquer idioma

    const transcricao = segments
      .map((s) => s.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000) // limitar tamanho

    // Tentar buscar título via oEmbed (não precisa de API key)
    let titulo = `Vídeo YouTube (${videoId})`
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      )
      if (oembedRes.ok) {
        const oembed = await oembedRes.json()
        titulo = oembed.title ?? titulo
      }
    } catch { /* título fica como fallback */ }

    return NextResponse.json({
      url,
      videoId,
      plataforma,
      titulo,
      transcricao,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    })
  } catch {
    return NextResponse.json({
      url,
      videoId,
      plataforma,
      titulo: `Vídeo YouTube (${videoId})`,
      transcricao: null,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      aviso: 'Não foi possível extrair a transcrição (legendas desativadas ou vídeo privado). O vídeo foi salvo como referência.',
    })
  }
}
