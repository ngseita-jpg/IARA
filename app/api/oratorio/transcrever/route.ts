import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimitUser } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Transcrição de áudio via OpenAI Whisper.
 * Usado como fallback quando Web Speech API não está disponível
 * (iOS PWA, Firefox, Safari, etc).
 *
 * POST: multipart/form-data com `audio` (Blob)
 * Resposta: { transcript: string, duracao_segundos: number }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Mesmo bucket de IA — protege contra abuso
  const rl = await checkRateLimitUser(req, user.id, 'ia_geral')
  if (rl) return rl

  const key = process.env.OPENAI_API_KEY
  if (!key) return NextResponse.json({ error: 'OPENAI_API_KEY não configurada' }, { status: 500 })

  try {
    const formData = await req.formData()
    const audio = formData.get('audio')
    const duracaoStr = formData.get('duracao_segundos')

    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json({ error: 'Áudio não enviado' }, { status: 400 })
    }
    if (audio.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Áudio maior que 25MB. Grave por menos tempo.' }, { status: 400 })
    }
    if (audio.size < 1024) {
      return NextResponse.json({ error: 'Áudio muito curto. Fale por pelo menos alguns segundos.' }, { status: 400 })
    }

    // Repassa pra Whisper API
    const whisperForm = new FormData()
    // Whisper aceita webm/mp4/mp3/wav/m4a — usamos extensão da mime
    const mime = audio.type || 'audio/webm'
    const ext = mime.includes('mp4')  ? 'mp4'
              : mime.includes('mpeg') ? 'mp3'
              : mime.includes('wav')  ? 'wav'
              : mime.includes('m4a')  ? 'm4a'
              : 'webm'
    whisperForm.append('file', audio, `gravacao.${ext}`)
    whisperForm.append('model', 'whisper-1')
    whisperForm.append('language', 'pt')
    whisperForm.append('response_format', 'json')

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: whisperForm,
    })

    if (!whisperRes.ok) {
      const errBody = await whisperRes.text().catch(() => '')
      console.error('[oratorio/transcrever] Whisper falhou:', whisperRes.status, errBody.slice(0, 300))
      return NextResponse.json({
        error: 'Não consegui transcrever o áudio. Tenta gravar de novo.',
      }, { status: 502 })
    }

    const j = await whisperRes.json() as { text?: string }
    const transcript = (j.text ?? '').trim()
    if (!transcript || transcript.length < 5) {
      return NextResponse.json({
        error: 'Não captei nada do áudio. Verifica se o microfone tá funcionando e fale mais alto.',
      }, { status: 400 })
    }

    return NextResponse.json({
      transcript,
      duracao_segundos: duracaoStr ? Number(duracaoStr) : 0,
    })
  } catch (e) {
    console.error('[oratorio/transcrever] erro:', e instanceof Error ? e.message : 'erro')
    return NextResponse.json({
      error: 'Erro ao processar áudio. Tenta novamente.',
    }, { status: 500 })
  }
}
