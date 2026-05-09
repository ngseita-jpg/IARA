import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkRateLimitUser } from '@/lib/rateLimit'
import { joinArr } from '@/lib/parseArr'
import { getBrandKitContext } from '@/lib/getBrandKit'

export const runtime = 'nodejs'
export const maxDuration = 90

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type Slide = {
  numero: number
  tipo: 'capa' | 'desenvolvimento' | 'cta'
  titulo: string
  texto: string
  descricao_imagem: string | null  // prompt pra FAL — null = slide só texto
  imagem_url?: string              // preenchido depois da geração
}

type GeracaoIA = {
  tema: string
  slides: Slide[]
  legenda: string
  hashtags: string[]
}

const SYSTEM_PROMPT = `Você é a Iara, especialista em carrosséis virais para Instagram brasileiros.

Sua missão: gerar UM carrossel completo pronto pra postar HOJE — 5 slides, com tema relevante pro nicho do criador, alinhado com a identidade visual dele (Brand Kit) e seguindo o cronograma da semana se disponível.

## Regras dos slides

5 slides exatos: 1 capa + 3 de conteúdo + 1 de CTA.

**Slide 1 (capa):**
- Título-promessa que para o scroll. 4-7 palavras.
- Texto secundário curto (até 12 palavras).
- DEVE ter descricao_imagem (prompt visual rico pra IA gerar).

**Slides 2-4 (desenvolvimento):**
- Cada slide UMA ideia. Titulos curtos (3-5 palavras), texto até 35 palavras.
- 1 dos 3 deve ter descricao_imagem (geralmente o slide do meio com dado/exemplo). Os outros 2 = só texto.

**Slide 5 (CTA):**
- Ação clara (salvar, comentar, compartilhar, mandar pra alguém).
- Título "Salva isso aí" ou similar. Texto curto.
- DEVE ter descricao_imagem (fechamento visual da identidade).

## Descrição de imagem (descricao_imagem)

Quando preencher, escreva prompt em INGLÊS de 1-2 frases otimizado pro FLUX-schnell:
- Estilo coerente com Brand Kit (mood, paleta, estilo_imagens)
- Foco em ESTÉTICA — não texto na imagem (textos serão sobrepostos pelo editor)
- Exemplo bom: "Minimalist editorial photo of a woman journaling at golden hour, warm beige tones, soft natural light, square composition"
- Exemplo ruim: "A picture about productivity"

## Output (JSON estrito, sem markdown)

{
  "tema": "tema do carrossel em 3-7 palavras",
  "slides": [
    {"numero":1, "tipo":"capa", "titulo":"...", "texto":"...", "descricao_imagem":"..."},
    {"numero":2, "tipo":"desenvolvimento", "titulo":"...", "texto":"...", "descricao_imagem":null},
    {"numero":3, "tipo":"desenvolvimento", "titulo":"...", "texto":"...", "descricao_imagem":"..."},
    {"numero":4, "tipo":"desenvolvimento", "titulo":"...", "texto":"...", "descricao_imagem":null},
    {"numero":5, "tipo":"cta", "titulo":"...", "texto":"...", "descricao_imagem":"..."}
  ],
  "legenda": "caption pronta pro Instagram (3-5 linhas, com emoji natural, sem clichê)",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"]
}`

async function gerarImagemFAL(prompt: string): Promise<string | null> {
  const FAL_KEY = process.env.FAL_KEY
  if (!FAL_KEY) {
    console.warn('[post-do-dia] FAL_KEY ausente — pulando geração de imagem')
    return null
  }
  try {
    const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'square_hd',  // 1024×1024
        num_images: 1,
        num_inference_steps: 4,    // schnell otimizado pra 4 steps
        enable_safety_checker: true,
      }),
    })
    if (!res.ok) {
      console.error('[post-do-dia] FAL retornou', res.status, await res.text().catch(() => ''))
      return null
    }
    const data = await res.json() as { images?: Array<{ url: string }> }
    return data.images?.[0]?.url ?? null
  } catch (err) {
    console.error('[post-do-dia] erro chamando FAL:', err)
    return null
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const rl = await checkRateLimitUser(req, user.id, 'ia_geral')
  if (rl) return rl

  const admin = createAdminClient()

  // Perfil + plano
  const { data: profile } = await admin
    .from('creator_profiles')
    .select('nome_artistico, nicho, tom_de_voz, plataformas, objetivo, sobre, plano')
    .eq('user_id', user.id)
    .maybeSingle()

  const plano = (profile?.plano as string) ?? 'free'

  // Free bloqueado — Post do Dia é benefício de plano pago
  if (plano === 'free') {
    return NextResponse.json({
      error: 'Post do Dia é exclusivo do plano Plus, Premium ou Profissional.',
      cta: 'upgrade',
    }, { status: 403 })
  }

  // Já gerou hoje? (constraint UNIQUE user_id+data garante 1/dia)
  const hoje = new Date().toISOString().slice(0, 10)
  const { data: existente } = await admin
    .from('manha_posts')
    .select('id, status, slides_json, legenda, hashtags, tema')
    .eq('user_id', user.id)
    .eq('data', hoje)
    .maybeSingle()

  if (existente && existente.status === 'pronto') {
    return NextResponse.json({
      ja_existe: true,
      post: existente,
    })
  }

  const brandKitCtx = await getBrandKitContext(admin, user.id)

  // Item do calendário de hoje (opcional — usa como tema-base se existir)
  const { data: cronoHoje } = await admin
    .from('calendar_items')
    .select('id, titulo, gancho, script, tipo_conteudo, plataforma')
    .eq('user_id', user.id)
    .eq('data_planejada', hoje)
    .limit(1)
    .maybeSingle()

  const personaCtx = profile ? `## Perfil do criador
- Nome: ${profile.nome_artistico ?? 'criador'}
- Nicho: ${joinArr(profile.nicho) || 'não informado'}
- Tom de voz: ${joinArr(profile.tom_de_voz) || 'não informado'}
- Plataformas: ${joinArr(profile.plataformas) || 'não informado'}
- Objetivo: ${joinArr(profile.objetivo) || 'não informado'}
${profile.sobre ? `- Sobre: ${profile.sobre}` : ''}` : 'Perfil não configurado.'

  const cronoCtx = cronoHoje ? `\n\n## Cronograma de hoje (${cronoHoje.tipo_conteudo} no ${cronoHoje.plataforma})
- Título programado: ${cronoHoje.titulo}
- Gancho previsto: ${cronoHoje.gancho ?? '-'}
- Script base: ${cronoHoje.script ? cronoHoje.script.slice(0, 800) : '-'}

Use isso como tema-base, mas adapte ao formato carrossel.` : ''

  const userPrompt = `${personaCtx}${brandKitCtx}${cronoCtx}

## Pedido
Gere o carrossel do dia ${hoje}. Tema deve ser RELEVANTE pro nicho e ao mesmo tempo gancho viral. Não use clichês motivacionais.

Retorne APENAS o JSON, sem markdown.`

  // 1. Inserir registro como "gerando" pra evitar race
  const { data: criado, error: insertErr } = await admin
    .from('manha_posts')
    .upsert({
      user_id: user.id,
      data: hoje,
      origem: 'manual',
      cronograma_item_id: cronoHoje?.id ?? null,
      status: 'gerando',
    }, { onConflict: 'user_id,data' })
    .select()
    .single()

  if (insertErr || !criado) {
    return NextResponse.json({ error: 'Erro ao criar registro' }, { status: 500 })
  }

  try {
    // 2. Sonnet gera estrutura
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2200,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('IA não retornou JSON')

    let parsed: GeracaoIA
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      const { jsonrepair } = await import('jsonrepair')
      parsed = JSON.parse(jsonrepair(jsonMatch[0]))
    }

    // 3. Gera imagens em paralelo (apenas slides com descricao_imagem)
    const slidesComImagem = parsed.slides.filter(s => s.descricao_imagem)
    const imagensPromises = slidesComImagem.map(async (s) => {
      const url = await gerarImagemFAL(s.descricao_imagem!)
      return { numero: s.numero, url }
    })
    const imagensResultados = await Promise.all(imagensPromises)
    const mapaImagens = new Map(imagensResultados.map(r => [r.numero, r.url]))

    const slidesFinal: Slide[] = parsed.slides.map(s => ({
      ...s,
      imagem_url: mapaImagens.get(s.numero) ?? undefined,
    }))

    const imagensGeradas = imagensResultados.filter(r => r.url).length

    // 4. Persiste
    const { error: updateErr } = await admin
      .from('manha_posts')
      .update({
        tema: parsed.tema,
        slides_json: slidesFinal,
        legenda: parsed.legenda,
        hashtags: parsed.hashtags,
        status: 'pronto',
        tokens_input: response.usage.input_tokens,
        tokens_output: response.usage.output_tokens,
        imagens_geradas: imagensGeradas,
        custo_centavos: Math.round(
          (response.usage.input_tokens * 0.0003 + response.usage.output_tokens * 0.0015) * 100 +
          imagensGeradas * 0.3,
        ),
      })
      .eq('id', criado.id)

    if (updateErr) {
      console.error('[post-do-dia] erro ao persistir:', updateErr)
    }

    return NextResponse.json({
      post: {
        id: criado.id,
        data: hoje,
        tema: parsed.tema,
        slides_json: slidesFinal,
        legenda: parsed.legenda,
        hashtags: parsed.hashtags,
        imagens_geradas: imagensGeradas,
      },
    })
  } catch (err) {
    console.error('[post-do-dia] erro:', err)
    await admin.from('manha_posts').update({
      status: 'falhou',
      erro: err instanceof Error ? err.message : 'desconhecido',
    }).eq('id', criado.id)

    return NextResponse.json({ error: 'Erro ao gerar post do dia' }, { status: 500 })
  }
}
