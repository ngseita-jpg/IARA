import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
  imagem_index?: number  // índice da imagem do usuário a usar nesse slide (0, 1, 2...)
}

export type CarrosselData = {
  slides: Slide[]
  paleta: { primaria: string; secundaria: string; texto: string }
  fonte_sugerida: string
  raciocinio: string
}

function buildSystemPrompt(perfil: Record<string, unknown> | null): string {
  return `Você é a Iara, especialista em design de carrosséis para criadores de conteúdo brasileiros.

Você gera a estrutura completa de carrosséis no formato JSON, pensando como um designer estratégico que conhece profundamente o criador.

## Regras de design
- Nunca coloque texto em cima de rostos ou elementos centrais importantes da imagem
- Prefira posicionamentos nas bordas, bases ou topos quando a imagem tiver foco central
- Use "moldura_branca" ou "moldura_preta" quando a imagem for muito carregada e dificultar a leitura
- "overlay_escuro" funciona bem para imagens claras com texto claro
- Texto curto → fonte grande. Texto longo → fonte pequena
- Capa: impacto máximo, frase curta, chama para continuar
- Slides de conteúdo: 1 ideia por slide, linguagem do criador
- Encerramento: CTA claro e direto

## Perfil do criador
${perfil ? `Nome: ${perfil.nome_artistico ?? 'não informado'}
Nicho: ${perfil.nicho ?? 'não informado'}
Tom de voz: ${perfil.tom_de_voz ?? 'não informado'}
Persona: ${perfil.sobre ?? 'não informado'}` : 'Perfil não configurado — use linguagem direta e brasileira.'}

## Formato de saída (JSON puro, sem markdown)
{
  "slides": [
    {
      "ordem": 1,
      "tipo": "capa",
      "titulo": "título impactante",
      "corpo": "subtítulo ou complemento",
      "layout": "base",
      "tamanho_fonte": "gigante",
      "cor_texto": "#ffffff",
      "cor_fundo_texto": "rgba(0,0,0,0.6)",
      "emoji": "🔥",
      "imagem_index": 0
    }
  ],
  "paleta": { "primaria": "#6B5FD0", "secundaria": "#C9A84C", "texto": "#ffffff" },
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
  console.log('[carrossel/gerar] step 3: req.json')
  const { conteudo, instrucoes, num_slides, imagens_base64, historico } = await req.json()

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

  // Montar contexto das imagens se houver
  const imagensContext = imagens_base64?.length
    ? `\n\nO criador forneceu ${imagens_base64.length} imagem(ns) de fundo. Ao definir imagem_index em cada slide, distribua as imagens de forma inteligente. Analise cada imagem e escolha o layout ideal para não cobrir partes importantes.`
    : '\n\nNenhuma imagem foi fornecida — use layouts com fundo de cor sólida (use cor_fundo_texto para o bloco inteiro).'

  const userMsg = `Crie um carrossel com ${num_slides ?? 6} slides sobre o seguinte conteúdo:

${conteudo}

Instruções adicionais do criador: ${instrucoes || 'nenhuma'}
${imagensContext}

Retorne APENAS o JSON, sem nenhum texto antes ou depois.`

  // Montar mensagens (inclui histórico para chat de ajustes)
  const messages: Anthropic.MessageParam[] = historico?.length
    ? [...historico, { role: 'user' as const, content: userMsg }]
    : [{ role: 'user' as const, content: userMsg }]

  // Se tiver imagens, adicionar como vision na última mensagem
  let finalUserContent: Anthropic.MessageParam['content'] = userMsg
  if (imagens_base64?.length && !historico?.length) {
    finalUserContent = [
      { type: 'text', text: userMsg },
      ...imagens_base64.slice(0, 4).map((b64: string) => ({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: 'image/jpeg' as const,
          data: b64.replace(/^data:image\/\w+;base64,/, ''),
        },
      })),
    ]
    messages[messages.length - 1] = { role: 'user', content: finalUserContent }
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 3000,
      system: buildSystemPrompt(perfil as Record<string, unknown> | null),
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

    return NextResponse.json({ carrossel, assistant_message: texto })
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
