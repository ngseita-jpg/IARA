import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AGENTES, AGENTES_LIST, SINTESE_SYSTEM, type TipoPedido } from '@/lib/marketing-agents'
import { ADMIN_EMAILS } from '@/lib/admin'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const runtime = 'nodejs'
export const maxDuration = 120

// Estimativa grosseira de custo (USD → BRL a 5,00)
const CUSTO_SONNET_IN  = 3 / 1_000_000 * 5   // R$ por token input
const CUSTO_SONNET_OUT = 15 / 1_000_000 * 5
const CUSTO_HAIKU_IN   = 1 / 1_000_000 * 5
const CUSTO_HAIKU_OUT  = 5 / 1_000_000 * 5

function calcCusto(ins: number, outs: number, model: 'sonnet' | 'haiku'): number {
  return model === 'sonnet'
    ? ins * CUSTO_SONNET_IN + outs * CUSTO_SONNET_OUT
    : ins * CUSTO_HAIKU_IN + outs * CUSTO_HAIKU_OUT
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })
  }

  const body = await req.json() as {
    objetivo: string
    tipo_pedido?: TipoPedido
    agentes?: string[]              // se quiser só alguns — default é todos os 7
    contexto_extra?: Record<string, unknown>
  }

  const objetivo = (body.objetivo ?? '').trim()
  if (!objetivo || objetivo.length < 10) {
    return NextResponse.json({ error: 'Objetivo muito curto (mín 10 chars)' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Cria sessão em status 'gerando'
  const { data: sessao, error: errSessao } = await admin
    .from('marketing_squad_sessoes')
    .insert({
      owner_user_id: user.id,
      tipo_pedido: body.tipo_pedido ?? 'livre',
      objetivo,
      contexto_extra: body.contexto_extra ?? {},
      status: 'gerando',
    })
    .select('id')
    .single()

  if (errSessao || !sessao) {
    return NextResponse.json({ error: errSessao?.message ?? 'Erro ao criar sessão' }, { status: 500 })
  }

  const sessaoId = sessao.id

  // Busca últimas ideias pra dar contexto de memória (pra evitar repetir sugestões)
  const { data: ideiasRecentes } = await admin
    .from('marketing_squad_ideias')
    .select('titulo, agente, status')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const memoriaBlock = (ideiasRecentes ?? []).length > 0
    ? `\n\nMEMÓRIA — ideias já geradas recentemente (EVITE repetir, a menos que faça muito sentido):\n${
        (ideiasRecentes ?? []).map(i => `- [${i.status}] (${i.agente}) ${i.titulo}`).join('\n')
      }`
    : ''

  const contextoExtraStr = Object.keys(body.contexto_extra ?? {}).length > 0
    ? `\n\nCONTEXTO EXTRA FORNECIDO PELO FUNDADOR:\n${JSON.stringify(body.contexto_extra, null, 2)}`
    : ''

  // Filtra agentes se especificado
  const agentesAlvo = body.agentes?.length
    ? AGENTES_LIST.filter(a => body.agentes!.includes(a.id))
    : AGENTES_LIST

  // Dispara os 7 agentes EM PARALELO (ganha 7x no tempo de espera)
  const respostasPromises = agentesAlvo.map(async agente => {
    try {
      const res = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: [
          {
            type: 'text',
            text: agente.systemPrompt + memoriaBlock,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: `Briefing do fundador:\n${objetivo}${contextoExtraStr}` }],
      })
      const textoBlock = res.content.find(b => b.type === 'text')
      const resposta = textoBlock && textoBlock.type === 'text' ? textoBlock.text : ''

      await admin
        .from('marketing_squad_respostas')
        .insert({
          sessao_id: sessaoId,
          agente: agente.id,
          resposta,
          tokens_input:  res.usage.input_tokens,
          tokens_output: res.usage.output_tokens,
        })

      return {
        agente: agente.id,
        resposta,
        tokens_in:  res.usage.input_tokens,
        tokens_out: res.usage.output_tokens,
      }
    } catch (e) {
      console.error(`[squad ${agente.id}]`, e)
      return {
        agente: agente.id,
        resposta: `(Erro ao consultar este agente. Tentar novamente.)`,
        tokens_in: 0,
        tokens_out: 0,
      }
    }
  })

  const respostas = await Promise.all(respostasPromises)

  // Síntese final — Haiku (mais barato, é só consolidar)
  const respostasConsolidadas = respostas.map(r => {
    const nome = AGENTES[r.agente as keyof typeof AGENTES]?.nome ?? r.agente
    return `━━━ ${nome.toUpperCase()} ━━━\n${r.resposta}`
  }).join('\n\n')

  let sintese = ''
  let sinteseTokensIn = 0
  let sinteseTokensOut = 0

  try {
    const sinteseRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 900,
      system: [{ type: 'text', text: SINTESE_SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: `Briefing original: ${objetivo}\n\nRespostas dos 7 especialistas:\n\n${respostasConsolidadas}` }],
    })
    const bloco = sinteseRes.content.find(b => b.type === 'text')
    sintese = bloco && bloco.type === 'text' ? bloco.text : ''
    sinteseTokensIn = sinteseRes.usage.input_tokens
    sinteseTokensOut = sinteseRes.usage.output_tokens
  } catch (e) {
    console.error('[squad sintese]', e)
    sintese = '(Síntese indisponível no momento. Revise as respostas individuais.)'
  }

  // Calcula custo total
  const totalTokensIn = respostas.reduce((a, r) => a + r.tokens_in, 0)
  const totalTokensOut = respostas.reduce((a, r) => a + r.tokens_out, 0)
  const custoAgentes = calcCusto(totalTokensIn, totalTokensOut, 'sonnet')
  const custoSintese = calcCusto(sinteseTokensIn, sinteseTokensOut, 'haiku')
  const custoTotal = custoAgentes + custoSintese

  await admin
    .from('marketing_squad_sessoes')
    .update({
      status: 'pronto',
      sintese,
      tokens_input: totalTokensIn + sinteseTokensIn,
      tokens_output: totalTokensOut + sinteseTokensOut,
      custo_estimado_brl: Math.round(custoTotal * 10000) / 10000,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessaoId)

  return NextResponse.json({
    sessao_id: sessaoId,
    respostas: respostas.map(r => ({ agente: r.agente, resposta: r.resposta })),
    sintese,
    custo_estimado_brl: custoTotal,
  })
}

// GET — lista sessões do admin
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: sessoes } = await admin
    .from('marketing_squad_sessoes')
    .select('id, tipo_pedido, objetivo, status, sintese, custo_estimado_brl, created_at')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return NextResponse.json({ sessoes: sessoes ?? [] })
}
