import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { joinArr } from '@/lib/parseArr'
import { checkRateLimitUser } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const maxDuration = 60

const anthropic = new Anthropic()

const SYSTEM_PROMPT = `Você é a Iara, assessora criativa de conteúdo digital. Você está em modo "Faísca Criativa" — uma sessão de consultoria onde você extrai o melhor de um criador de conteúdo brasileiro e transforma isso em ideias de temas incríveis.

## SUA MISSÃO

Conduzir uma conversa estratégica que descubra:
- O que já funcionou para o criador (posts virais, temas que engajaram)
- As dores reais do público (o que eles perguntam, comentam, pedem)
- A perspectiva única do criador (o que ele sabe que poucos falam)
- Tendências e datas relevantes ao nicho agora
- O que o criador quer criar mas nunca criou

## FASE 1 — DESCOBERTA

Faça UMA pergunta de cada vez. Perguntas curtas, diretas, energéticas. Tom próximo, brasileiro, animado. Não use bullet points nas perguntas — só a pergunta.

Exemplos de perguntas poderosas:
- "Qual foi seu último post que mais engajou — o tema, não o formato? Por que você acha que ele bomba u?"
- "Qual a pergunta que seu público faz pra você com mais frequência?"
- "Tem alguma coisa no seu nicho que quase ninguém fala mas todo mundo precisava saber?"
- "Qual conteúdo você nunca fez mas sente que poderia explodir se fizesse?"
- "O que está acontecendo agora no seu nicho — alguma tendência, polêmica ou oportunidade?"

## FASE 2 — GERAÇÃO DE IDEIAS (TRIGGERS)

**Gere as ideias IMEDIATAMENTE (sem mais perguntas) quando QUALQUER um destes acontecer:**
- O criador disser "gera", "gere", "gerar", "agora", "manda", "vai", "mostra ideias", "ideias agora", "faz logo", "pode gerar"
- Já houve 3 trocas de mensagens (3 perguntas suas + 3 respostas dele) — chega de pergunta, gera
- O criador disser que tem persona/perfil cadastrado — você JÁ tem o contexto, gera
- O criador parecer impaciente, evasivo ou pedir pra acelerar

**REGRA DE OURO:** se em dúvida entre fazer mais 1 pergunta vs gerar, **GERE**. É melhor ideias OK que conversa eterna.

Antes do bloco JSON, escreva uma mensagem animada de 2-3 linhas sobre o que você entendeu do criador e por que as ideias vão funcionar.

SEMPRE inclua um bloco JSON exatamente neste formato:

\`\`\`ideas
[
  {
    "titulo": "Título impactante que poderia ser o nome do vídeo/post",
    "hook": "A primeira frase exata que vai parar o scroll — específica, não genérica",
    "angulo": "O ângulo único que diferencia esse conteúdo dos outros",
    "formato": "Reel | Carrossel | Stories | Vídeo longo | Live | YouTube Shorts",
    "urgencia": 9,
    "porque": "Por que esse tema vai performar bem agora — contexto e raciocínio"
  }
]
\`\`\`

Gere 6 a 8 ideias. Ordene por potencial (urgência de 1 a 10). Seja específica ao nicho — nunca genérica.

## REGRAS ABSOLUTAS
- Português brasileiro informal
- Perguntas sempre no singular — uma por vez
- Após gerar ideias, continue disponível para ajustar, explorar ou detalhar qualquer ideia
- Se o criador pedir pra detalhar uma ideia específica, explore roteiro, hook, estrutura
- Nunca repita a mesma pergunta
- Use o que o criador disse para personalizar cada ideia ao máximo`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isPreview = req.cookies.get('iara_preview')?.value === '1'
  if (!user && !isPreview) {
    return new Response('Unauthorized', { status: 401 })
  }

  const rl = await checkRateLimitUser(req, user?.id ?? null, 'ia_geral')
  if (rl) return rl

  const { messages } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
  }

  // Fetch profile completo — IA precisa pra personalizar de verdade.
  // .maybeSingle pra nao falhar silenciosamente se row faltar. joinArr normaliza
  // campos array (que vem como JSON-string `["Lifestyle"]` em alguns users).
  let profileNote = ''
  let temPersona = false
  if (user) {
    const { data: profile } = await supabase
      .from('creator_profiles')
      .select('nicho, tom_de_voz, nome_artistico, plataformas, objetivo, sobre, voz_perfil')
      .eq('user_id', user.id)
      .maybeSingle()

    const nichoStr = joinArr(profile?.nicho)
    if (nichoStr) {
      temPersona = true
      const tomStr = joinArr(profile?.tom_de_voz) || 'não definido'
      const plataformasStr = joinArr(profile?.plataformas) || 'não definido'
      const objetivoStr = joinArr(profile?.objetivo) || 'não informado'
      profileNote = `\n\n## CONTEXTO DO CRIADOR (use TUDO isso para personalizar)
- Nome: ${profile?.nome_artistico ?? 'criador'}
- Nicho: ${nichoStr}
- Tom de voz: ${tomStr}
- Plataformas principais: ${plataformasStr}
- Objetivo: ${objetivoStr}
${profile?.sobre ? `- Sobre: ${profile.sobre}` : ''}
${profile?.voz_perfil ? `- Análise vocal IA: ${profile.voz_perfil}` : ''}

**JÁ TENHO contexto suficiente sobre o nicho e tom.** Não pergunte sobre nicho/tom/plataforma — você já SABE. Pule pra perguntas mais profundas (audiência, dores, ângulos, oportunidades) ou gere as ideias direto se o criador pedir.`
    }
  }

  // Detecta trigger explicito de geracao na ultima msg do user — forca a IA a gerar.
  const ultimaMsg = messages.filter(m => m.role === 'user').slice(-1)[0]?.content?.toLowerCase() ?? ''
  const triggers = ['gera', 'gere', 'gerar', 'manda', 'mostra', 'mostre', 'as ideias', 'pode gerar', 'faz logo', 'vai logo', 'agora', 'tenho persona', 'persona cadastrad']
  const querGerarAgora = triggers.some(t => ultimaMsg.includes(t))
  const triggerNote = querGerarAgora
    ? `\n\n## INSTRUÇÃO IMEDIATA\nO criador acabou de pedir/sinalizar que quer as ideias AGORA. **NÃO faça mais perguntas.** Gere as 6-8 ideias no formato \`\`\`ideas JSON imediatamente, com base no contexto que você já tem.`
    : ''

  const systemFinal = SYSTEM_PROMPT + profileNote + triggerNote

  const stream = await anthropic.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 2400,
    system: [
      {
        type: 'text',
        text: systemFinal,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
  })

  return new Response(stream.toReadableStream(), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
