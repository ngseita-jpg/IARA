import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimitUser } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Edição de imagem com IA via OpenAI gpt-image-1.
 *
 * Recebe uma foto do user + prompt em PT-BR e devolve a foto modificada.
 * Casos de uso típicos:
 *  - "Remova o fundo, deixe transparente"
 *  - "Transforme em estilo cartoon ilustração"
 *  - "Deixe o céu azul e ensolarado"
 *  - "Apague a pessoa no canto direito"
 *
 * POST: multipart/form-data com:
 *   - image (Blob, PNG/JPG, ≤5MB)
 *   - prompt (string, ≥5 chars)
 *   - mask (Blob, opcional — PNG transparente nas áreas a editar)
 * Resposta: { imageBase64: 'data:image/png;base64,...' }
 *
 * Custo: ~$0.042/imagem (quality=medium, ~R$0.20).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const rl = await checkRateLimitUser(req, user.id, 'ia_geral')
  if (rl) return rl

  const key = process.env.OPENAI_API_KEY
  if (!key) return NextResponse.json({ error: 'OPENAI_API_KEY não configurada no servidor' }, { status: 500 })

  try {
    const formData = await req.formData()
    const image = formData.get('image')
    const prompt = String(formData.get('prompt') ?? '').trim()
    const mask = formData.get('mask')

    if (!image || !(image instanceof Blob)) {
      return NextResponse.json({ error: 'Imagem não enviada' }, { status: 400 })
    }
    if (!prompt || prompt.length < 5) {
      return NextResponse.json({ error: 'Descreva o que mudar (mínimo 5 caracteres)' }, { status: 400 })
    }
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem muito grande. Reduza pra menos de 5MB.' }, { status: 400 })
    }

    // OpenAI gpt-image-1 endpoint
    const openaiForm = new FormData()
    openaiForm.append('image', image, 'input.png')
    openaiForm.append('prompt', prompt)
    openaiForm.append('model', 'gpt-image-1')
    openaiForm.append('n', '1')
    openaiForm.append('size', '1024x1024')
    openaiForm.append('quality', 'medium')
    if (mask && mask instanceof Blob) {
      openaiForm.append('mask', mask, 'mask.png')
    }

    const resp = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: openaiForm,
    })

    if (!resp.ok) {
      const errBody = await resp.text().catch(() => '')
      console.error('[imagem/editar] OpenAI falhou:', resp.status, errBody.slice(0, 500))
      let mensagemUser = 'A IA não conseguiu editar essa imagem'
      if (resp.status === 400) mensagemUser = 'Prompt rejeitado pela IA (conteúdo não permitido ou imagem muito complexa)'
      if (resp.status === 429) mensagemUser = 'OpenAI sobrecarregada. Tenta de novo em 30s.'
      if (resp.status >= 500) mensagemUser = 'OpenAI com problema. Tenta de novo em 1min.'
      return NextResponse.json({
        error: mensagemUser,
        detalhe: errBody.slice(0, 200),
      }, { status: 502 })
    }

    const j = await resp.json() as { data?: Array<{ b64_json?: string }> }
    const b64 = j.data?.[0]?.b64_json
    if (!b64) {
      console.error('[imagem/editar] resposta inesperada da OpenAI:', JSON.stringify(j).slice(0, 300))
      return NextResponse.json({ error: 'OpenAI retornou resposta inesperada' }, { status: 502 })
    }

    return NextResponse.json({ imageBase64: `data:image/png;base64,${b64}` })
  } catch (e) {
    console.error('[imagem/editar] erro:', e instanceof Error ? e.message : 'erro', e instanceof Error ? e.stack : '')
    return NextResponse.json({
      error: 'Erro ao processar edição. Tenta novamente.',
    }, { status: 500 })
  }
}
