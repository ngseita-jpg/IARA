import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkRateLimitUser } from '@/lib/rateLimit'
import {
  janelasHorarios, sugerirLocais, ARQUETIPO_DIA_SEMANA,
  proximaSegunda, addDias, type DiaSemana,
} from '@/lib/cronograma-heuristicas'

export const runtime = 'nodejs'
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type CronogramaItem = {
  dia_semana: DiaSemana
  data: string
  titulo: string
  plataforma: string
  tipo: string                 // 'reel' | 'carrossel' | 'post' | 'story' | 'video' | 'live'
  horario: string              // 'HH:MM'
  local: string
  gancho: string
  script: string
  cta: string
}

const SYSTEM_PROMPT = `Você é a Iara, assessora de conteúdo para criadores e profissionais brasileiros.
Sua tarefa: gerar um CRONOGRAMA SEMANAL DE POSTAGENS de 7 dias.

REGRAS OBRIGATÓRIAS:
1. Misturar formatos: variar entre reel/carrossel/post/story pra não cansar feed do follower
2. Cada dia tem ARQUÉTIPO específico (siga rigorosamente):
   - SEGUNDA: problema_doloroso (reel) — hook agressivo sobre erro/dor do nicho
   - TERÇA: dica_acionavel (carrossel) — tutorial prático salvável, 5-7 slides
   - QUARTA: historia_pessoal (reel) — vulnerabilidade, conexão emocional
   - QUINTA: case_resultado (reel) — antes/depois ou prova social
   - SEXTA: cta_engajamento (post) — pergunta provocativa pra comentários
   - SÁBADO: leve_humano (story) — bastidor, descontraído
   - DOMINGO: reflexao_inspiracao (post) — frase forte/reflexão pra começar a semana

3. HORÁRIO: escolha DENTRO das janelas fornecidas no input. Não invente horário fora.
4. LOCAL: escolha DA LISTA fornecida pro nicho (ou descreva variação plausível).
5. SCRIPT: deve ser PRONTO PRA GRAVAR/POSTAR — não brief, não rascunho.
   - Hook (1ª linha): força emocional, tensão, curiosidade
   - Desenvolvimento (3-5 linhas): específico, brasileiro, sem clichês
   - CTA: ação clara ("salve", "manda pra alguém", "comenta o número da dica")

6. EVITAR:
   - "Descubra", "Incrível", "Você merece", "Transforme sua vida"
   - Repetir tema dos últimos 14 dias (lista no input)
   - Genericismo — cada dia precisa ser ESPECÍFICO do nicho/persona

7. PORTUGUÊS BR fluente, sem erro gramatical.

OUTPUT: JSON estrito (sem markdown, sem explicação fora do JSON):
{
  "items": [{
    "dia_semana": 1, "data": "2026-05-11", "titulo": "...",
    "plataforma": "instagram", "tipo": "reel",
    "horario": "18:30", "local": "...", "gancho": "...",
    "script": "linha 1\\nlinha 2\\nlinha 3", "cta": "..."
  }, ... ],
  "raciocinio": "Explicação curta da sequência narrativa que você criou pra essa semana específica"
}`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const rl = await checkRateLimitUser(req, user.id, 'ia_geral')
  if (rl) return rl

  const { semana_inicio: semanaForcada, forcar_regeneracao = false } =
    await req.json().catch(() => ({})) as { semana_inicio?: string; forcar_regeneracao?: boolean }

  const semanaInicio = semanaForcada ?? proximaSegunda()
  const admin = createAdminClient()

  // 1. Verifica se já existe cronograma pra essa semana e nao forcou regerar
  if (!forcar_regeneracao) {
    const { data: existente, error: existenteErr } = await admin
      .from('cronograma_semanal')
      .select('id, versao')
      .eq('user_id', user.id)
      .eq('semana_inicio', semanaInicio)
      .maybeSingle()

    // Se a tabela nao existe (admin nao rodou SQL), fala claramente
    if (existenteErr && /relation.*does not exist|not found/i.test(existenteErr.message ?? '')) {
      console.error('[cronograma/gerar] tabela faltando:', existenteErr.message)
      return NextResponse.json({
        error: 'setup_pendente',
        mensagem: 'A feature ainda não está ativada. Admin precisa rodar schema_cronograma.sql no Supabase.',
      }, { status: 503 })
    }

    if (existente) {
      const { data: items } = await admin
        .from('calendar_items')
        .select('*')
        .eq('cronograma_id', existente.id)
        .order('data_planejada', { ascending: true })

      // Defensivo: se cronograma_semanal existe mas nao tem itens (orfao por
      // falha numa geracao anterior), apaga o registro pai e cai no fluxo de
      // geracao. Senao usuario fica preso vendo lista vazia eternamente.
      if (!items || items.length === 0) {
        await admin.from('cronograma_semanal').delete().eq('id', existente.id)
        // continua execucao do fluxo de geracao (nao retorna aqui)
      } else {
        return NextResponse.json({
          cronograma_id: existente.id,
          items,
          cached: true,
        })
      }
    }
  }

  // 2. Carrega persona + disponibilidade do user
  const { data: profile } = await admin
    .from('creator_profiles')
    .select(`
      nicho, tom_de_voz, plataformas, objetivo, sobre, voz_perfil, nome_artistico, plano,
      disponibilidade_dias, disponibilidade_periodos, disponibilidade_minutos, disponibilidade_compromissos
    `)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile?.nicho || !profile?.tom_de_voz) {
    return NextResponse.json({
      error: 'persona_incompleta',
      mensagem: 'Configure seu nicho e tom de voz no perfil pra a Iara montar seu cronograma.',
      redirect: '/dashboard/persona',
    }, { status: 422 })
  }

  // Disponibilidade: pre-requisito pra IA nao inventar horarios impossiveis
  const dias = profile.disponibilidade_dias as string[] | null
  if (!dias || dias.length === 0) {
    return NextResponse.json({
      error: 'disponibilidade_incompleta',
      mensagem: 'Conta primeiro quais dias e horários você consegue postar. A Iara precisa disso pra montar um cronograma realista.',
    }, { status: 422 })
  }

  // 3. Histórico recente (evita repetir tema)
  const seteDiasAtras = addDias(semanaInicio, -14)
  const { data: historicoItems } = await admin
    .from('calendar_items')
    .select('titulo')
    .eq('user_id', user.id)
    .gte('data_planejada', seteDiasAtras)
    .lt('data_planejada', semanaInicio)
    .limit(20)
  const ultimosTitulos = (historicoItems ?? []).map(h => h.titulo).filter(Boolean)

  // 4. Heuristicas pra esse nicho
  const janelas = janelasHorarios(profile.nicho)
  const locais = sugerirLocais(profile.nicho)

  // 5. Monta prompt user (system fica cacheable)
  const plataformas = Array.isArray(profile.plataformas)
    ? profile.plataformas.join(', ')
    : (profile.plataformas ?? 'instagram')

  const tomDeVoz = Array.isArray(profile.tom_de_voz)
    ? profile.tom_de_voz.join(', ')
    : profile.tom_de_voz

  // Disponibilidade real do criador — REGRA: ignora dias e periodos que ele
  // nao marcou. So gera post nos dias/periodos que ele tem disponibilidade.
  const periodosLabel: Record<string, string> = {
    manha_cedo: '6h-9h', manha: '9h-12h', almoco: '12h-14h',
    tarde: '14h-18h', noite: '18h-22h', madrugada: '22h+',
  }
  const periodosDisponiveis = (profile.disponibilidade_periodos as string[] | null ?? [])
    .map(p => periodosLabel[p] ?? p).join(', ')
  const minutosTexto = profile.disponibilidade_minutos
    ? `${profile.disponibilidade_minutos} minutos por dia`
    : 'não informado'

  const userPrompt = `## Perfil do criador
- Nome: ${profile.nome_artistico ?? 'criador'}
- Nicho: ${profile.nicho}
- Tom de voz: ${tomDeVoz}
- Plataformas: ${plataformas}
- Objetivo: ${profile.objetivo ?? 'não informado'}
- Sobre: ${profile.sobre ?? 'não informado'}
${profile.voz_perfil ? `- Análise vocal IA: ${profile.voz_perfil}` : ''}

## Disponibilidade REAL do criador (RESPEITE — não invente horário fora disso)
- Dias da semana que pode postar: ${dias.join(', ').toUpperCase()}
- Períodos do dia disponíveis: ${periodosDisponiveis || 'não informado'}
- Tempo livre por dia pra criar conteúdo: ${minutosTexto}
${profile.disponibilidade_compromissos ? `- Compromissos fixos a evitar: ${profile.disponibilidade_compromissos}` : ''}

REGRA CRÍTICA: gere posts SOMENTE nos dias listados acima. Os outros dias da semana ficam SEM POST (item vazio na resposta — pula esse dia). Horário escolhido tem que cair dentro de UM dos períodos disponíveis acima.

## Janelas de horário válidas (BR, Instagram)
${janelas.map(j => `- ${j.inicio} às ${j.fim}${j.razao ? ` (${j.razao})` : ''}`).join('\n')}

## Locais sugeridos para vídeos do seu nicho (escolha um ou variação)
${locais.map(l => `- ${l}`).join('\n')}

## Estrutura da semana (datas exatas)
${[1,2,3,4,5,6,0].map(i => {
  const dia = i as DiaSemana
  const data = addDias(semanaInicio, i === 0 ? 6 : i - 1)
  const arq = ARQUETIPO_DIA_SEMANA[dia]
  return `- Dia ${i === 0 ? 'DOMINGO' : ['SEG','TER','QUA','QUI','SEX','SAB'][i-1]} (${data}): arquétipo "${arq.arquetipo}", formato "${arq.formato_sugerido}". Vibe: ${arq.vibe}`
}).join('\n')}

## Últimos 14 dias o criador postou sobre (NÃO repita)
${ultimosTitulos.length === 0 ? '- (sem histórico — pode escolher livremente)' : ultimosTitulos.map(t => `- ${t}`).join('\n')}

Gere o JSON do cronograma agora. Lembrete: scripts PRONTOS pra gravar/postar.`

  // 6. Chama Anthropic com prompt cache no system
  let response
  try {
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userPrompt }],
    })
  } catch (e) {
    console.error('[cronograma/gerar] Anthropic erro:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Falha temporária da IA. Tente em alguns segundos.' }, { status: 503 })
  }

  const texto = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const jsonMatch = texto.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('[cronograma/gerar] JSON inválido na resposta da IA')
    return NextResponse.json({ error: 'Resposta da IA mal formada. Tente regerar.' }, { status: 502 })
  }

  let parsed: { items: CronogramaItem[]; raciocinio: string }
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'Resposta da IA não é JSON válido.' }, { status: 502 })
  }

  if (!parsed.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
    return NextResponse.json({ error: 'IA não gerou items. Tente regerar.' }, { status: 502 })
  }

  // 7. Calcula custo
  const tokensIn = response.usage.input_tokens + (response.usage.cache_creation_input_tokens ?? 0) + (response.usage.cache_read_input_tokens ?? 0)
  const tokensOut = response.usage.output_tokens
  // Sonnet 4.6: $3/M input, $15/M output. Cache read: $0.30/M.
  const custoCentavos = Math.round(
    (response.usage.input_tokens / 1_000_000) * 300 +              // 3 USD = 300 centavos
    ((response.usage.cache_creation_input_tokens ?? 0) / 1_000_000) * 375 +
    ((response.usage.cache_read_input_tokens ?? 0) / 1_000_000) * 30 +
    (tokensOut / 1_000_000) * 1500                                  // 15 USD = 1500 centavos
  )

  // 8. Insere cronograma + items
  const semanaFim = addDias(semanaInicio, 6)

  // Se forçou regerar, deleta o anterior antes
  if (forcar_regeneracao) {
    const { data: anterior } = await admin
      .from('cronograma_semanal')
      .select('id')
      .eq('user_id', user.id)
      .eq('semana_inicio', semanaInicio)
      .maybeSingle()
    if (anterior) {
      // Preserva items que o user editou
      await admin.from('calendar_items').delete()
        .eq('cronograma_id', anterior.id)
        .eq('editado_pelo_user', false)
      await admin.from('cronograma_semanal').delete().eq('id', anterior.id)
    }
  }

  const { data: cronograma, error: cronoErr } = await admin
    .from('cronograma_semanal')
    .insert({
      user_id: user.id,
      semana_inicio: semanaInicio,
      semana_fim: semanaFim,
      gerado_por: forcar_regeneracao ? 'regenerar' : 'on_demand',
      tokens_input: tokensIn,
      tokens_output: tokensOut,
      custo_centavos: custoCentavos,
      raciocinio: parsed.raciocinio ?? null,
    })
    .select()
    .single()

  if (cronoErr || !cronograma) {
    console.error('[cronograma/gerar] erro inserindo cronograma:', cronoErr?.message)
    return NextResponse.json({ error: 'Erro salvando cronograma.' }, { status: 500 })
  }

  // 9. Insere os 7 items no calendar_items
  const itemsParaInserir = parsed.items.map((it) => ({
    user_id: user.id,
    cronograma_id: cronograma.id,
    titulo: it.titulo,
    plataforma: it.plataforma,
    tipo_conteudo: it.tipo,
    data_planejada: it.data,
    horario_sugerido: it.horario,
    local_sugerido: it.local,
    gancho: it.gancho,
    script: it.script,
    cta: it.cta,
    gerado_por_ia: true,
    concluido: false,
    pontos: 10,
  }))

  const { data: itemsInseridos, error: itemsErr } = await admin
    .from('calendar_items')
    .insert(itemsParaInserir)
    .select()

  if (itemsErr) {
    console.error('[cronograma/gerar] erro inserindo items:', itemsErr.message)
    return NextResponse.json({ error: 'Erro salvando os posts.' }, { status: 500 })
  }

  return NextResponse.json({
    cronograma_id: cronograma.id,
    items: itemsInseridos,
    raciocinio: parsed.raciocinio,
    custo_centavos: custoCentavos,
  })
}
