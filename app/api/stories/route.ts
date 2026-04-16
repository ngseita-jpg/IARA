import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface StorySlide {
  numero: number
  tipo: 'hook' | 'desenvolvimento' | 'virada' | 'cta' | 'encerramento'
  texto_principal: string
  texto_secundario?: string
  emoji: string
  cor_fundo: string
  cor_texto: string
  dica_visual: string
  duracao: number
}

const TIPOS_STORY: Record<string, string> = {
  educativo:    'Sequência educativa — ensina algo valioso passo a passo',
  bastidores:   'Bastidores — processo criativo, dia a dia, vida real',
  lancamento:   'Lançamento / Promoção — anuncia produto, serviço ou novidade',
  engajamento:  'Engajamento — enquete, pergunta, interação com audiência',
  hot_take:     'Hot take / Opinião — posicionamento, tendência, polêmica do nicho',
  motivacional: 'Motivacional — história pessoal, frase de impacto, transformação',
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const { tema, tipo, contexto } = await req.json()

  if (!tema?.trim()) {
    return new Response(JSON.stringify({ error: 'Tema é obrigatório' }), { status: 400 })
  }

  // Buscar perfil do criador
  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('nome_artistico, nicho, tom_de_voz, plataformas, objetivo, sobre, voz_perfil')
    .eq('user_id', user.id)
    .single()

  const perfilContexto = profile ? `
PERFIL DO CRIADOR:
- Nome/Marca: ${profile.nome_artistico ?? 'não informado'}
- Nicho: ${profile.nicho ?? 'não informado'}
- Tom de voz: ${profile.tom_de_voz ?? 'não informado'}
- Objetivo: ${profile.objetivo ?? 'não informado'}
- Sobre: ${profile.sobre ?? 'não informado'}
${profile.voz_perfil ? `- Personalidade vocal: ${profile.voz_perfil}` : ''}
` : ''

  const tipoDescricao = TIPOS_STORY[tipo] ?? tipo

  const prompt = `Você é especialista em criação de conteúdo para Instagram Stories e domina o que funciona para criadores brasileiros.
${perfilContexto}
PEDIDO:
- Tipo de sequência: ${tipoDescricao}
- Tema principal: ${tema}
${contexto ? `- Contexto adicional: ${contexto}` : ''}

Crie uma sequência de stories PERSONALIZADA para esse criador. O texto deve soar exatamente como ele fala — não genérico, não robótico. Use o tom de voz, nicho e personalidade dele.

REGRAS DOS SLIDES:
- Slide 1 (hook): DEVE parar o dedo. Frase curta, impactante, cria curiosidade ou urgência. Max 10 palavras no texto principal.
- Slides 2-4 (desenvolvimento): conteúdo real, entrega valor ou conta a história. Max 20 palavras por slide.
- Slide 5 (virada): o ponto que muda tudo — insight, revelação, contraste. Max 15 palavras.
- Slide 6 (cta): ação clara — responde, salva, compartilha, arrasta. Max 12 palavras.
- Slide 7 (encerramento): fecha com personalidade. Pode ter humor, gratidão ou próximo passo. Max 10 palavras.

Para as cores, use paletas que combinam com o nicho:
- Fitness/Saúde: tons de verde escuro, laranja vibrante
- Finanças: azul marinho, dourado
- Lifestyle: roxo, rosa, bege quente
- Tech: azul elétrico, cinza escuro
- Gastronomia: vermelho, terracota, bege
- Beleza/Moda: rosa, nude, preto
- Padrão (sem nicho): roxo escuro #1a0a2e, branco #f1f1f8

Retorne SOMENTE JSON válido (sem markdown, sem texto extra):

{
  "slides": [
    {
      "numero": 1,
      "tipo": "hook",
      "texto_principal": "...",
      "texto_secundario": "...",
      "emoji": "🔥",
      "cor_fundo": "#hex",
      "cor_texto": "#hex",
      "dica_visual": "Como montar esse slide no app (fonte, posição, sticker sugerido)",
      "duracao": 7
    }
  ],
  "dica_geral": "Uma dica estratégica sobre essa sequência — quando postar, como usar o link, etc."
}`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extrair JSON (às vezes o modelo pode colocar markdown)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON não encontrado na resposta')

    const parsed = JSON.parse(jsonMatch[0])

    return new Response(
      JSON.stringify({ slides: parsed.slides, dica_geral: parsed.dica_geral }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Erro ao gerar stories:', err)
    return new Response(JSON.stringify({ error: 'Erro ao gerar stories' }), { status: 500 })
  }
}
