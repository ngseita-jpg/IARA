import Anthropic from '@anthropic-ai/sdk'
import { YoutubeTranscript } from 'youtube-transcript'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { verificarLimite, respostaLimiteAtingido } from '@/lib/checkLimite'
import { verificarLimiteMarca, respostaLimiteAtingidoMarca } from '@/lib/checkLimiteMarca'
import { NOME_PLANO, type Plano } from '@/lib/limites'

export const runtime = 'nodejs'
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type TranscriptSeg = { text: string; offset: number; duration: number }
type Modo = 'criador' | 'marca'

type Trecho = {
  ordem: number
  titulo: string
  descricao: string
  hook: string
  inicio_segundos: number
  fim_segundos: number
  plataforma_ideal: 'reels' | 'shorts' | 'tiktok' | 'feed' | 'linkedin'
  hashtags: string[]
  transcricao_trecho: string
  score_qualidade: number
}

function extrairVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function fmtTempo(seg: number): string {
  const min = Math.floor(seg / 60)
  const s = Math.floor(seg % 60)
  return `${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json() as { url: string; modo?: Modo; num_cortes?: number }
  const modo: Modo = body.modo === 'marca' ? 'marca' : 'criador'
  const numCortes = Math.min(Math.max(body.num_cortes ?? 6, 3), 12)

  const videoId = extrairVideoId(body.url ?? '')
  if (!videoId) {
    return NextResponse.json({ error: 'URL inválida. Cole um link do YouTube completo.' }, { status: 400 })
  }

  // Checa limite ANTES de baixar transcript (economiza rede)
  const admin = createAdminClient()
  let planoNome = 'free'

  if (modo === 'marca') {
    const lim = await verificarLimiteMarca(user.id, 'corte_mes')
    if (!lim.ok) return respostaLimiteAtingidoMarca(lim)
    planoNome = lim.plano
  } else {
    const { data: perfil } = await admin
      .from('creator_profiles')
      .select('plano')
      .eq('user_id', user.id)
      .maybeSingle()
    const plano = (perfil?.plano ?? 'free') as Plano
    const lim = await verificarLimite(supabase, user.id, 'corte', plano)
    if (!lim.permitido) return respostaLimiteAtingido(lim.limite, lim.usado, NOME_PLANO[plano])
    planoNome = plano
  }

  // Baixa transcript
  let segs: TranscriptSeg[]
  try {
    const raw = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'pt' }).catch(async () => {
      // Fallback pra inglês se pt não existir
      return YoutubeTranscript.fetchTranscript(videoId)
    })
    segs = raw.map(r => ({
      text: (r.text ?? '').replace(/\s+/g, ' ').trim(),
      // lib retorna offset em ms (nova versão) ou segundos (versões antigas) — normalizamos
      offset: r.offset > 10000 ? r.offset / 1000 : r.offset,
      duration: r.duration > 1000 ? r.duration / 1000 : r.duration,
    })).filter(s => s.text)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({
      error: 'Não consegui pegar a transcrição desse vídeo. Pode ser que o canal tenha desabilitado legendas, ou seja privado. Tenta outro.',
      detalhe: msg,
    }, { status: 422 })
  }

  if (!segs.length) {
    return NextResponse.json({ error: 'Esse vídeo não tem legendas disponíveis.' }, { status: 422 })
  }

  const duracaoTotal = Math.max(...segs.map(s => s.offset + s.duration))

  // Monta texto numerado com timestamps (a cada linha) pra Claude analisar
  const linhas: string[] = []
  for (const s of segs) {
    linhas.push(`[${s.offset.toFixed(1)}s] ${s.text}`)
  }
  const transcricaoCompleta = linhas.join('\n').slice(0, 60_000) // limite de segurança

  // Cria registro de vídeo
  const { data: videoRow, error: insErr } = await admin
    .from('cortes_videos')
    .insert({
      user_id: user.id,
      tipo_conta: modo,
      url_original: `https://www.youtube.com/watch?v=${videoId}`,
      video_id: videoId,
      duracao_segundos: Math.round(duracaoTotal),
      transcricao: segs.map(s => s.text).join(' '),
      idioma: 'pt',
      status: 'processando',
    })
    .select('id')
    .single()

  if (insErr || !videoRow) {
    return NextResponse.json({ error: 'Erro ao salvar vídeo', detalhe: insErr?.message }, { status: 500 })
  }

  const videoRowId = videoRow.id

  // Pede pra Claude
  const SYSTEM = `Você é a Iara, editora de vídeo especialista em cortes pra redes sociais brasileiras (Reels, Shorts, TikTok).

Sua tarefa: analisar a transcrição de um vídeo longo do YouTube e identificar os ${numCortes} MELHORES trechos pra virar cortes virais.

Critérios pra selecionar um bom corte:
- Tem gancho forte nos primeiros 2 segundos
- Entrega 1 ideia completa (não pela metade)
- Tem conclusão ou punchline
- Duração ideal: 20s a 75s (reels/shorts/tiktok) ou 60-180s (LinkedIn)
- Evita trechos com dados soltos sem contexto, ou promos longas

Pra CADA corte escolhido, gere:
- Título chamativo (até 55 chars, sem ser clickbait barato)
- Hook de 1 frase que será a primeira linha da legenda
- Descrição curta (até 120 chars) explicando o valor do corte
- 4-6 hashtags relevantes em PT-BR
- Plataforma ideal: reels, shorts, tiktok, feed ou linkedin
- Score de qualidade 0-100

Retorne APENAS JSON válido, sem markdown, sem texto antes ou depois.`

  const prompt = `TRANSCRIÇÃO COM TIMESTAMPS (em segundos):
${transcricaoCompleta}

Duração total do vídeo: ${Math.round(duracaoTotal)}s (~${Math.round(duracaoTotal / 60)}min)

Escolha os ${numCortes} melhores trechos e devolva neste JSON:
{
  "trechos": [
    {
      "ordem": 1,
      "titulo": "título chamativo",
      "descricao": "por que esse corte funciona",
      "hook": "primeira frase da legenda",
      "inicio_segundos": 123.4,
      "fim_segundos": 187.2,
      "plataforma_ideal": "shorts",
      "hashtags": ["#tag1","#tag2"],
      "transcricao_trecho": "o que é falado nesse trecho, resumido",
      "score_qualidade": 85
    }
  ]
}

Seja honesto nos scores: só dê 90+ pra cortes que REALMENTE têm potencial viral.`

  let trechos: Trecho[] = []
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: prompt }],
    })
    const texto = response.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('IA não retornou JSON')
    const parsed = JSON.parse(jsonMatch[0]) as { trechos: Trecho[] }
    trechos = (parsed.trechos ?? []).filter(t =>
      typeof t.inicio_segundos === 'number' &&
      typeof t.fim_segundos === 'number' &&
      t.fim_segundos > t.inicio_segundos
    )
  } catch (e) {
    await admin.from('cortes_videos').update({
      status: 'falhou',
      erro: e instanceof Error ? e.message : 'Erro IA',
    }).eq('id', videoRowId)
    return NextResponse.json({ error: 'IA falhou ao analisar', detalhe: e instanceof Error ? e.message : 'erro' }, { status: 500 })
  }

  // Insere trechos
  const rows = trechos.map((t, i) => ({
    video_id: videoRowId,
    ordem: t.ordem ?? i + 1,
    titulo: (t.titulo ?? '').slice(0, 140),
    descricao: (t.descricao ?? '').slice(0, 400),
    hook: (t.hook ?? '').slice(0, 200),
    inicio_segundos: t.inicio_segundos,
    fim_segundos: t.fim_segundos,
    plataforma_ideal: ['reels','shorts','tiktok','feed','linkedin'].includes(t.plataforma_ideal) ? t.plataforma_ideal : 'shorts',
    hashtags: Array.isArray(t.hashtags) ? t.hashtags.slice(0, 10) : [],
    transcricao_trecho: (t.transcricao_trecho ?? '').slice(0, 2000),
    score_qualidade: typeof t.score_qualidade === 'number' ? Math.max(0, Math.min(100, Math.round(t.score_qualidade))) : 70,
  }))

  if (rows.length) {
    await admin.from('cortes_trechos').insert(rows)
  }

  await admin.from('cortes_videos').update({ status: 'pronto', atualizado_at: new Date().toISOString() }).eq('id', videoRowId)

  // Gamificação: +5 pts pra criador
  if (modo === 'criador') {
    await admin.rpc('increment_pontos', { uid: user.id, delta: 5 }).then(
      () => null,
      () => null, // ignora se RPC não existe
    )
  }

  return NextResponse.json({
    video: {
      id: videoRowId,
      video_id: videoId,
      url_original: `https://www.youtube.com/watch?v=${videoId}`,
      duracao_segundos: Math.round(duracaoTotal),
    },
    trechos: rows.map((r, i) => ({
      ...r,
      id: `temp-${i}`, // frontend recarrega via GET se precisar
      inicio_formatado: fmtTempo(r.inicio_segundos),
      fim_formatado: fmtTempo(r.fim_segundos),
      duracao_formatada: fmtTempo(r.fim_segundos - r.inicio_segundos),
    })),
    plano: planoNome,
  })
}
