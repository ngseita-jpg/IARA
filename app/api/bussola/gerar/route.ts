import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { jsonrepair } from 'jsonrepair'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { joinArr } from '@/lib/parseArr'
import { checkRateLimitUser } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const maxDuration = 90

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é a Iara, assessora estratégica de carreira pra criadores de conteúdo brasileiros.
Sua missão: pegar o perfil + as respostas curtas do criador e gerar um PLANO DE BÚSSOLA — direcionamento concreto pros próximos 3 meses + missões da semana.

REGRAS:
1. Seja BRUTALMENTE específico. Nada de "produzir mais conteúdo" ou "engajar audiência". Marcos têm número OU resultado mensurável.
2. Marco de 3 meses tem que ser AGRESSIVO mas alcançável (75% de chance de bater se o criador executar).
3. Marco de 1 ano cresce ~5x do marco de 3 meses (tese: efeito composto).
4. Diferencial = o que TÉCNICO/HUMANO separa esse criador de 100 outros do mesmo nicho. Não repetir nicho. Tem que ser específico.
5. Audiência alvo = pessoa concreta (idade, situação, dor), não "criadores brasileiros".
6. Fase atual: escolha entre construindo (sem autoridade), crescendo (autoridade ok mas pouco alcance), monetizando (autoridade + alcance, falta converter), escalando (já monetiza, falta sistema).
7. Missões: 4 semanas, cada uma com 2-3 missões CONCRETAS. Não "postar 5 reels". Sim "gravar 1 reel sobre tema X com hook Y" / "lançar isca digital no link da bio com captação de email".

OUTPUT JSON estrito (sem markdown, sem fences de codigo):
{
  "diferencial": "...",
  "audiencia_alvo": "...",
  "marco_3m": "...",
  "marco_1a": "...",
  "marco_3a": "...",
  "fase_atual": "construindo|crescendo|monetizando|escalando",
  "missoes": [
    { "semana": 1, "missoes": [{ "texto": "...", "concluida": false, "criada_em": "<ISO>" }] },
    { "semana": 2, "missoes": [...] },
    { "semana": 3, "missoes": [...] },
    { "semana": 4, "missoes": [...] }
  ],
  "raciocinio_ia": "1-2 frases explicando por que esse plano faz sentido pra esse criador específico"
}`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const rl = await checkRateLimitUser(req, user.id, 'ia_geral')
  if (rl) return rl

  const body = await req.json().catch(() => ({})) as {
    onde_quer_chegar?: string
    maior_obstaculo?: string
    o_que_diferencia?: string
    quem_e_audiencia?: string
  }

  // Admin client bypassa RLS — algumas tabelas tem policies que falham em
  // edge cases. Cronograma e outras rotas IA fazem assim tambem.
  const admin = createAdminClient()

  // Carrega perfil pra contexto
  const { data: profile } = await admin
    .from('creator_profiles')
    .select('nicho, tom_de_voz, plataformas, objetivo, sobre, voz_perfil, nome_artistico')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile?.nicho || (typeof profile.nicho === 'string' && profile.nicho.trim() === '')) {
    return NextResponse.json({
      error: 'persona_incompleta',
      mensagem: 'Configure seu nicho e tom no perfil pra a Iara montar sua Bússola.',
      redirect: '/dashboard/persona',
      debug: `profile=${profile ? 'existe' : 'null'}, nicho=${JSON.stringify(profile?.nicho)}`,
    }, { status: 422 })
  }

  // Carrega métricas básicas (último update) pra IA saber onde user tá hoje
  const { data: metricas } = await admin
    .from('metricas_redes')
    .select('plataforma, seguidores, alcance_mensal')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(5)

  const metricasResumo = (metricas ?? []).length > 0
    ? metricas!.map(m => `${m.plataforma}: ${m.seguidores?.toLocaleString('pt-BR') ?? '0'} seguidores`).join(', ')
    : 'sem métricas cadastradas ainda'

  const userPrompt = `## Perfil do criador
- Nome: ${profile.nome_artistico ?? 'criador'}
- Nicho: ${joinArr(profile.nicho)}
- Tom de voz: ${joinArr(profile.tom_de_voz) || 'não definido'}
- Plataformas: ${joinArr(profile.plataformas) || 'não definido'}
- Objetivo declarado: ${joinArr(profile.objetivo) || 'não informado'}
${profile.sobre ? `- Sobre: ${profile.sobre}` : ''}
${profile.voz_perfil ? `- Análise vocal: ${profile.voz_perfil}` : ''}

## Status atual
- Métricas: ${metricasResumo}

## Respostas da entrevista (use TUDO)
- Onde quer chegar daqui 1 ano: ${body.onde_quer_chegar || '(não respondeu)'}
- Maior obstáculo hoje: ${body.maior_obstaculo || '(não respondeu)'}
- O que te diferencia (resposta dele): ${body.o_que_diferencia || '(não respondeu)'}
- Quem é a audiência (resposta dele): ${body.quem_e_audiencia || '(não respondeu)'}

Gere o plano JSON agora. Lembre: marcos com NÚMERO ou resultado mensurável, missões CONCRETAS pra cada semana.`

  let response
  try {
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userPrompt }],
    })
  } catch (e) {
    const detalhe = e instanceof Error ? e.message : String(e)
    console.error('[bussola/gerar] Anthropic erro:', detalhe)
    return NextResponse.json({ error: 'Falha temporária da IA. Tente em alguns segundos.', detalhe }, { status: 503 })
  }

  const texto = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const jsonMatch = texto.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return NextResponse.json({ error: 'IA não retornou JSON', detalhe: texto.slice(0, 200) }, { status: 502 })
  }

  let parsed
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    try {
      parsed = JSON.parse(jsonrepair(jsonMatch[0]))
    } catch (e2) {
      const detalhe = e2 instanceof Error ? e2.message : 'erro'
      return NextResponse.json({ error: 'IA retornou JSON quebrado.', detalhe }, { status: 502 })
    }
  }

  // Calcula custo
  const tokensIn = response.usage.input_tokens + (response.usage.cache_creation_input_tokens ?? 0) + (response.usage.cache_read_input_tokens ?? 0)
  const tokensOut = response.usage.output_tokens
  const custoCentavos = Math.round(
    (response.usage.input_tokens / 1_000_000) * 300 +
    ((response.usage.cache_creation_input_tokens ?? 0) / 1_000_000) * 375 +
    ((response.usage.cache_read_input_tokens ?? 0) / 1_000_000) * 30 +
    (tokensOut / 1_000_000) * 1500
  )

  // Calcula trimestre atual (ex: '2026-Q2')
  const agora = new Date()
  const trim = Math.floor(agora.getMonth() / 3) + 1
  const trimestre = `${agora.getFullYear()}-Q${trim}`

  // Arquiva plano antigo (se existir) e cria novo
  await admin
    .from('bussola_planos')
    .update({ status: 'arquivado' })
    .eq('user_id', user.id)
    .eq('status', 'ativo')

  const { data: plano, error: insertErr } = await admin
    .from('bussola_planos')
    .insert({
      user_id: user.id,
      status: 'ativo',
      trimestre,
      diferencial: parsed.diferencial,
      audiencia_alvo: parsed.audiencia_alvo,
      marco_3m: parsed.marco_3m,
      marco_1a: parsed.marco_1a,
      marco_3a: parsed.marco_3a,
      fase_atual: parsed.fase_atual ?? 'construindo',
      missoes: parsed.missoes ?? [],
      raciocinio_ia: parsed.raciocinio_ia,
      tokens_input: tokensIn,
      tokens_output: tokensOut,
      custo_centavos: custoCentavos,
    })
    .select()
    .single()

  if (insertErr) {
    if (/relation.*does not exist/i.test(insertErr.message)) {
      return NextResponse.json({
        error: 'setup_pendente',
        mensagem: 'Bússola não está ativada — admin precisa rodar schema_bussola.sql.',
      }, { status: 503 })
    }
    return NextResponse.json({ error: 'Erro salvando plano', detalhe: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({ plano })
}
