import Anthropic from '@anthropic-ai/sdk'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ImagemAnalise } from '../analisar-imagens/route'

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
  // Dados da análise visual — usados pelo renderer para object-position e fallback de arquétipo
  foto_foco?: 'topo' | 'centro' | 'base' | 'esquerda' | 'direita' | 'distribuido'
  foto_tem_rosto?: boolean
}

export type CarrosselData = {
  slides: Slide[]
  paleta: { primaria: string; secundaria: string; texto: string }
  fonte_sugerida: string
  raciocinio: string
}

const PLATAFORMA_CONTEXT: Record<string, string> = {
  instagram: 'Instagram — visual impactante, textos curtos e diretos, ganchos fortes no primeiro slide, emojis com moderação, máx 2 linhas por slide',
  linkedin:  'LinkedIn — tom profissional e educativo, conteúdo de valor, storytelling com aprendizado, menos emojis, mais dados e insights práticos',
  tiktok:    'TikTok — jovem, dinâmico e direto, linguagem super descontraída, slides rápidos de ler, muito gancho e curiosidade entre slides',
  pinterest: 'Pinterest — visual e inspiracional, títulos marcantes, conteúdo evergreen, foco em estética e utilidade prática, subtítulos descritivos',
}

function buildSystemPrompt(perfil: Record<string, unknown> | null, modo: string, plataforma?: string): string {
  const isMarca = modo === 'marca'
  const plataformaCtx = plataforma && PLATAFORMA_CONTEXT[plataforma]
    ? `\n\n## Plataforma de destino\n${PLATAFORMA_CONTEXT[plataforma]}`
    : ''
  return `Você é a Iara, estrategista de conteúdo e designer de carrosséis para ${isMarca ? 'marcas e empresas brasileiras' : 'criadores de conteúdo brasileiros'}.${plataformaCtx}

Você combina copywriting de alto nível com design visual inteligente. Seu objetivo é gerar carrosséis que param o scroll, geram salvamentos e convertem — não apenas apresentam informação.

## Princípios de copywriting obrigatórios

### CAPA (slide 1) — o gancho que para o scroll
- Use uma das estruturas: PROMESSA OUSADA ("Eu faturei R$50k sem mostrar o rosto"), PERGUNTA QUE DÓI ("Por que seu conteúdo não engaja?"), NÚMERO ESPECÍFICO ("3 erros que matam seu crescimento"), SEGREDO REVELADO ("O que as grandes marcas não te contam")
- O título da capa deve ser curto (máx 8 palavras), impactante, e criar CURIOSIDADE ou TENSÃO
- Nunca comece com "Como", "Dicas de", "Confira" — isso é genérico e não para o scroll

### SLIDES DE CONTEÚDO — valor real, ritmo de leitura
- Cada slide tem UMA ideia central — não faça resumos, explore cada ponto com profundidade
- Use microcopys de gancho entre slides: termine cada slide deixando o leitor curioso pelo próximo
- Alterne entre: revelação de dado/fato surpresa → dica acionável → história/exemplo → insight contraintuitivo
- Escreva como quem conversa, não como quem apresenta. Use "você", "sua", gírias profissionais do nicho
- CORPO dos slides: máx 2-3 frases curtas. Seja direto. Cada palavra deve ganhar seu lugar

### ENCERRAMENTO (último slide) — conversão
- CTA específico e único ("Salve esse post pra não esquecer", "Manda esse pra alguém que precisa", "Comenta o número da dica que mais te pegou")
- Evite CTAs genéricos ("Siga para mais conteúdo", "Deixe seu like")

## Arquétipos disponíveis (campo "arquetipo")
${isMarca ? `
- brand_cover: capa da marca — título de posicionamento na base, foto full-bleed com scrim
- brand_story: story da marca — título grande à esquerda, texto à direita, foto como background
- brand_promo: encerramento/promoção — gradiente, título, corpo e CTA com botão
` : `
- cover_full: capa clássica — foto full-bleed, título grande na base com scrim escuro
- split_v: split vertical — texto à esquerda (40%), foto à direita (60%). Seguro para rostos
- top_text: texto na metade superior, foto na metade inferior. Seguro para rostos no centro/base
- full_bleed: foto preenche tudo, texto no centro-base com scrim
- quote: citação tipográfica — overlay escuro, aspas gigantes, texto centralizado
- closing: encerramento — sem foto, gradiente dark, CTA central e handle
- editorial: painel branco à esquerda (estética revista/luxo), foto à direita — visual clean e premium
- cinematic: estilo cinema — foto na faixa central, barras pretas topo e base com texto. Visual impactante
- caption_bar: foto ocupa 65% superior, barra escura com texto na base — estilo feed moderno
- inset_photo: foto emoldurada com margens visíveis — design de card premium, não full-bleed
- warm_overlay: overlay âmbar/quente sobre a foto — clima lifestyle, humano, orgânico
- bold_type: tipografia enorme dominante (fonte gigante), foto como textura de fundo sutil
- side_right: foto à esquerda (55%), painel de texto à direita — inverso do split_v
- neon_card: card centralizado com borda luminosa, foto no fundo com overlay forte — visual tech/premium
`}

## Regras de arquétipo e foto
- Slide 1: "${isMarca ? 'brand_cover' : 'cover_full'}" (ou "split_v" como alternativa criativa)
- Último slide: "${isMarca ? 'brand_promo' : 'closing'}"
- Nunca repita o mesmo arquétipo dois slides seguidos
- RESPEITE as restrições de cada foto indicadas na análise visual — se a análise diz para evitar um arquétipo, não use
- Se não tiver imagem disponível: use "quote" ou "${isMarca ? 'brand_cover' : 'closing'}"

## Campos
- "eyebrow": texto pequeno acima do título (ex: "dica 02 · marketing", "insight · carreira")
- "handle": arroba do criador no slide de encerramento
- "imagem_index": OBRIGATÓRIO nos arquétipos visuais. Use o índice da foto que melhor se encaixa com o conteúdo do slide, conforme a análise visual

## Perfil ${isMarca ? 'da marca' : 'do criador'}
${perfil ? `Nome: ${perfil.nome_artistico ?? 'não informado'}
Nicho: ${perfil.nicho ?? 'não informado'}
Tom de voz: ${perfil.tom_de_voz ?? 'não informado'}
Sobre: ${perfil.sobre ?? 'não informado'}` : 'Perfil não configurado — use linguagem direta, brasileira e próxima do leitor.'}

## Formato de saída (JSON puro, sem markdown)
{
  "slides": [
    {
      "ordem": 1,
      "tipo": "capa",
      "arquetipo": "${isMarca ? 'brand_cover' : 'cover_full'}",
      "eyebrow": "conteúdo · nicho",
      "titulo": "título que para o scroll",
      "corpo": "subtítulo que amplia a promessa",
      "handle": "@handle",
      "layout": "base",
      "tamanho_fonte": "gigante",
      "cor_texto": "#ffffff",
      "imagem_index": 0
    }
  ],
  "paleta": { "primaria": "#6366f1", "secundaria": "#a855f7", "texto": "#ffffff" },
  "fonte_sugerida": "Inter",
  "raciocinio": "explique brevemente suas escolhas de design e copy"
}

## Qualidade do texto — REGRAS OBRIGATÓRIAS
- Escreva em português brasileiro fluente e natural — zero erros gramaticais
- Títulos: máximo 8 palavras, diretos, impactantes, sem clichês
- Corpo: frases curtas (máximo 20 palavras), concretas, acionáveis
- NUNCA use: "Descubra", "Incrível", "Transforme sua vida", "Você merece", "Dica poderosa"
- Use linguagem de quem realmente entende do assunto — específico, concreto, direto
- Cada slide deve ter UMA ideia central, não três mezcladas`
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
  const num_imagens = typeof body.num_imagens === 'number' ? body.num_imagens : 0
  const num_slides_solicitado = typeof body.num_slides === 'number' ? body.num_slides : 6
  const incluir_encerramento = body.incluir_encerramento !== false // default true
  const num_slides = Math.max(num_slides_solicitado, num_imagens > 0 && incluir_encerramento ? num_imagens + 1 : num_imagens > 0 ? num_imagens : 0)
  const historico = body.historico as Anthropic.MessageParam[] | undefined
  const modo = (body.modo as string | undefined) ?? 'criador'
  const plataforma = (body.plataforma as string | undefined) ?? 'instagram'
  const analise_imagens = body.analise_imagens as ImagemAnalise[] | undefined

  console.log('[carrossel/gerar] step 4: perfil query')
  const adminClient = createAdminClient()
  const { data: perfil, error: perfilErr } = await adminClient
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

  const analiseCtx = (() => {
    if (!num_imagens) return '\n\nNenhuma imagem foi fornecida — use layouts com fundo de cor sólida. Não defina imagem_index em nenhum slide.'

    const regrasBase = `\n\n## Imagens disponíveis: ${num_imagens} foto(s) (índices 0 a ${num_imagens - 1})

REGRA CRÍTICA: Cada imagem DEVE ser usada em pelo menos um slide. Com ${num_slides} slides e ${num_imagens} imagens, distribua de forma que nenhuma foto fique de fora.`

    if (!analise_imagens?.length) {
      return regrasBase + '\nDistribua os imagem_index de forma variada. Preste atenção no arquétipo escolhido para não cobrir rostos com texto.'
    }

    const detalhes = analise_imagens.map(a =>
      `Foto ${a.index}: ${a.descricao}. Mood: ${a.mood}. Foco: ${a.posicao_foco}. ${a.tem_rosto ? 'TEM ROSTO.' : 'Sem rosto.'} Arquetipos recomendados: [${a.arquetipos_recomendados.join(', ')}]. EVITAR: [${a.arquetipos_evitar.join(', ')}]. Para o copy: ${a.contexto_copy}`
    ).join('\n')

    return `${regrasBase}\n\n### Análise visual de cada foto:\n${detalhes}\n\nUse a análise visual para:
1. Escolher o arquétipo certo para cada foto (respeite EVITAR)
2. Escrever o copy alinhado com o mood e contexto da foto
3. Garantir que rostos fiquem visíveis e não cobertos por texto`
  })()

  const encerramentoInstrucao = incluir_encerramento
    ? ''
    : '\n\nIMPORTANTE: NÃO inclua slide de encerramento/closing. Todos os slides devem ser de conteúdo (tipo "conteudo"), exceto o slide 1 que é a capa.'

  const userMsg = `Crie um carrossel com exatamente ${num_slides} slides sobre o seguinte conteúdo:${encerramentoInstrucao}

${conteudo}

Instruções adicionais: ${instrucoes || 'nenhuma'}
${analiseCtx}

Retorne APENAS o JSON, sem nenhum texto antes ou depois.`

  const messages: Anthropic.MessageParam[] = historico?.length
    ? [...historico, { role: 'user' as const, content: userMsg }]
    : [{ role: 'user' as const, content: userMsg }]

  console.log('[carrossel/gerar] num_imagens:', num_imagens, 'num_slides solicitado:', num_slides_solicitado, 'num_slides final:', num_slides)

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: [
        {
          type: 'text',
          text: buildSystemPrompt(perfil as Record<string, unknown> | null, modo, plataforma),
          cache_control: { type: 'ephemeral' },
        },
      ],
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

    // ── Revisão automática do texto ──────────────────────────────────────────
    try {
      const slidesParaRevisar = carrossel.slides.map(s => ({
        ordem: s.ordem, titulo: s.titulo, corpo: s.corpo, cta: s.cta, eyebrow: s.eyebrow
      }))
      const revisao = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Você é um revisor de texto especializado em copy para redes sociais brasileiras. Revise e melhore SOMENTE os textos (titulo, corpo, cta, eyebrow) dos slides abaixo. Mantenha a intenção e o tamanho — apenas corrija erros, melhore fluidez e torne cada frase mais humana e natural de ler em voz alta. Retorne APENAS JSON com o mesmo formato:

${JSON.stringify(slidesParaRevisar)}

Regras:
- Zero erros gramaticais
- Português brasileiro natural (como um humano falaria)
- Títulos: impactantes, diretos, máx 8 palavras
- Nenhum clichê: sem "Descubra", "Incrível", "Transforme", "Poderoso"
- Se o texto já estiver bom, mantenha igual
- Retorne APENAS o JSON array, sem markdown nem explicações`
        }]
      })
      const revisadoRaw = revisao.content[0].type === 'text' ? revisao.content[0].text.trim() : null
      if (revisadoRaw) {
        const slidesr: Array<{ordem:number;titulo?:string;corpo?:string;cta?:string;eyebrow?:string}> = JSON.parse(revisadoRaw.replace(/^```[a-z]*\n?/,'').replace(/\n?```$/,''))
        for (const rev of slidesr) {
          const orig = carrossel.slides.find(s => s.ordem === rev.ordem)
          if (orig) {
            if (rev.titulo)  orig.titulo  = rev.titulo
            if (rev.corpo)   orig.corpo   = rev.corpo
            if (rev.cta)     orig.cta     = rev.cta
            if (rev.eyebrow) orig.eyebrow = rev.eyebrow
          }
        }
      }
    } catch { /* revisão falhou silenciosamente — usa texto original */ }

    if (!carrossel?.slides?.length) {
      return NextResponse.json({ error: 'A IA não gerou slides. Tente novamente.' }, { status: 500 })
    }

    // Post-processamento: garantir que todas as imagens sejam usadas
    if (num_imagens > 0) {
      const usados = new Set(
        carrossel.slides
          .filter(s => s.imagem_index !== undefined)
          .map(s => s.imagem_index!)
      )

      const faltando = Array.from({ length: num_imagens }, (_, i) => i).filter(i => !usados.has(i))

      if (faltando.length > 0) {
        // Candidatos: slides que reutilizam índice OU têm quote no meio do carrossel
        const candidatos = carrossel.slides.filter(s =>
          s.tipo !== 'encerramento' &&
          (s.arquetipo === 'quote' ||
            (s.imagem_index !== undefined &&
              carrossel.slides.filter(s2 => s2.imagem_index === s.imagem_index).length > 1))
        )

        for (let i = 0; i < faltando.length && i < candidatos.length; i++) {
          const slide = candidatos[i]
          slide.imagem_index = faltando[i]
          if (slide.arquetipo === 'quote') slide.arquetipo = 'full_bleed'
        }
      }

      // Enriquece cada slide com dados de análise visual da foto atribuída
      if (analise_imagens?.length) {
        carrossel.slides.forEach(slide => {
          if (slide.imagem_index === undefined) return
          const analise = analise_imagens.find(a => a.index === slide.imagem_index)
          if (analise) {
            slide.foto_foco = analise.posicao_foco
            slide.foto_tem_rosto = analise.tem_rosto
          }
        })
      }
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
