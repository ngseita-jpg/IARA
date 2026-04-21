import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type ImagemAnalise = {
  index: number
  descricao: string
  tem_rosto: boolean
  posicao_foco: 'topo' | 'centro' | 'base' | 'esquerda' | 'direita' | 'distribuido'
  mood: 'energetico' | 'calmo' | 'profissional' | 'casual' | 'inspirador' | 'emocional'
  arquetipos_recomendados: string[]
  arquetipos_evitar: string[]
  contexto_copy: string
}

function detectMediaType(b64: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  const clean = b64.replace(/^data:image\/[^;]+;base64,/, '')
  const h = clean.slice(0, 16)
  if (h.startsWith('/9j/'))    return 'image/jpeg'
  if (h.startsWith('iVBORw')) return 'image/png'
  if (h.startsWith('R0lGOD')) return 'image/gif'
  if (h.startsWith('UklGR'))  return 'image/webp'
  return 'image/jpeg'
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const imagens: string[] = body.imagens ?? []
  const modo: string = body.modo ?? 'criador'

  if (!imagens.length) return NextResponse.json({ analises: [] })

  // Apenas arquétipos que USAM foto (closing e brand_promo não usam)
  const arquetiposCriador = [
    'cover_full', 'split_v', 'top_text', 'full_bleed', 'quote',
    'editorial', 'cinematic', 'caption_bar', 'inset_photo',
    'warm_overlay', 'bold_type', 'side_right', 'neon_card',
  ]
  const arquetiposMarca = ['brand_cover', 'brand_story']
  const disponiveis = modo === 'marca' ? arquetiposMarca : arquetiposCriador

  const imageBlocks: Anthropic.ImageBlockParam[] = imagens.slice(0, 8).map((b64) => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: detectMediaType(b64),
      data: b64.replace(/^data:image\/[^;]+;base64,/, ''),
    },
  }))

  const prompt = `Você recebe ${imagens.length} imagem(ns) para um carrossel de ${modo === 'marca' ? 'marca' : 'criador de conteúdo'} brasileiro.

Analise cada imagem (índices 0 a ${imagens.length - 1}) e retorne um JSON array com objetos:

{
  "index": <número>,
  "descricao": "<o que aparece na imagem, breve>",
  "tem_rosto": <true|false>,
  "posicao_foco": "<topo|centro|base|esquerda|direita|distribuido>",
  "mood": "<energetico|calmo|profissional|casual|inspirador|emocional>",
  "arquetipos_recomendados": [<subset de: ${disponiveis.join(', ')}>],
  "arquetipos_evitar": [<layouts que colocariam texto sobre o rosto ou foco principal>],
  "contexto_copy": "<o que essa imagem comunica e que sensação ela transmite — será usado pela IA para escrever textos alinhados>"
}

Regras para arquetipos_evitar:
- Rosto no centro ou base → evite "cover_full", "full_bleed", "brand_cover" (scrim escuro na base cobre rosto)
- Rosto no topo → evite "top_text" e "caption_bar" (texto/fade no topo conflita com rosto)
- Foto muito escura ou com pouco contraste → evite "quote", "bold_type", "neon_card" (já têm overlay escuro)
- Foto vibrante/colorida que é o foco principal → evite "warm_overlay" (o tom âmbar muda a cor original)
- Rosto em close-up → PREFIRA "split_v", "side_right", "editorial", "inset_photo", "caption_bar" (foto ganha espaço sem texto sobreposto)
- Paisagem/ambiente → PREFIRA "cover_full", "full_bleed", "cinematic", "top_text" (dão espaço épico para a imagem)
- Foto minimalista/clean → PREFIRA "editorial", "inset_photo", "bold_type" (estética premium)

IMPORTANTE: varie as recomendações entre fotos diferentes. Não recomende os mesmos 2-3 arquétipos para todas as fotos — distribua entre as opções conforme o conteúdo de cada uma.

Retorne APENAS o JSON array, sem markdown.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          ...imageBlocks,
          { type: 'text', text: prompt },
        ],
      }],
    })

    const texto = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    const jsonMatch = texto.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ analises: [] })

    const analises: ImagemAnalise[] = JSON.parse(jsonMatch[0])
    return NextResponse.json({ analises })
  } catch (err) {
    console.error('[analisar-imagens]', err)
    return NextResponse.json({ analises: [] })
  }
}
