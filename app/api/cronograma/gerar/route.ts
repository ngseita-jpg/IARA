import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { jsonrepair } from 'jsonrepair'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkRateLimitUser } from '@/lib/rateLimit'
import {
  janelasHorarios, sugerirLocais, ARQUETIPO_DIA_SEMANA,
  inicioSemanaAtual, addDias, type DiaSemana,
} from '@/lib/cronograma-heuristicas'

export const runtime = 'nodejs'
export const maxDuration = 90

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
Sua tarefa: gerar um CRONOGRAMA DE POSTAGENS apenas pros dias que o criador pode postar.

REGRAS OBRIGATÓRIAS:

1. Gere UM item para CADA dia listado em "## Dias com post nesta semana" (nem mais, nem menos). Não invente dias adicionais. Não pule nenhum dos listados.

2. Cada dia listado vem com um ARQUÉTIPO sugerido — siga ele. Misture formatos entre os dias (reel/carrossel/post/story) pra variar o feed.

3. HORÁRIO: escolha DENTRO das janelas válidas fornecidas no input. Formato HH:MM (ex: "18:30"). Não invente horário fora.

4. LOCAL: escolha DA LISTA fornecida pro nicho (ou descreva variação plausível).

5. SCRIPT: PRONTO PRA GRAVAR/POSTAR — não brief, não rascunho.
   - MÁXIMO 8 linhas curtas (ideal 5-7) — script pra rolar em 60-90s na fala natural
   - Hook (1ª linha): força emocional, tensão, curiosidade
   - Desenvolvimento (3-5 linhas): específico, brasileiro, sem clichês, frases enxutas
   - CTA: ação clara ("salve", "manda pra alguém", "comenta o número da dica")

6. EVITAR:
   - "Descubra", "Incrível", "Você merece", "Transforme sua vida"
   - Repetir tema dos últimos 14 dias (lista no input)
   - Genericismo — cada dia precisa ser ESPECÍFICO do nicho/persona

7. PORTUGUÊS BR fluente, sem erro gramatical.

OUTPUT: JSON estrito (sem markdown, sem explicação fora do JSON). dia_semana segue 1=seg, 2=ter, ..., 6=sab, 0=dom:
{
  "items": [{
    "dia_semana": 3, "data": "2026-05-08", "titulo": "...",
    "plataforma": "instagram", "tipo": "reel",
    "horario": "18:30", "local": "...", "gancho": "...",
    "script": "linha 1\\nlinha 2\\nlinha 3", "cta": "..."
  }],
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

  const semanaInicio = semanaForcada ?? inicioSemanaAtual()
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

  // Mapa abreviacao -> dia_semana numero (1=seg ... 0=dom)
  const DIA_NUM: Record<string, DiaSemana> = {
    seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6, dom: 0,
  }
  const NOMES_DIA = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO']

  // Lista APENAS os dias que o criador marcou como disponiveis nesta semana
  const diasComPost = dias
    .map((abrev) => {
      const num = DIA_NUM[abrev.toLowerCase().slice(0, 3)]
      if (num === undefined) return null
      // Calcula a data exata na semana corrente
      const offset = num === 0 ? 6 : num - 1
      const data = addDias(semanaInicio, offset)
      const arq = ARQUETIPO_DIA_SEMANA[num as DiaSemana]
      return {
        nome: NOMES_DIA[num],
        data,
        dia_semana: num,
        arquetipo: arq.arquetipo,
        formato: arq.formato_sugerido,
        vibe: arq.vibe,
      }
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .sort((a, b) => a.data.localeCompare(b.data))

  const userPrompt = `## Perfil do criador
- Nome: ${profile.nome_artistico ?? 'criador'}
- Nicho: ${profile.nicho}
- Tom de voz: ${tomDeVoz}
- Plataformas: ${plataformas}
- Objetivo: ${profile.objetivo ?? 'não informado'}
- Sobre: ${profile.sobre ?? 'não informado'}
${profile.voz_perfil ? `- Análise vocal IA: ${profile.voz_perfil}` : ''}

## Disponibilidade REAL do criador
- Períodos do dia disponíveis: ${periodosDisponiveis || 'não informado'}
- Tempo livre por dia pra criar conteúdo: ${minutosTexto}
${profile.disponibilidade_compromissos ? `- Compromissos fixos a evitar: ${profile.disponibilidade_compromissos}` : ''}

## Janelas de horário válidas (BR, Instagram)
${janelas.map(j => `- ${j.inicio} às ${j.fim}${j.razao ? ` (${j.razao})` : ''}`).join('\n')}

## Locais sugeridos para vídeos do seu nicho (escolha um ou variação)
${locais.map(l => `- ${l}`).join('\n')}

## Dias com post nesta semana (gere EXATAMENTE 1 item para cada um, na ordem)
${diasComPost.map(d => `- ${d.nome} (${d.data}, dia_semana=${d.dia_semana}): arquétipo "${d.arquetipo}", formato sugerido "${d.formato}". Vibe: ${d.vibe}`).join('\n')}

Total a gerar: ${diasComPost.length} ${diasComPost.length === 1 ? 'item' : 'items'}.

## Últimos 14 dias o criador postou sobre (NÃO repita)
${ultimosTitulos.length === 0 ? '- (sem histórico — pode escolher livremente)' : ultimosTitulos.map(t => `- ${t}`).join('\n')}

Gere o JSON do cronograma agora. Lembrete: scripts PRONTOS pra gravar/postar, em PT-BR fluente.`

  // 6. Chama Anthropic com prompt cache no system
  let response
  try {
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,  // Antes 4000 — IA estava escrevendo scripts de 1500 chars cada,
                         // batia 77s+ no Sonnet. Limite pra forcar concisao.
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userPrompt }],
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[cronograma/gerar] Anthropic erro:', msg)
    return NextResponse.json({
      error: 'Falha temporária da IA. Tente em alguns segundos.',
      debug: msg.slice(0, 200),
    }, { status: 503 })
  }

  const texto = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const jsonMatch = texto.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('[cronograma/gerar] JSON nao encontrado. Resposta IA:', texto.slice(0, 500))
    return NextResponse.json({
      error: 'Resposta da IA mal formada. Tente regerar.',
      debug: `IA nao retornou JSON. Inicio resposta: ${texto.slice(0, 200)}`,
    }, { status: 502 })
  }

  let parsed: { items: CronogramaItem[]; raciocinio: string }
  try {
    // Tenta parse direto primeiro
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    // Fallback: jsonrepair conserta vírgulas, aspas, escapes — IA frequentemente quebra
    // JSON em scripts longos (aspas internas, newlines, etc). Salva geracao em vez de erro.
    try {
      const reparado = jsonrepair(jsonMatch[0])
      parsed = JSON.parse(reparado)
      console.log('[cronograma/gerar] JSON reparado via jsonrepair')
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : String(e2)
      console.error('[cronograma/gerar] jsonrepair falhou:', msg, 'Inicio:', jsonMatch[0].slice(0, 300))
      return NextResponse.json({
        error: 'IA retornou JSON quebrado. Tente regerar.',
        debug: `Parse erro: ${msg}`,
      }, { status: 502 })
    }
  }

  if (!parsed.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
    console.error('[cronograma/gerar] items vazio ou ausente. Parsed:', JSON.stringify(parsed).slice(0, 500))
    return NextResponse.json({
      error: 'IA não gerou items. Tente regerar.',
      debug: `Recebi: ${JSON.stringify(parsed).slice(0, 200)}`,
    }, { status: 502 })
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

  // 9. Insere os items no calendar_items (apenas os dias disponiveis)
  // Normaliza horario: aceita "18:30" ou "18:30:00" — Postgres time exige HH:MM:SS
  const normHorario = (h: string | undefined): string | null => {
    if (!h) return null
    const trim = h.trim()
    if (/^\d{2}:\d{2}$/.test(trim)) return `${trim}:00`
    if (/^\d{2}:\d{2}:\d{2}$/.test(trim)) return trim
    return null
  }

  const itemsParaInserir = parsed.items.map((it) => ({
    user_id: user.id,
    cronograma_id: cronograma.id,
    titulo: it.titulo ?? 'Post sem título',
    plataforma: it.plataforma ?? 'instagram',
    tipo_conteudo: it.tipo ?? 'reel',
    data_planejada: it.data,
    horario_sugerido: normHorario(it.horario),
    local_sugerido: it.local ?? null,
    gancho: it.gancho ?? null,
    script: it.script ?? null,
    cta: it.cta ?? null,
    gerado_por_ia: true,
    concluido: false,
    pontos: 10,
  }))

  const { data: itemsInseridos, error: itemsErr } = await admin
    .from('calendar_items')
    .insert(itemsParaInserir)
    .select()

  if (itemsErr) {
    console.error('[cronograma/gerar] erro inserindo items:', itemsErr.message, 'Sample:', JSON.stringify(itemsParaInserir[0]))
    // Cleanup do registro orfao no parent (cronograma_semanal)
    await admin.from('cronograma_semanal').delete().eq('id', cronograma.id)
    return NextResponse.json({
      error: 'Erro salvando os posts.',
      debug: `${itemsErr.message}. Items sendo inseridos: ${itemsParaInserir.length}`,
    }, { status: 500 })
  }

  return NextResponse.json({
    cronograma_id: cronograma.id,
    items: itemsInseridos,
    raciocinio: parsed.raciocinio,
    custo_centavos: custoCentavos,
  })
}
