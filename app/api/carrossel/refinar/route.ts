import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type RefinamentoResponse = {
  analise: string
  angulos: { titulo: string; descricao: string; emoji: string }[]
  perguntas: { pergunta: string; sugestoes: string[] }[]
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const conteudo = (body.conteudo as string ?? '').slice(0, 4000)
  const num_slides: number = body.num_slides ?? 6
  const modo: string = body.modo ?? 'criador'
  const plataforma: string = body.plataforma ?? 'instagram'
  const num_imagens: number = body.num_imagens ?? 0

  const plataformaLabel: Record<string, string> = {
    instagram: 'Instagram', linkedin: 'LinkedIn', tiktok: 'TikTok', pinterest: 'Pinterest',
  }

  const prompt = `Você é a Iara, estrategista de conteúdo. Um ${modo === 'marca' ? 'gestor de marca' : 'criador de conteúdo'} quer fazer um carrossel de ${num_slides} slides para ${plataformaLabel[plataforma] ?? plataforma}${num_imagens > 0 ? ` com ${num_imagens} foto(s) pessoais` : ''}.

Conteúdo base:
"""
${conteudo}
"""

Sua tarefa: analisar esse conteúdo e devolver um JSON com:

1. "analise": 1 frase direta resumindo o que você entendeu (ex: "Você quer ensinar X para Y que enfrenta Z")
2. "angulos": 3 abordagens editoriais diferentes para esse carrossel — cada uma com "titulo" (máx 5 palavras), "descricao" (1 frase mostrando o resultado esperado) e "emoji"
3. "perguntas": exatamente 2 perguntas específicas que, se respondidas, tornam o carrossel muito mais preciso. Cada pergunta tem "pergunta" (direta, 1 linha) e "sugestoes" (4 opções de resposta rápida, curtas)

As perguntas devem ser ESPECÍFICAS para esse conteúdo — não genéricas. Pense: o que eu não sei sobre esse conteúdo que mudaria completamente minha abordagem?

Retorne APENAS JSON, sem markdown:
{
  "analise": "...",
  "angulos": [
    {"emoji": "🎯", "titulo": "...", "descricao": "..."},
    {"emoji": "💡", "titulo": "...", "descricao": "..."},
    {"emoji": "🔥", "titulo": "...", "descricao": "..."}
  ],
  "perguntas": [
    {"pergunta": "...", "sugestoes": ["...", "...", "...", "..."]},
    {"pergunta": "...", "sugestoes": ["...", "...", "...", "..."]}
  ]
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const texto = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Erro ao analisar conteúdo' }, { status: 500 })

    const resultado: RefinamentoResponse = JSON.parse(jsonMatch[0])
    return NextResponse.json(resultado)
  } catch (err) {
    console.error('[refinar]', err)
    return NextResponse.json({ error: 'Erro ao refinar' }, { status: 500 })
  }
}
