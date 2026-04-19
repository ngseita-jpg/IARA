import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type Slide = {
  ordem: number
  tipo: 'capa' | 'conteudo' | 'encerramento'
  titulo?: string
  corpo: string
  cta?: string
  layout: 'centro' | 'topo' | 'base' | 'esquerda' | 'direita' | 'overlay_escuro' | 'moldura_branca' | 'moldura_preta'
  tamanho_fonte: 'pequeno' | 'medio' | 'grande' | 'gigante'
  cor_texto: string
  cor_fundo_texto?: string
  emoji?: string
  imagem_index?: number
  arquetipo?: string
  eyebrow?: string
  handle?: string
}

export type CarrosselData = {
  slides: Slide[]
  paleta: { primaria: string; secundaria: string; texto: string }
  fonte_sugerida: string
  raciocinio: string
}

function buildSystemPrompt(perfil: Record<string, unknown> | null, modo: string): string {
  const isMarca = modo === 'marca'
  return `Você é a Iara, especialista em design de carrosséis para ${isMarca ? 'marcas e empresas brasileiras' : 'criadores de conteúdo brasileiros'}.

Você gera a estrutura completa de carrosséis no formato JSON com arquétipos de layout profissionais.

## Arquétipos disponíveis (campo "arquetipo")
${isMarca ? `
- brand_cover: capa da marca — logo/nome em destaque, mensagem de posicionamento, fundo de cor sólida ou gradiente
- brand_story: story da marca — título grande à esquerda, texto explicativo à direita (layout bipartido)
- brand_promo: promoção/produto — imagem de produto em destaque, preço/oferta, CTA de compra
` : `
- cover_full: capa com foto full-bleed — texto sobreposto em área inferior, scrim sutil
- split_v: split vertical — foto à direita (60%), texto à esquerda (40%), fundo escuro
- top_text: texto no topo — título e corpo na metade superior, foto na inferior
- full_bleed: full bleed — foto preenche tudo, texto no centro com scrim pontual
- quote: citação — bloco de quote tipográfico em destaque, sem foto obrigatória
- closing: encerramento — CTA central, handle do criador, gradiente de fundo
`}

## Regras de arquétipo
- Slide 1 (capa): sempre "${isMarca ? 'brand_cover' : 'cover_full'}" (ou "split_v" se criativo)
- Slides de conteúdo: alterne entre os arquétipos, nunca repita o mesmo duas vezes seguidas
- Último slide: sempre "${isMarca ? 'brand_promo' : 'closing'}"
- Se não tiver imagem (imagem_index ausente): use "quote" ou "${isMarca ? 'brand_cover' : 'closing'}" nos slides sem foto

## Campos extras
- "eyebrow": texto pequeno acima do título (ex: "01 / 05 · nutrição", "novo produto · outono 26")
- "handle": arroba do criador/marca para o slide de encerramento (ex: "@dra.ana.nutri")

## Perfil ${isMarca ? 'da marca' : 'do criador'}
${perfil ? `Nome: ${perfil.nome_artistico ?? 'não informado'}
Nicho: ${perfil.nicho ?? 'não informado'}
Tom de voz: ${perfil.tom_de_voz ?? 'não informado'}
Sobre: ${perfil.sobre ?? 'não informado'}` : 'Perfil não configurado — use linguagem direta e brasileira.'}

## Formato de saída (JSON puro, sem markdown)
{
  "slides": [
    {
      "ordem": 1,
      "tipo": "capa",
      "arquetipo": "${isMarca ? 'brand_cover' : 'cover_full'}",
      "eyebrow": "conteúdo · nicho",
      "titulo": "título impactante",
      "corpo": "subtítulo ou complemento",
      "handle": "@handle",
      "layout": "base",
      "tamanho_fonte": "gigante",
      "cor_texto": "#ffffff",
      "imagem_index": 0
    }
  ],
  "paleta": { "primaria": "#6366f1", "secundaria": "#a855f7", "texto": "#ffffff" },
  "fonte_sugerida": "Inter",
  "raciocinio": "explique brevemente suas escolhas de design"
}`
}

export async function POST(req: NextRequest) {
  console.log('[carrossel/gerar] START')
  console.log('[carrossel/gerar] ANTHROPIC_KEY length:', process.env.ANTHROPIC_API_KEY?.length ?? 'MISSING')
  console.log('[carrossel/gerar] SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40) ?? 'MISSING')
  try {
  console.log('[carrossel/gerar] step 1: createClient')
  const supabase = await createClient()
  console.log('[carrossel/gerar] step 2: getUser')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  console.log('[carrossel/gerar] step 3: req.json, content-length:', req.headers.get('content-length'))
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch (jsonErr) {
    console.error('[carrossel/gerar] req.json falhou:', jsonErr)
    return NextResponse.json({ error: `body parse error: ${jsonErr}` }, { status: 400 })
  }
  const conteudoRaw = body.conteudo as string | undefined
  const conteudo = conteudoRaw && conteudoRaw.length > 50000 ? conteudoRaw.slice(0, 50000) : conteudoRaw
  const instrucoes = body.instrucoes as string | undefined
  const num_slides = body.num_slides as number | undefined
  const num_imagens = body.num_imagens as number | undefined
  const historico = body.historico as Anthropic.MessageParam[] | undefined
  const modo = (body.modo as string | undefined) ?? 'criador'

  console.log('[carrossel/gerar] step 4: perfil query')
  const { data: perfil, error: perfilErr } = await supabase
    .from('creator_profiles')
    .select('nome_artistico, nicho, tom_de_voz, sobre, plano')
    .eq('user_id', user.id)
    .maybeSingle()
  if (perfilErr) console.error('[carrossel/gerar] perfil error:', perfilErr.message)
  console.log('[carrossel/gerar] plano:', perfil?.plano ?? 'null')

  // Só conta como nova geração (não como ajuste via chat)
  if (!historico?.length) {
    console.log('[carrossel/gerar] step 5: verificarLimite')
    const { verificarLimite, respostaLimiteAtingido } = await import('@/lib/checkLimite')
    const plano = ((perfil?.plano as string) ?? 'free') as import('@/lib/limites').Plano
    const check = await verificarLimite(supabase, user.id, 'carrossel', plano)
    if (!check.permitido) return respostaLimiteAtingido(check.limite, check.usado, check.plano)
  }
  console.log('[carrossel/gerar] step 6: calling Anthropic')

  const qtdImagens: number = typeof num_imagens === 'number' ? num_imagens : 0

  const imagensContext = qtdImagens > 0
    ? `\n\nO criador forneceu ${qtdImagens} imagem(ns) de fundo (índices 0 a ${qtdImagens - 1}). Distribua imagem_index de forma inteligente entre os slides. Varie os layouts para não cobrir rostos ou focos centrais.`
    : '\n\nNenhuma imagem foi fornecida — use layouts com fundo de cor sólida (use cor_fundo_texto para o bloco inteiro). Não defina imagem_index em nenhum slide.'

  const userMsg = `Crie um carrossel com ${num_slides ?? 6} slides sobre o seguinte conteúdo:

${conteudo}

Instruções adicionais do criador: ${instrucoes || 'nenhuma'}
${imagensContext}

Retorne APENAS o JSON, sem nenhum texto antes ou depois.`

  const messages: Anthropic.MessageParam[] = historico?.length
    ? [...historico, { role: 'user' as const, content: userMsg }]
    : [{ role: 'user' as const, content: userMsg }]

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: buildSystemPrompt(perfil as Record<string, unknown> | null, modo),
      messages,
    })

    const texto = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    // Extrair JSON da resposta
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'IA não retornou JSON válido. Tente novamente.' }, { status: 500 })

    let carrossel: CarrosselData
    try {
      carrossel = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'Erro ao interpretar resposta da IA. Tente novamente.' }, { status: 500 })
    }

    if (!carrossel?.slides?.length) {
      return NextResponse.json({ error: 'A IA não gerou slides. Tente novamente.' }, { status: 500 })
    }

    const planoAtual = ((perfil?.plano as string) ?? 'free')
    const show_watermark = planoAtual === 'free' || planoAtual === 'starter'
    return NextResponse.json({ carrossel, assistant_message: texto, show_watermark, modo })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error('Erro gerar carrossel:', msg, stack)
    return NextResponse.json({ error: `Erro ao gerar carrossel: ${msg}` }, { status: 500 })
  }
  } catch (outerErr) {
    const msg = outerErr instanceof Error ? outerErr.message : String(outerErr)
    const stack = outerErr instanceof Error ? outerErr.stack : undefined
    console.error('Erro EXTERNO gerar carrossel:', msg, stack)
    return NextResponse.json({ error: `Erro ao gerar carrossel (externo): ${msg}` }, { status: 500 })
  }
}
