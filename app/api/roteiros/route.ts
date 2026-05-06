import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { joinArr } from '@/lib/parseArr'
import { checkRateLimitUser } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const maxDuration = 60

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `Você é a Iara, assessora de conteúdo para criadores e marcas brasileiras.
Gera roteiros e hooks personalizados, prontos para gravar.

## Formatos que você domina

Reel / TikTok / Shorts (até 90s): ritmo acelerado, gancho nos primeiros 2s, direto ao ponto.
Carrossel (feed): slides numerados, cada slide uma ideia central, título forte no slide 1.
Vídeo longo / YouTube (3-30min): introdução com promessa, desenvolvimento em blocos.
Stories (sequência): blocos de 15s, cada story uma micro-entrega, CTA no último.
Live: abertura de aquecimento, pauta, momentos de interação, encerramento com CTA.

## Modo: Roteiro Completo

Use EXATAMENTE estes três rótulos como linhas isoladas (sem #, sem **, sem emojis):

HOOK
[o gancho dos primeiros 2 a 7 segundos. 1-3 frases curtas. Pergunta provocativa, dado surpreendente, afirmação ousada ou dor real.]

DESENVOLVIMENTO
[o conteúdo principal. Parágrafos curtos. Use diretivas de cena entre colchetes em linhas próprias quando relevante: [PAUSA], [OLHAR PARA A CÂMERA], [MOSTRAR TELA], [CORTE], [B-ROLL]. Para carrosséis, use "Slide 1:", "Slide 2:" etc no início de cada bloco.]

CTA
[a chamada final. Curta, específica, natural.]

## Modo: 4 Hooks Alternativos

Use EXATAMENTE este formato (rótulos em linhas isoladas, sem ** e sem #):

Hook 1 (Pergunta Polêmica)
[o hook]

Hook 2 (Dado ou Estatística)
[o hook]

Hook 3 (Afirmação Ousada)
[o hook]

Hook 4 (Problema Doloroso)
[o hook]

Depois dos 4 hooks, adicione 1 linha começando com "Quando usar:" explicando perfis de audiência.

## REGRAS DE FORMATAÇÃO (CRÍTICAS — não quebre)

NÃO use markdown: zero #, zero ##, zero ###, zero **, zero __, zero >.
NÃO use travessão (—) nem hífen duplo (--). Use vírgula ou parênteses.
NÃO use emojis decorativos nos rótulos (HOOK, CTA, etc). Emojis só dentro do conteúdo se for natural à fala.
Use parágrafos curtos separados por linha em branco.
Diretivas de cena ficam SEMPRE entre colchetes em linha própria, não no meio do texto.

## Diretrizes de qualidade
Linguagem natural e coloquial, como o criador falaria.
Vocabulário brasileiro autêntico, sem clichê.
Específico, zero conteúdo genérico.
Roteiro pronto pra gravar, não esboço.
Use o perfil do criador como voz, é ele que fala.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const rl = await checkRateLimitUser(req, user.id, 'ia_geral')
  if (rl) return rl

  const body = await req.json()
  const { tema, formato, duracao, estilo, objetivo, modo, inspiracao, conteudo_base } = body

  if (!formato) {
    return new Response(JSON.stringify({ error: 'Formato é obrigatório' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!tema && !conteudo_base) {
    return new Response(JSON.stringify({ error: 'Informe o tema ou cole um conteúdo base' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Buscar perfil do criador para personalização (incluindo voz e plano)
  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('nome_artistico, nicho, tom_de_voz, plataformas, objetivo, sobre, voz_perfil, voz_score_medio, plano')
    .eq('user_id', user.id)
    .maybeSingle()

  // Verificar limite de uso
  const { verificarLimite, respostaLimiteAtingido } = await import('@/lib/checkLimite')
  const plano = ((profile?.plano as string) ?? 'free') as import('@/lib/limites').Plano
  const check = await verificarLimite(supabase, user.id, 'roteiro', plano)
  if (!check.permitido) return respostaLimiteAtingido(check.limite, check.usado, check.plano)

  const perfilContexto = profile
    ? `## Perfil do Criador (use como contexto de personalização)
Nome/Como se apresenta: ${profile.nome_artistico || 'Não informado'}
Nicho: ${profile.nicho || 'Não informado'}
Plataformas principais: ${profile.plataformas?.join(', ') || 'Não informado'}
Objetivo principal: ${(() => { try { const r = JSON.parse(profile.objetivo||''); return Array.isArray(r) ? r.join(', ') : profile.objetivo } catch { return profile.objetivo } })()||'Não informado'}
Tom de voz e estilo: ${joinArr(profile.tom_de_voz) || 'Não informado'}
Sobre o criador: ${profile.sobre || 'Não informado'}
${profile.voz_perfil ? `Perfil vocal (analisado por IA): ${profile.voz_perfil}` : ''}

Este roteiro deve soar exatamente como esse criador fala — adapte o ritmo, vocabulário e energia ao perfil acima.`
    : `## Perfil do Criador
Perfil não configurado — gere um roteiro autêntico e engajador em português brasileiro.`

  const modoTexto = modo === 'hooks'
    ? 'Gere 4 hooks alternativos com abordagens distintas para o tema abaixo.'
    : 'Gere um roteiro completo pronto para gravação.'

  const fonteCtx = conteudo_base
    ? `## Conteúdo base (transforme isso em roteiro — não copie, reinterprete no estilo do criador)
${conteudo_base.slice(0, 6000)}

${tema ? `Ângulo/foco desejado: ${tema}` : 'Identifique o ângulo mais interessante para o formato escolhido.'}`
    : `**Tema:** ${tema}`

  const userPrompt = `${modoTexto}

${fonteCtx}
**Formato:** ${formato}
**Duração aproximada:** ${duracao || 'Não especificada'}
**Estilo/tom adicional:** ${estilo || 'Use o perfil do criador como referência'}
**Objetivo do conteúdo:** ${objetivo || 'Engajamento e entrega de valor'}

${perfilContexto}${inspiracao ? `

## Vídeo de inspiração: "${inspiracao.titulo}"
${inspiracao.transcricao
  ? `Transcrição (use como referência de estrutura, ritmo e abordagem — NÃO copie o conteúdo, apenas aprenda o padrão):
${inspiracao.transcricao.slice(0, 4000)}`
  : 'O criador indicou este vídeo como referência de estilo. Considere isso na geração.'}` : ''}`

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
