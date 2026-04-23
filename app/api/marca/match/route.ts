import Anthropic from '@anthropic-ai/sdk'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { verificarLimiteMarca, respostaLimiteAtingidoMarca } from '@/lib/checkLimiteMarca'

export const runtime = 'nodejs'
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * Match Inteligente — dada uma descrição de campanha/produto, IA recebe
 * amostra de criadores do catálogo e devolve ranking com justificativa.
 *
 * Usa Claude Haiku (rápido + barato, tarefa de ranking).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const lim = await verificarLimiteMarca(user.id, 'match_mes')
  if (!lim.ok) return respostaLimiteAtingidoMarca(lim)

  const body = await req.json() as {
    campanha: string       // descrição livre da campanha/objetivo
    nicho_foco?: string    // filtro opcional
    plataforma_foco?: string
    num_resultados?: number
  }

  if (!body.campanha?.trim() || body.campanha.length < 20) {
    return NextResponse.json({ error: 'Descreva a campanha com pelo menos 20 caracteres' }, { status: 400 })
  }

  const num = Math.min(Math.max(body.num_resultados ?? 10, 3), 20)
  const admin = createAdminClient()

  // Busca amostra maior pro match (Claude escolhe os melhores)
  let query = admin
    .from('creator_profiles')
    .select('id, nome_artistico, nicho, sub_nicho, plataformas, pontos, nivel, sobre, voz_score_medio, tom_de_voz, audiencia, faixa_etaria')
    .eq('onboarding_completo', true)
    .order('pontos', { ascending: false })
    .limit(Math.max(num * 4, 40))   // amostra 4x o num_resultados pra IA escolher

  if (body.nicho_foco) query = query.ilike('nicho', `%${body.nicho_foco}%`)
  if (body.plataforma_foco) query = query.contains('plataformas', [body.plataforma_foco])

  const { data: candidatos } = await query

  if (!candidatos?.length) {
    return NextResponse.json({ matches: [], mensagem: 'Nenhum criador encontrado com esses filtros.' })
  }

  // Lista enxuta pra Claude
  const catalogoTexto = candidatos.map((c, i) =>
    `#${i} id=${c.id} nome="${c.nome_artistico ?? 'sem nome'}" nicho=${c.nicho ?? '?'}${c.sub_nicho ? '/' + c.sub_nicho : ''} plataformas=[${(c.plataformas ?? []).join(',')}] pontos=${c.pontos ?? 0} nivel=${c.nivel ?? 0} ${c.sobre ? 'sobre="' + (c.sobre ?? '').slice(0, 200) + '"' : ''}`
  ).join('\n')

  const SYSTEM = `Você é a Iara, especialista em match de criadores brasileiros com marcas. Dado um briefing de campanha e uma lista de criadores disponíveis, você escolhe os top ${num} mais alinhados e retorna JSON estrito (sem markdown).

Critérios de match (priorize nessa ordem):
1. Alinhamento de nicho com o produto/campanha
2. Plataforma compatível com o objetivo
3. Maturidade (pontos, nivel — indica engajamento com a Iara)
4. Tom e audiência alinhados

Retorne APENAS JSON válido, sem blocos de código, sem texto antes ou depois.`

  const prompt = `BRIEFING DA CAMPANHA:
${body.campanha}

${body.nicho_foco ? 'NICHO FOCO: ' + body.nicho_foco : ''}
${body.plataforma_foco ? 'PLATAFORMA FOCO: ' + body.plataforma_foco : ''}

CATÁLOGO DE CRIADORES DISPONÍVEIS:
${catalogoTexto}

Responda com esse JSON exato:
{
  "matches": [
    {
      "id": "uuid_do_criador",
      "score": 0-100,
      "racional": "1 frase explicando por que esse criador é um match",
      "pontos_fortes": ["2-3 bullets curtos do que esse criador traz pra essa campanha"]
    }
  ]
}

Ordene do maior score pro menor. Inclua NO MÁXIMO ${num} criadores.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: prompt }],
    })
    const texto = response.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')

    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'IA não retornou JSON válido' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0]) as { matches: Array<{ id: string; score: number; racional: string; pontos_fortes?: string[] }> }

    // Hidrata com dados completos do criador (pro frontend mostrar)
    const hidratados = (parsed.matches ?? []).map(m => {
      const criador = candidatos.find(c => c.id === m.id)
      if (!criador) return null
      return { ...m, criador }
    }).filter(Boolean)

    await admin.from('marca_content_history').insert({
      user_id: user.id,
      tipo: 'match',
      titulo: body.campanha.slice(0, 120),
      dados_json: { nicho_foco: body.nicho_foco, plataforma_foco: body.plataforma_foco, resultados: hidratados.length },
    })

    return NextResponse.json({
      matches: hidratados,
      uso: { atual: lim.usoAtual + 1, limite: lim.limite },
      total_catalogo_avaliado: candidatos.length,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
