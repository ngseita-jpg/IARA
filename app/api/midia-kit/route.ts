import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getBadgeInfo } from '@/lib/badges'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const {
    parcerias_anteriores,
    pacotes,
    bio_comercial_extra,
    contato,
    site,
  } = await req.json()

  const { verificarLimite, respostaLimiteAtingido } = await import('@/lib/checkLimite')
  const check = await verificarLimite(supabase, user.id, 'midia_kit')
  if (!check.permitido) return respostaLimiteAtingido(check.limite, check.usado, check.plano)

  // Buscar tudo do sistema
  const [
    { data: profile },
    { data: metricas },
    { data: ultimaVoz },
  ] = await Promise.all([
    supabase
      .from('creator_profiles')
      .select('nome_artistico, nicho, tom_de_voz, plataformas, objetivo, sobre, pontos, nivel, voz_perfil, voz_score_medio, treinos_voz')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('metricas_redes')
      .select('plataforma, seguidores, alcance_mensal, visualizacoes_mensais, taxa_engajamento, posts_mensais')
      .eq('user_id', user.id),
    supabase
      .from('voice_analyses')
      .select('score_total, perfil_voz, feedback')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  const badge = profile ? getBadgeInfo(profile.pontos ?? 0, profile.nicho ?? undefined) : null

  // Formatar métricas para o prompt
  const metricasTexto = (metricas ?? []).map((m) => {
    const PLAT: Record<string, string> = {
      instagram: 'Instagram', youtube: 'YouTube', tiktok: 'TikTok',
      linkedin: 'LinkedIn', twitter: 'Twitter/X',
    }
    const views = m.visualizacoes_mensais ?? m.alcance_mensal ?? 0
    const parts = [
      `${PLAT[m.plataforma] ?? m.plataforma}:`,
      m.seguidores ? `  Seguidores: ${m.seguidores.toLocaleString('pt-BR')}` : null,
      views ? `  Alcance/Views mensais: ${views.toLocaleString('pt-BR')}` : null,
      m.taxa_engajamento ? `  Taxa de engajamento: ${m.taxa_engajamento}%` : null,
      m.posts_mensais ? `  Posts mensais: ${m.posts_mensais}` : null,
    ].filter(Boolean)
    return parts.join('\n')
  }).join('\n\n')

  const totalSeguidores = (metricas ?? []).reduce((s, m) => s + (m.seguidores ?? 0), 0)

  const prompt = `Você é especialista em mídia kits para influenciadores e criadores de conteúdo brasileiros. Escreva de forma profissional, mas com a personalidade do criador — não genérico.

DADOS DO CRIADOR:
- Nome/Marca: ${profile?.nome_artistico ?? 'não informado'}
- Nicho: ${profile?.nicho ?? 'não informado'}
- Tom de voz: ${profile?.tom_de_voz ?? 'não informado'}
- Sobre: ${profile?.sobre ?? 'não informado'}
- Objetivo: ${profile?.objetivo ?? 'não informado'}
${profile?.voz_perfil ? `- Personalidade vocal/comunicação: ${profile.voz_perfil}` : ''}
${badge ? `- Nível na plataforma: ${badge.badge} (${profile?.pontos ?? 0} pontos)` : ''}

MÉTRICAS:
Total de seguidores: ${totalSeguidores.toLocaleString('pt-BR')}
${metricasTexto || 'Métricas não informadas'}

${ultimaVoz?.score_total ? `ANÁLISE DE ORATÓRIA: Score ${ultimaVoz.score_total}/100` : ''}
${parcerias_anteriores ? `\nPARCERIAS ANTERIORES:\n${parcerias_anteriores}` : ''}
${pacotes ? `\nPACOTES/PREÇOS:\n${pacotes}` : ''}
${bio_comercial_extra ? `\nINFO ADICIONAL:\n${bio_comercial_extra}` : ''}

Gere o mídia kit completo em JSON. Cada seção deve ter conteúdo real, personalizado, profissional e direto — sem clichês. Use dados reais onde disponíveis.

Retorne SOMENTE JSON válido:

{
  "bio_comercial": "<2-3 parágrafos. Apresenta quem é, o nicho, por que as marcas deveriam trabalhar com esse criador. Voz humana e confiante, não corporativa.>",
  "proposta_de_valor": "<3 pontos de diferencial competitivo desse criador para marcas. Seja específico ao nicho e métricas.>",
  "audiencia": "<Descrição do perfil da audiência: faixa etária estimada pelo nicho, interesses, poder de compra, comportamento de consumo. 1-2 parágrafos.>",
  "formatos_de_conteudo": [
    { "formato": "nome do formato", "descricao": "como funciona e valor para a marca" }
  ],
  "cases_e_parcerias": "<Escreva de forma profissional com base nas parcerias informadas. Se não houver, escreva um placeholder elegante: 'Disponível para primeiras parcerias — entre em contato para briefing'>",
  "pacotes": "<Formate os pacotes informados de forma limpa e profissional. Se não informado, sugira 3 pacotes típicos para o nicho com nomes criativos>",
  "cta_final": "<Frase de encerramento convidando marcas para contato. Personalizada e com a personalidade do criador. 2-3 linhas.>"
}`

  try {
    const message = await (anthropic.messages.create as (body: unknown) => Promise<Anthropic.Message>)({
      model: 'claude-opus-4-6',
      max_tokens: 3000,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON não encontrado')

    const kit = JSON.parse(jsonMatch[0])

    // Registra uso para controle de limite (fire-and-forget)
    supabase.from('content_history').insert({
      user_id: user.id,
      tipo: 'midia_kit',
      titulo: profile?.nome_artistico ?? 'Mídia Kit',
      parametros: {},
      conteudo: { bio_comercial: kit.bio_comercial?.slice(0, 200) },
    }).then(() => {})

    return new Response(
      JSON.stringify({
        kit,
        profile,
        metricas: metricas ?? [],
        badge,
        totalSeguidores,
        contato,
        site,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Erro ao gerar mídia kit:', err)
    return new Response(JSON.stringify({ error: 'Erro ao gerar mídia kit' }), { status: 500 })
  }
}
