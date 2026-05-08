import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { jsonrepair } from 'jsonrepair'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkRateLimitUser } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const maxDuration = 90

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é diretora de arte experiente especializada em identidade visual de criadores de conteúdo brasileiros. Analisa carrosséis e posts de Instagram pra extrair o sistema visual: paleta, tipografia, mood, estilo de imagem.

Sua tarefa: olhar as referências visuais e extrair um BRAND KIT que será injetado em todas as gerações futuras desse criador.

REGRAS:
- Seja ESPECÍFICA — não diga "azul", diga "azul-violeta saturado tipo #6366f1".
- Identifique padrões REAIS, não invente. Se as refs forem inconsistentes, diga isso e priorize o que aparece mais.
- Mood vocabulary: minimalista, maximalista, sereno, energético, editorial, pop, brutalista, sofisticado, casual, educativo, premium, raw.
- Estilo de imagens: 'fotos limpas com fundo neutro' | 'flat illustrations vetoriais' | 'aquarela / pintura' | 'gradient overlays' | 'fotos cruas com filtro' | 'foto + tipografia sobreposta' | 'sem imagens, só tipografia'.
- Fontes: dê nomes específicos (Inter, Playfair Display, Bebas Neue, etc) ou descrição categorical se não conseguir identificar (sans-serif geometric / serif elegante / display bold / mono técnica).

OUTPUT: JSON estrito (sem markdown):
{
  "paleta_principal": [
    {"nome": "iara-blue", "hex": "#6366f1", "uso": "títulos / accent"},
    {"nome": "off-white", "hex": "#f5f5f0", "uso": "fundos"}
  ],
  "fonte_titulo": "Playfair Display Black",
  "fonte_corpo": "Inter Regular",
  "mood_visual": "editorial sereno",
  "estilo_imagens": "fotos limpas com fundo neutro",
  "elementos_recorrentes": ["aspas grandes em títulos", "foto pessoal canto", "linha fina horizontal"],
  "prompt_visual_compacto": "Estilo editorial sereno, paleta iara-blue (#6366f1) e off-white (#f5f5f0), Playfair Display Black em títulos com Inter Regular no corpo, fotos pessoais limpas com fundo neutro, elementos: aspas grandes e linhas finas como divisores.",
  "raciocinio": "1 parágrafo explicando o que viu nas refs e como chegou nessa extração."
}`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const rl = await checkRateLimitUser(req, user.id, 'ia_geral')
  if (rl) return rl

  const { referencias_urls } = await req.json().catch(() => ({})) as {
    referencias_urls?: string[]
  }

  if (!Array.isArray(referencias_urls) || referencias_urls.length === 0) {
    return NextResponse.json({ error: 'Envie pelo menos 1 imagem de referência' }, { status: 400 })
  }
  if (referencias_urls.length > 5) {
    return NextResponse.json({ error: 'Máximo 5 imagens de referência' }, { status: 400 })
  }

  // Monta o multimodal: 1 mensagem com texto + N imagens (em base64).
  // SDK Anthropic atual exige base64 — fetch + convert pra cada referencia.
  const userContent: Anthropic.Messages.ContentBlockParam[] = [
    { type: 'text', text: 'Analise estas referências visuais e gere o brand kit em JSON.' },
  ]
  for (const url of referencias_urls) {
    try {
      const imgRes = await fetch(url)
      if (!imgRes.ok) continue
      const buf = Buffer.from(await imgRes.arrayBuffer())
      const mediaType = (imgRes.headers.get('content-type') ?? 'image/jpeg').split(';')[0]
      // Aceita apenas formatos suportados pela Anthropic Vision
      const tipoValido: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' =
        mediaType === 'image/png' ? 'image/png' :
        mediaType === 'image/gif' ? 'image/gif' :
        mediaType === 'image/webp' ? 'image/webp' :
        'image/jpeg'
      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: tipoValido, data: buf.toString('base64') },
      })
    } catch (e) {
      console.warn('[brand-kit/extrair] falha fetch ref:', url, e instanceof Error ? e.message : e)
    }
  }
  if (userContent.length === 1) {
    return NextResponse.json({ error: 'Nenhuma imagem pôde ser carregada' }, { status: 400 })
  }

  let response
  try {
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userContent }],
    })
  } catch (e) {
    const detalhe = e instanceof Error ? e.message : String(e)
    console.error('[brand-kit/extrair] Anthropic erro:', detalhe)
    return NextResponse.json({
      error: 'Falha ao analisar imagens. Tente em alguns segundos.',
      detalhe: detalhe.slice(0, 200),
    }, { status: 502 })
  }

  const texto = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const jsonMatch = texto.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return NextResponse.json({
      error: 'IA não retornou JSON válido',
      detalhe: texto.slice(0, 200),
    }, { status: 502 })
  }

  let kit: {
    paleta_principal?: Array<{ nome: string; hex: string; uso: string }>
    fonte_titulo?: string
    fonte_corpo?: string
    mood_visual?: string
    estilo_imagens?: string
    elementos_recorrentes?: string[]
    prompt_visual_compacto?: string
    raciocinio?: string
  }
  try {
    kit = JSON.parse(jsonMatch[0])
  } catch {
    try {
      kit = JSON.parse(jsonrepair(jsonMatch[0]))
    } catch (e2) {
      return NextResponse.json({
        error: 'JSON da IA quebrado',
        detalhe: e2 instanceof Error ? e2.message : 'erro',
      }, { status: 502 })
    }
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

  // Salva (snapshot do anterior pra rollback se quiser)
  const admin = createAdminClient()
  const { data: anterior } = await admin
    .from('brand_kits')
    .select('paleta_principal, fonte_titulo, fonte_corpo, mood_visual, estilo_imagens, prompt_visual_compacto')
    .eq('user_id', user.id)
    .maybeSingle()

  const upsertData = {
    user_id: user.id,
    referencias_urls,
    paleta_principal: kit.paleta_principal ?? [],
    fonte_titulo: kit.fonte_titulo ?? null,
    fonte_corpo: kit.fonte_corpo ?? null,
    mood_visual: kit.mood_visual ?? null,
    estilo_imagens: kit.estilo_imagens ?? null,
    elementos_recorrentes: kit.elementos_recorrentes ?? [],
    prompt_visual_compacto: kit.prompt_visual_compacto ?? null,
    raciocinio_ia: kit.raciocinio ?? null,
    versao_anterior: anterior ? anterior : null,
    tokens_input: tokensIn,
    tokens_output: tokensOut,
    custo_centavos: custoCentavos,
  }

  const { data: salvo, error: upErr } = await admin
    .from('brand_kits')
    .upsert(upsertData, { onConflict: 'user_id' })
    .select()
    .single()

  if (upErr) {
    if (upErr.message?.includes('relation') && upErr.message?.includes('does not exist')) {
      return NextResponse.json({
        error: 'setup_pendente',
        mensagem: 'Tabela brand_kits não existe. Rode supabase/schema_brand_kit.sql.',
      }, { status: 503 })
    }
    return NextResponse.json({ error: 'Erro salvando', detalhe: upErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    brand_kit: salvo,
    custo_centavos: custoCentavos,
  })
}
