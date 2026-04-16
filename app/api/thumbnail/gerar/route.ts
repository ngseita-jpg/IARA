import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type ThumbnailLayout = {
  titulo_principal: string
  subtitulo?: string
  estilo_fundo: 'foto' | 'gradiente' | 'cor_solida'
  cor_primaria: string
  cor_secundaria: string
  cor_texto: string
  cor_fundo_texto?: string
  posicao_texto: 'centro' | 'topo' | 'base' | 'esquerda' | 'direita'
  tamanho_titulo: 'pequeno' | 'medio' | 'grande' | 'gigante'
  estilo_titulo: 'normal' | 'destaque' | 'sombra' | 'caixa'
  emoji?: string
  badge?: string  // ex: "NOVO", "GRÁTIS", número
  raciocinio: string
}

function buildSystemPrompt(perfil: Record<string, unknown> | null): string {
  return `Você é a Iara, especialista em thumbnails de alta conversão para criadores de conteúdo brasileiros.

Você analisa o conteúdo do vídeo e cria thumbnails estratégicas que maximizam o CTR (click-through rate).

## Princípios de thumbnail de alto CTR
- Título curto, impactante, máximo 5-6 palavras
- Contraste alto entre texto e fundo
- Uma emoção clara (curiosidade, surpresa, urgência, benefício)
- Evite textos longos — o viewer lê em menos de 1 segundo
- Badge chama atenção imediata (número, "NOVO", emoji grande)
- Posicione texto onde não cobre rostos ou elementos centrais

## Perfil do criador
${perfil ? `Nome: ${perfil.nome_artistico ?? 'não informado'}
Nicho: ${perfil.nicho ?? 'não informado'}
Tom de voz: ${perfil.tom_de_voz ?? 'não informado'}` : 'Perfil não configurado — use estilo chamativo e direto.'}

## Formato de saída (JSON puro, sem markdown)
{
  "titulo_principal": "TÍTULO CURTO E IMPACTANTE",
  "subtitulo": "complemento opcional curto",
  "estilo_fundo": "foto",
  "cor_primaria": "#6B5FD0",
  "cor_secundaria": "#C9A84C",
  "cor_texto": "#ffffff",
  "cor_fundo_texto": "rgba(0,0,0,0.7)",
  "posicao_texto": "base",
  "tamanho_titulo": "gigante",
  "estilo_titulo": "destaque",
  "emoji": "🔥",
  "badge": "3 DICAS",
  "raciocinio": "explique brevemente por que essas escolhas maximizam o CTR"
}`
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { titulo_video, descricao, imagem_base64, historico } = await req.json()

  const { data: perfil } = await supabase
    .from('creator_profiles')
    .select('nome_artistico, nicho, tom_de_voz')
    .eq('user_id', user.id)
    .single()

  const userMsg = `Crie um layout de thumbnail para o seguinte vídeo:

Título: ${titulo_video || 'Não informado'}
Descrição/Contexto: ${descricao || 'Não informado'}

${imagem_base64 ? 'Uma foto foi fornecida para usar como fundo da thumbnail.' : 'Nenhuma foto foi fornecida — use fundo com gradiente de cores.'}

Retorne APENAS o JSON, sem nenhum texto antes ou depois.`

  const messages: Anthropic.MessageParam[] = historico?.length
    ? [...historico, { role: 'user' as const, content: userMsg }]
    : [{ role: 'user' as const, content: userMsg }]

  // Se tiver imagem, adicionar como vision
  if (imagem_base64 && !historico?.length) {
    messages[messages.length - 1] = {
      role: 'user',
      content: [
        { type: 'text', text: userMsg },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: imagem_base64.replace(/^data:image\/\w+;base64,/, ''),
          },
        },
      ],
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1000,
      system: buildSystemPrompt(perfil as Record<string, unknown> | null),
      messages,
    })

    const texto = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'IA não retornou JSON válido' }, { status: 500 })

    const layout: ThumbnailLayout = JSON.parse(jsonMatch[0])

    return NextResponse.json({ layout, assistant_message: texto })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao gerar thumbnail' }, { status: 500 })
  }
}
