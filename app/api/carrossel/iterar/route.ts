import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { jsonrepair } from 'jsonrepair'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkRateLimitUser } from '@/lib/rateLimit'
import { joinArr } from '@/lib/parseArr'
import { getBrandKitContext } from '@/lib/getBrandKit'
import type { CarrosselData } from '../gerar/route'

export const runtime = 'nodejs'
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * /api/carrossel/iterar — chat de refinamento APOS o carrossel ja gerado.
 * User pede em linguagem natural: "expande o slide 3", "muda o hook",
 * "adiciona uma estatistica", "deixa mais polemico", etc. IA recebe carrossel
 * inteiro + instrucao + perfil + brand kit, devolve novo carrossel atualizado.
 *
 * Foco: alteracoes pontuais sem regenerar do zero. Slides nao mencionados
 * pela IA devem voltar identicos.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const rl = await checkRateLimitUser(req, user.id, 'ia_geral')
  if (rl) return rl

  const { carrossel, instrucao } = await req.json().catch(() => ({})) as {
    carrossel?: CarrosselData
    instrucao?: string
  }

  if (!carrossel || !Array.isArray(carrossel.slides)) {
    return NextResponse.json({ error: 'Carrossel inválido' }, { status: 400 })
  }
  if (!instrucao || instrucao.trim().length < 3) {
    return NextResponse.json({ error: 'Diga o que você quer mudar' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('creator_profiles')
    .select('nicho, tom_de_voz, nome_artistico, sobre')
    .eq('user_id', user.id)
    .maybeSingle()

  const brandKitCtx = await getBrandKitContext(admin, user.id)

  const systemPrompt = `Você é a Iara, especialista em carrosséis virais brasileiros. O usuário JÁ tem um carrossel gerado e está pedindo alterações pontuais.

REGRAS CRÍTICAS:
1. Aplique APENAS a mudança pedida. Slides não mencionados voltam IDÊNTICOS (mesmo titulo, corpo, cta, layout, etc).
2. Mantenha a estrutura JSON exata do carrossel (mesmos campos, mesmo formato).
3. Se o user pedir algo que não faz sentido (ex: "vira em vermelho" sem contexto), faça o melhor julgamento e mantenha consistência visual.
4. NÃO mude paleta/fontes a menos que pedido explicitamente.
5. NÃO mude número de slides a menos que pedido.
6. Mantenha o tom do criador (PT-BR fluente, gírias se já tinha, etc).

OUTPUT: JSON estrito (sem markdown). Mesmo schema do CarrosselData. Inclua slides[], paleta, fonte_sugerida/titulo/corpo, raciocinio (curta — explica em 1-2 frases o que mudou).

${profile ? `## Perfil do criador (use pra manter voz)
- Nome: ${profile.nome_artistico ?? 'criador'}
- Nicho: ${joinArr(profile.nicho) || 'não informado'}
- Tom de voz: ${joinArr(profile.tom_de_voz) || 'não informado'}
- Sobre: ${profile.sobre ?? 'não informado'}` : ''}
${brandKitCtx}`

  const userPrompt = `## Carrossel atual
\`\`\`json
${JSON.stringify(carrossel, null, 2)}
\`\`\`

## Instrução do criador
"${instrucao}"

Aplique a alteração pedida e devolva o carrossel completo atualizado em JSON.`

  let response
  try {
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3500,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userPrompt }],
    })
  } catch (e) {
    const detalhe = e instanceof Error ? e.message : String(e)
    return NextResponse.json({
      error: 'Falha temporária da IA',
      detalhe: detalhe.slice(0, 200),
    }, { status: 503 })
  }

  const texto = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const jsonMatch = texto.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return NextResponse.json({
      error: 'IA não retornou JSON válido',
      detalhe: texto.slice(0, 200),
    }, { status: 502 })
  }

  let atualizado: CarrosselData
  try {
    atualizado = JSON.parse(jsonMatch[0])
  } catch {
    try {
      atualizado = JSON.parse(jsonrepair(jsonMatch[0]))
    } catch (e2) {
      return NextResponse.json({
        error: 'JSON quebrado',
        detalhe: e2 instanceof Error ? e2.message : 'erro',
      }, { status: 502 })
    }
  }

  // Validacao basica: tem slides?
  if (!Array.isArray(atualizado.slides) || atualizado.slides.length === 0) {
    return NextResponse.json({ error: 'IA retornou carrossel sem slides' }, { status: 502 })
  }

  // Custo
  const tokensIn = response.usage.input_tokens + (response.usage.cache_creation_input_tokens ?? 0) + (response.usage.cache_read_input_tokens ?? 0)
  const tokensOut = response.usage.output_tokens
  const custoCentavos = Math.round(
    (response.usage.input_tokens / 1_000_000) * 300 +
    ((response.usage.cache_creation_input_tokens ?? 0) / 1_000_000) * 375 +
    ((response.usage.cache_read_input_tokens ?? 0) / 1_000_000) * 30 +
    (tokensOut / 1_000_000) * 1500
  )

  return NextResponse.json({
    carrossel: atualizado,
    tokens_input: tokensIn,
    tokens_output: tokensOut,
    custo_centavos: custoCentavos,
  })
}
