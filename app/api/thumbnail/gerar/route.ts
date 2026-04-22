import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { joinArr } from '@/lib/parseArr'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ──────────────────────────────────────────────────────────
// Layout completamente paramétrico — sem arquétipos fixos.
// A IA decide TUDO. O renderer interpreta os parâmetros.
// ──────────────────────────────────────────────────────────
export type ThumbnailLayout = {
  // ── Texto ──
  titulo: string              // máx 5 palavras, direto ao ponto
  subtitulo?: string          // complemento curto (máx 8 palavras)
  eyebrow?: string            // label acima do título (ex: "REVELADO", "EP. 7")
  fonte:
    | 'bebas' | 'anton' | 'russo' | 'oswald' | 'inter' | 'playfair'
    | 'playfair_italic' | 'cormorant_italic' | 'dm_serif' | 'abril'
    | 'archivo_black' | 'montserrat_black'
    | 'dancing' | 'caveat'
    | 'space_grotesk' | 'poppins_black' | 'syne'
  tamanho_titulo: number      // 60–180 (px no canvas 1280×720)

  // ── Posicionamento do bloco de texto ──
  texto_ancora: 'topo_esq' | 'topo_centro' | 'topo_dir'
              | 'meio_esq'  | 'meio_centro' | 'meio_dir'
              | 'base_esq'  | 'base_centro' | 'base_dir'
  texto_largura_pct: number   // 35–100 — percentual da largura ocupado pelo bloco de texto

  // ── Fundo ──
  fundo_tipo: 'cor_solida' | 'gradiente_linear' | 'gradiente_radial'
  fundo_cor1: string          // hex
  fundo_cor2?: string         // hex — segunda cor do gradiente
  fundo_direcao?: 'horizontal' | 'vertical' | 'diagonal_135' | 'diagonal_45'

  // ── Foto (quando fornecida) ──
  foto_zona: 'full'           // foto ocupa tudo (com overlay)
           | 'esquerda_40' | 'esquerda_50' | 'esquerda_60'
           | 'direita_40'  | 'direita_50'  | 'direita_60'
           | 'topo_50'     | 'base_50'
           | 'nenhuma'
  foto_overlay_cor?: string   // ex: "rgba(0,0,0,0.55)" — overlay sobre a foto
  foto_object_pos?: string    // "center", "top", "bottom", "left", "right"

  // ── Cores do texto ──
  titulo_cor: string          // hex — cor base do título (aplicada a cada palavra sem destaque)
  subtitulo_cor?: string      // hex
  eyebrow_cor?: string        // hex

  // ── Destaques de palavras específicas ──
  // Cada item sobrescreve a cor de uma palavra individual do título (index 0-based).
  // Usado para dar ênfase cromática (ex: "Você NÃO É desfocada... você É cíclica")
  palavras_destaque?: Array<{ indice: number; cor: string }>

  // ── Caixa/fundo atrás do título ──
  titulo_fundo?: string       // hex ou rgba — null = sem caixa
  titulo_fundo_raio?: number  // border-radius da caixa (0–24)

  // ── Efeitos no título ──
  titulo_sombra?: boolean
  titulo_contorno?: boolean
  titulo_contorno_cor?: string

  // ── Badge ──
  badge?: string              // ex: "GRÁTIS", "#1", "NOVO"
  badge_cor_fundo?: string
  badge_cor_texto?: string
  badge_posicao?: 'topo_esq' | 'topo_dir' | 'base_esq' | 'base_dir'

  // ── Acento visual ──
  linha_acento?: boolean      // linha/barra colorida ao lado ou embaixo do título
  linha_acento_cor?: string

  raciocinio: string
}

function buildSystemPrompt(perfil: Record<string, unknown> | null): string {
  return `Você é a Iara, designer de thumbnails de altíssimo CTR para criadores de conteúdo brasileiros.

Sua função é criar thumbnails ÚNICAS, fiéis ao conteúdo e ao criador, usando parâmetros de layout livre. Cada thumbnail que você cria deve ser diferente da anterior — nunca repita combinações de cor, fonte e posicionamento.

## Psicologia de alta conversão em thumbnails

**O viewer decide em 0.3s se clica ou não. O que determina isso:**
1. Contraste extremo — texto 100% legível contra qualquer fundo, em qualquer tamanho de tela
2. Uma emoção clara e forte (curiosidade, choque, benefício óbvio, urgência)
3. Texto mínimo — 3-5 palavras no título. Cada palavra deve ser necessária.
4. Hierarquia visual imediata — o olho vai direto ao ponto mais importante
5. Cor que destaca no feed — thumbnails mediocres usam azul escuro e branco. As que explodem usam combinações inesperadas.

**Fontes e seus efeitos psicológicos:**
- bebas: Condensado, todo maiúsculo. Urgência. Esporte. Energia. Clickbait de qualidade.
- anton: Ultra-bold condensado. Impacto. Notícia. Drama. Gravidade.
- russo: Blocky espesso. Autoridade. Gaming. Masculino. Robusto.
- oswald: Condensado limpo. Moderno. Versátil. Tech. Profissional com energia.
- inter: Sans limpo. Educativo. Confiança. Minimalismo inteligente.
- playfair: Serifado bold. Luxury. Lifestyle. Feminino. Editorial premium.
- playfair_italic: Serifado itálico dramático. Feminilidade sofisticada. Moda. Bem-estar. Citação inspiracional.
- cormorant_italic: Serifado itálico delicado. Delicadeza refinada. Beleza. Maternidade. Arte.
- dm_serif: Serifado alto contraste. Editorial chique. Design. Arquitetura. Premium sóbrio.
- abril: Serifado grosso dramático. Vintage poster. Arte. Moda retrô. Confiança histórica.
- archivo_black: Sans ultra-forte geométrico. Statement. Arte urbana. Branding marcante.
- montserrat_black: Sans geométrico pesado. Negócio. Autoajuda. Motivação. Fitness moderno.
- dancing: Script cursiva elegante. Casamento. Maternidade. Artesanato. Beleza orgânica.
- caveat: Manuscrita espontânea. Autenticidade. Bastidores. Casual. Humor.
- space_grotesk: Sans geométrica moderna. Tech. Startup. Web3. Futurista minimalista.
- poppins_black: Sans redondo pesado. Acolhedor. Educação infantil. Lifestyle positivo.
- syne: Display quirky contemporâneo. Criativo. Design jovem. Arte contemporânea.

**Regras de contraste obrigatórias:**
- Texto claro (#ffffff, #f5f5f5) sobre fundos escuros (valor <50% de brilho)
- Texto escuro (#0a0a0a, #1a1a1a) sobre fundos claros (valor >70% de brilho)
- Nunca texto cinza sobre fundo cinza
- Se a foto domina o frame, use titulo_fundo ou titulo_sombra SEMPRE

**Zonas da foto vs texto:**
- foto_zona "full": foto em todo frame — precisa de overlay escuro no título
- foto_zona "esquerda_50": foto ocupa metade esquerda — texto vai à direita sobre fundo sólido
- foto_zona "direita_50": oposto — cria hierarquia visual boa quando rosto olha para o texto
- foto_zona "nenhuma": tipografia pura — use cores ousadas no fundo

**Posicionamento do texto:**
- "base_esq" ou "base_centro": clássico YouTube — título na base, foto no topo
- "meio_esq" + foto_zona "direita_50": layout split limpo
- "topo_centro": para eyebrow + título grandioso + subtítulo abaixo
- "meio_centro": máximo drama — texto centralizado, foto como textura de fundo

**Destaques de palavras (palavras_destaque):**
- Use para enfatizar palavras-chave específicas com uma cor diferente da cor base.
- "indice" é a posição (0-based) da palavra no título. Ex: em "Você não é desfocada", "você"=0, "não"=1, "é"=2, "desfocada"=3.
- Padrões que funcionam: destacar adjetivos-chave, números, emoções, palavras de negação/afirmação.
- Use cores que contrastem com titulo_cor MAS complementem fundo_cor1 (ex: rosa em fundo escuro, amarelo em fundo roxo).
- Máximo 3-4 palavras destacadas por título — mais do que isso vira ruído.
- Omita o campo se não fizer sentido destacar nada.

## Perfil do criador
${perfil ? `Nome: ${perfil.nome_artistico ?? 'não informado'}
Nicho: ${perfil.nicho ?? 'não informado'}
Tom de voz: ${joinArr(perfil.tom_de_voz) || 'não informado'}` : 'Perfil não configurado — otimize para máximo CTR geral.'}

## Formato de saída (JSON puro, sem markdown)
Preencha TODOS os campos obrigatórios. Campos opcionais: omita se não for usar.

{
  "titulo": "3-5 PALAVRAS IMPACTO",
  "subtitulo": "complemento opcional curto",
  "eyebrow": "LABEL OPCIONAL",
  "fonte": "bebas",
  "tamanho_titulo": 140,
  "texto_ancora": "base_centro",
  "texto_largura_pct": 85,
  "fundo_tipo": "cor_solida",
  "fundo_cor1": "#0a0a0a",
  "fundo_cor2": "#1a0030",
  "fundo_direcao": "diagonal_135",
  "foto_zona": "full",
  "foto_overlay_cor": "rgba(0,0,0,0.5)",
  "foto_object_pos": "center",
  "titulo_cor": "#ffffff",
  "subtitulo_cor": "#e0e0e0",
  "eyebrow_cor": "#f59e0b",
  "palavras_destaque": [{ "indice": 1, "cor": "#ec4899" }, { "indice": 2, "cor": "#ec4899" }],
  "titulo_fundo": null,
  "titulo_sombra": true,
  "titulo_contorno": false,
  "badge": "GRÁTIS",
  "badge_cor_fundo": "#ef4444",
  "badge_cor_texto": "#ffffff",
  "badge_posicao": "topo_dir",
  "linha_acento": true,
  "linha_acento_cor": "#f59e0b",
  "raciocinio": "1 frase explicando as escolhas de design para maximizar CTR neste conteúdo"
}`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { titulo_video, descricao, imagem_base64, historico, fonte_override } = await req.json()

  const { data: perfil } = await supabase
    .from('creator_profiles')
    .select('nome_artistico, nicho, tom_de_voz, plano')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!historico?.length) {
    const { verificarLimite, respostaLimiteAtingido } = await import('@/lib/checkLimite')
    const plano = ((perfil?.plano as string) ?? 'free') as import('@/lib/limites').Plano
    const check = await verificarLimite(supabase, user.id, 'thumbnail', plano)
    if (!check.permitido) return respostaLimiteAtingido(check.limite, check.usado, check.plano)
  }

  const temFoto = !!imagem_base64

  const userMsg = `Crie um layout de thumbnail de MÁXIMO CTR para este vídeo.

Título do vídeo: "${titulo_video || 'Não informado'}"
Contexto: ${descricao || 'Não informado'}
${temFoto
  ? 'FOTO FORNECIDA — use a foto como elemento visual central. Escolha foto_zona baseado no conteúdo da imagem.'
  : 'SEM FOTO — use tipografia dominante com fundo colorido/gradiente impactante. foto_zona = "nenhuma".'
}
${fonte_override ? `Fonte preferida pelo usuário: ${fonte_override}` : ''}

Crie um design ÚNICO e fiel a esse conteúdo específico. Pense no nicho, no tom e no que vai fazer esse público específico clicar.
Retorne APENAS o JSON.`

  const messages: Anthropic.MessageParam[] = historico?.length
    ? [...historico, { role: 'user' as const, content: userMsg }]
    : [{ role: 'user' as const, content: userMsg }]

  if (imagem_base64 && !historico?.length) {
    messages[messages.length - 1] = {
      role: 'user',
      content: [
        { type: 'text', text: userMsg },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: imagem_base64.replace(/^data:image\/\w+;base64,/, ''),
          },
        },
      ],
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: [
        {
          type: 'text',
          text: buildSystemPrompt(perfil as Record<string, unknown> | null),
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
    })

    const texto = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'IA não retornou JSON válido' }, { status: 500 })

    const layout: ThumbnailLayout = JSON.parse(jsonMatch[0])

    return NextResponse.json({ layout, assistant_message: texto })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao gerar thumbnail' }, { status: 500 })
  }
}
