import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { PONTOS_ACOES, getLevel } from '@/lib/badges'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const { data } = await supabase
    .from('voice_analyses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return new Response(JSON.stringify(data ?? []), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const { transcript, duracao_segundos, word_count } = await req.json()

  if (!transcript || transcript.trim().length < 20) {
    return new Response(JSON.stringify({ error: 'Transcrição muito curta para análise' }), { status: 400 })
  }

  const ppm = duracao_segundos > 0
    ? Math.round((word_count / duracao_segundos) * 60)
    : 0

  const prompt = `Você é um especialista em oratória, comunicação vocal e desenvolvimento pessoal para criadores de conteúdo brasileiros.

Analise a transcrição abaixo e forneça uma avaliação completa da oratória do criador.

MÉTRICAS OBJETIVAS:
- Duração da fala: ${duracao_segundos} segundos
- Taxa de fala: ${ppm} palavras por minuto (ideal: 120-150 ppm)
- Total de palavras: ${word_count}

TRANSCRIÇÃO:
"${transcript}"

Avalie nas 5 dimensões e retorne SOMENTE JSON válido (sem markdown, sem texto extra):

{
  "scores": {
    "confianca": <0-100, baseado em vocabulário assertivo, ausência de hesitações, afirmações claras>,
    "energia": <0-100, baseado em dinamismo, entusiasmo, variação de ritmo no texto>,
    "fluidez": <0-100, baseado em ausência de repetições, transições suaves, organização>,
    "emocao": <0-100, baseado em expressividade, conexão humana, storytelling>,
    "clareza": <0-100, baseado em objetividade, estrutura, fácil compreensão>
  },
  "score_total": <média ponderada: confianca*0.25 + energia*0.15 + fluidez*0.25 + emocao*0.15 + clareza*0.20>,
  "perfil_voz": "<1 frase descrevendo o estilo vocal: ex: 'Voz confiante e direta, ritmo acelerado, energia alta, tom informal e próximo'>",
  "feedback": "<3-4 linhas de feedback personalizado e honesto, destacando pontos fortes e áreas de melhoria>",
  "exercicios": [
    "<exercício prático específico 1 para treinar em casa>",
    "<exercício prático específico 2>",
    "<exercício prático específico 3>"
  ],
  "ponto_forte": "<1 ponto forte principal>",
  "ponto_melhorar": "<1 ponto principal para melhorar>"
}`

  let analysisData: {
    scores: { confianca: number; energia: number; fluidez: number; emocao: number; clareza: number }
    score_total: number
    perfil_voz: string
    feedback: string
    exercicios: string[]
    ponto_forte: string
    ponto_melhorar: string
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    analysisData = JSON.parse(raw)
  } catch {
    return new Response(JSON.stringify({ error: 'Erro ao analisar transcrição' }), { status: 500 })
  }

  // Salvar análise no banco
  const { data: analysis, error: analysisError } = await supabase
    .from('voice_analyses')
    .insert({
      user_id: user.id,
      transcript,
      duracao_segundos,
      palavras_por_minuto: ppm,
      score_confianca:  analysisData.scores.confianca,
      score_energia:    analysisData.scores.energia,
      score_fluidez:    analysisData.scores.fluidez,
      score_emocao:     analysisData.scores.emocao,
      score_clareza:    analysisData.scores.clareza,
      score_total:      analysisData.score_total,
      feedback:         analysisData.feedback,
      exercicios:       analysisData.exercicios,
      perfil_voz:       analysisData.perfil_voz,
    })
    .select()
    .single()

  if (analysisError) {
    return new Response(JSON.stringify({ error: analysisError.message }), { status: 500 })
  }

  // Buscar perfil atual para atualizar pontos e nível
  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('pontos, treinos_voz, voz_score_medio')
    .eq('user_id', user.id)
    .single()

  const pontosAtuais = profile?.pontos ?? 0
  const treinosAtuais = profile?.treinos_voz ?? 0
  const scoresMedioAtual = profile?.voz_score_medio ?? 0
  const novosPoints = pontosAtuais + PONTOS_ACOES.ANALISE_VOZ
  const novoNivel = getLevel(novosPoints)
  const novoScoreMedio = treinosAtuais === 0
    ? analysisData.score_total
    : Math.round((scoresMedioAtual * treinosAtuais + analysisData.score_total) / (treinosAtuais + 1))

  // Upsert do perfil com voz e pontos atualizados
  await supabase
    .from('creator_profiles')
    .upsert({
      user_id: user.id,
      pontos: novosPoints,
      nivel: novoNivel,
      treinos_voz: treinosAtuais + 1,
      voz_perfil: analysisData.perfil_voz,
      voz_score_medio: novoScoreMedio,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  return new Response(
    JSON.stringify({
      analysis,
      pontos_ganhos: PONTOS_ACOES.ANALISE_VOZ,
      pontos_total: novosPoints,
      nivel: novoNivel,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
