import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PLATAFORMA_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
}

function formatarNumero(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const { metricas, profile } = await req.json()

  if (!metricas || metricas.length === 0) {
    return new Response(JSON.stringify({ error: 'Nenhuma métrica para analisar' }), { status: 400 })
  }

  // Montar contexto das métricas
  const metricasTexto = metricas.map((m: Record<string, unknown>) => {
    const plat = PLATAFORMA_LABELS[m.plataforma as string] ?? m.plataforma
    const linhas = [
      `\n${plat}:`,
      m.seguidores ? `  - Seguidores: ${formatarNumero(m.seguidores as number)}` : null,
      m.alcance_mensal ? `  - Alcance mensal: ${formatarNumero(m.alcance_mensal as number)}` : null,
      m.visualizacoes_mensais ? `  - Visualizações mensais: ${formatarNumero(m.visualizacoes_mensais as number)}` : null,
      m.curtidas_mensais ? `  - Curtidas mensais: ${formatarNumero(m.curtidas_mensais as number)}` : null,
      m.comentarios_mensais ? `  - Comentários mensais: ${formatarNumero(m.comentarios_mensais as number)}` : null,
      m.compartilhamentos_mensais ? `  - Compartilhamentos: ${formatarNumero(m.compartilhamentos_mensais as number)}` : null,
      m.salvamentos_mensais ? `  - Salvamentos: ${formatarNumero(m.salvamentos_mensais as number)}` : null,
      m.posts_mensais ? `  - Posts no mês: ${m.posts_mensais}` : null,
      m.taxa_engajamento ? `  - Taxa de engajamento: ${m.taxa_engajamento}%` : null,
    ].filter(Boolean)
    return linhas.join('\n')
  }).join('\n')

  const perfilContexto = profile ? `
PERFIL DO CRIADOR:
- Nome/Marca: ${profile.nome_artistico ?? 'não informado'}
- Nicho: ${profile.nicho ?? 'não informado'}
- Tom de voz: ${profile.tom_de_voz ?? 'não informado'}
- Objetivo: ${profile.objetivo ?? 'não informado'}
- Sobre: ${profile.sobre ?? 'não informado'}
${profile.voz_perfil ? `- Perfil vocal: ${profile.voz_perfil}` : ''}
` : ''

  const prompt = `Você é a Iara, especialista em crescimento de criadores de conteúdo e análise de métricas digitais. Você conhece profundamente o mercado de influenciadores brasileiro e fala de forma direta, humana e personalizada — nunca genérica ou robótica.
${perfilContexto}
MÉTRICAS ATUAIS DO CRIADOR:
${metricasTexto}

Analise esses dados e escreva uma análise estratégica personalizada. Seja específico ao nicho, ao tom de voz e ao momento desse criador. NÃO escreva listas genéricas. Escreva como alguém que realmente conhece esse criador e tem experiência real de mercado.

Estruture sua resposta assim (use exatamente esses marcadores):

[PANORAMA]
2-3 parágrafos avaliando a situação geral. Cite os números específicos. Aponte o que está indo bem e o que precisa de atenção. Seja direto e honesto.

[INSTAGRAM]
(só incluir se tiver dados do Instagram)
1-2 parágrafos com diagnóstico específico + 2-3 estratégias táticas e concretas para esse nicho e perfil.

[YOUTUBE]
(só incluir se tiver dados do YouTube)
1-2 parágrafos com diagnóstico + estratégias.

[TIKTOK]
(só incluir se tiver dados do TikTok)
1-2 parágrafos com diagnóstico + estratégias.

[LINKEDIN]
(só incluir se tiver dados do LinkedIn)
1-2 parágrafos com diagnóstico + estratégias.

[TWITTER]
(só incluir se tiver dados do Twitter/X)
1-2 parágrafos com diagnóstico + estratégias.

[FOCO_AGORA]
As 3 ações mais importantes que esse criador deve fazer nos próximos 30 dias para crescer. Numere de 1 a 3. Seja específico ao nicho e aos dados. Cada ação em 1 parágrafo.

Escreva em português brasileiro, de forma natural e personalizada. Evite clichês como "criar conteúdo de valor", "postar de forma consistente" sem contexto específico.`

  try {
    const message = await (anthropic.messages.create as (body: unknown) => Promise<Anthropic.Message>)({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: prompt }],
    })

    const analise = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('\n')

    // Salvar análise no histórico
    await supabase
      .from('analises_metricas')
      .insert({ user_id: user.id, analise })

    return new Response(
      JSON.stringify({ analise }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Erro ao gerar análise:', err)
    return new Response(JSON.stringify({ error: 'Erro ao gerar análise' }), { status: 500 })
  }
}
