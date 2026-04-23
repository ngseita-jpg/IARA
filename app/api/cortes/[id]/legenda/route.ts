import { createClient, createAdminClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * Gera e exporta legendas do trecho em formato .srt ou .ass
 *
 * .srt = universal, funciona no CapCut/Premiere/InShot
 * .ass = estilizado (fontes/cores/animações customizadas) — premium effect
 *
 * POST body:
 *   trecho_id: string
 *   formato: 'srt' | 'ass'
 *   estilo: {
 *     fonte: string
 *     cor: string         // hex da cor do texto
 *     cor_contorno: string
 *     tamanho: number     // 1-100 escala %
 *     animacao: 'pop'|'slide'|'fade'|'typewriter'|'bounce'|'none'
 *     negrito: boolean
 *     posicao: 'baixo'|'centro'|'alto'
 *   }
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: videoId } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json() as {
    trecho_id: string
    formato: 'srt' | 'ass'
    estilo?: EstiloLegenda
  }

  const admin = createAdminClient()

  // Validar posse do vídeo
  const { data: video } = await admin
    .from('cortes_videos')
    .select('id, transcricao')
    .eq('id', videoId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!video) return NextResponse.json({ error: 'Vídeo não encontrado' }, { status: 404 })

  const { data: trecho } = await admin
    .from('cortes_trechos')
    .select('*')
    .eq('id', body.trecho_id)
    .eq('video_id', videoId)
    .maybeSingle()
  if (!trecho) return NextResponse.json({ error: 'Trecho não encontrado' }, { status: 404 })

  const estilo = { ...ESTILO_PADRAO, ...(body.estilo ?? {}) }
  const formato = body.formato === 'ass' ? 'ass' : 'srt'

  // Gera cues (frases curtas com timestamps dentro do trecho) via Claude
  // Input: o transcricao_trecho + início/fim do trecho
  const cues = await gerarCues({
    texto: trecho.transcricao_trecho ?? video.transcricao?.slice(0, 2000) ?? '',
    inicioGlobal: Number(trecho.inicio_segundos),
    fimGlobal: Number(trecho.fim_segundos),
  })

  // Salva config de legenda pro usuário re-editar
  await admin.from('cortes_trechos').update({
    legenda_config: { ...estilo, cues, gerado_em: new Date().toISOString() },
  }).eq('id', body.trecho_id)

  const conteudo = formato === 'ass' ? gerarASS(cues, estilo, trecho.titulo ?? 'Corte') : gerarSRT(cues)

  return new NextResponse(conteudo, {
    headers: {
      'Content-Type': formato === 'ass' ? 'text/x-ssa; charset=utf-8' : 'application/x-subrip; charset=utf-8',
      'Content-Disposition': `attachment; filename="corte-${body.trecho_id.slice(0, 8)}.${formato}"`,
    },
  })
}

// ═══════════════════════════════════════════════════════════════
// Helpers

type EstiloLegenda = {
  fonte: string
  cor: string
  cor_contorno: string
  tamanho: number           // escala relativa (1-100), mapeada em px
  animacao: 'pop' | 'slide' | 'fade' | 'typewriter' | 'bounce' | 'none'
  negrito: boolean
  posicao: 'baixo' | 'centro' | 'alto'
}

const ESTILO_PADRAO: EstiloLegenda = {
  fonte: 'Inter',
  cor: '#FFFFFF',
  cor_contorno: '#000000',
  tamanho: 60,
  animacao: 'pop',
  negrito: true,
  posicao: 'baixo',
}

type Cue = { inicio: number; fim: number; texto: string } // tempos absolutos (dentro do trecho, começando do 0)

async function gerarCues(args: { texto: string; inicioGlobal: number; fimGlobal: number }): Promise<Cue[]> {
  const duracao = Math.max(args.fimGlobal - args.inicioGlobal, 5)
  // Fallback simples: divide o texto em chunks de ~3s proporcionalmente
  const fallback = (): Cue[] => {
    const palavras = (args.texto || '').split(/\s+/).filter(Boolean)
    if (!palavras.length) return []
    const chunksDe = 5                              // 5 palavras por cue (bom ritmo legível)
    const chunks: string[] = []
    for (let i = 0; i < palavras.length; i += chunksDe) {
      chunks.push(palavras.slice(i, i + chunksDe).join(' '))
    }
    const dur = duracao / chunks.length
    return chunks.map((t, i) => ({ inicio: i * dur, fim: (i + 1) * dur, texto: t }))
  }

  try {
    const SYSTEM = `Você quebra texto em legendas curtas pra vídeo vertical (Reels/Shorts/TikTok).
Regras:
- Cada cue tem 3-6 palavras (leitura rápida).
- Sincroniza com a fala — ritmo natural, cue dura 0.8s a 2.5s.
- Sem reticências ou pontos finais entre cues (só vírgula/interrogação quando fizer sentido).
- Use emoji só se o texto pedir (não forçar).
- Retorna APENAS JSON, sem markdown.`

    const prompt = `TEXTO DO TRECHO (falado em ~${Math.round(duracao)}s):
"""
${args.texto}
"""

Duração total do trecho: ${duracao.toFixed(2)}s

Quebra em cues sequenciais. Retorna:
{"cues":[{"inicio":0.0,"fim":1.8,"texto":"primeira frase curta"}, ...]}

Tempos em segundos RELATIVOS ao início do corte (começam em 0, terminam no máximo em ${duracao.toFixed(2)}).`

    const resp = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    })
    const txt = resp.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
    const match = txt.match(/\{[\s\S]*\}/)
    if (!match) return fallback()
    const parsed = JSON.parse(match[0]) as { cues: Cue[] }
    const cues = (parsed.cues ?? []).filter(c => typeof c.inicio === 'number' && typeof c.fim === 'number' && c.fim > c.inicio && c.texto)
    return cues.length ? cues : fallback()
  } catch {
    return fallback()
  }
}

function fmtSRT(seg: number): string {
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  const s = Math.floor(seg % 60)
  const ms = Math.round((seg - Math.floor(seg)) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

function fmtASS(seg: number): string {
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  const s = seg % 60
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`
}

function gerarSRT(cues: Cue[]): string {
  return cues.map((c, i) =>
    `${i + 1}\n${fmtSRT(c.inicio)} --> ${fmtSRT(c.fim)}\n${c.texto}\n`
  ).join('\n')
}

function hexParaASS(hex: string): string {
  // ASS usa &HBBGGRR& (invertido!) com alpha no início
  const clean = hex.replace('#', '').padStart(6, '0')
  const r = clean.slice(0, 2)
  const g = clean.slice(2, 4)
  const b = clean.slice(4, 6)
  return `&H00${b}${g}${r}`.toUpperCase()
}

function gerarASS(cues: Cue[], estilo: EstiloLegenda, titulo: string): string {
  const fontSize = Math.max(24, Math.min(120, Math.round(estilo.tamanho * 1.2)))
  const primaryColor = hexParaASS(estilo.cor)
  const outlineColor = hexParaASS(estilo.cor_contorno)
  const bold = estilo.negrito ? '-1' : '0'
  const alignment = estilo.posicao === 'alto' ? 8 : estilo.posicao === 'centro' ? 5 : 2
  const borderStyle = 1     // 1 = contorno+sombra; 3 = caixa

  const header = `[Script Info]
Title: ${titulo}
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${estilo.fonte},${fontSize},${primaryColor},&H000000FF,${outlineColor},&H00000000,${bold},0,0,0,100,100,0,0,${borderStyle},4,2,${alignment},40,40,120,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  const linhas = cues.map(c => {
    const efeito = gerarEfeitoASS(estilo.animacao, c.fim - c.inicio)
    return `Dialogue: 0,${fmtASS(c.inicio)},${fmtASS(c.fim)},Default,,0,0,0,,${efeito}${escaparASS(c.texto)}`
  }).join('\n')

  return header + linhas + '\n'
}

function escaparASS(txt: string): string {
  return txt.replace(/\n/g, '\\N').replace(/\{/g, '\\{').replace(/\}/g, '\\}')
}

function gerarEfeitoASS(anim: EstiloLegenda['animacao'], dur: number): string {
  const ms = Math.round(dur * 1000)
  switch (anim) {
    case 'pop':
      return `{\\fad(100,80)\\t(0,150,\\fscx120\\fscy120)\\t(150,300,\\fscx100\\fscy100)}`
    case 'slide':
      return `{\\move(540,2000,540,1800,0,250)\\fad(0,100)}`
    case 'fade':
      return `{\\fad(200,200)}`
    case 'typewriter': {
      // karaoke-ish: cada letra aparece progressivamente
      return `{\\fad(0,80)\\t(0,${ms},\\alpha&HFF&)}`
    }
    case 'bounce':
      return `{\\fad(80,80)\\t(0,150,\\fscy140)\\t(150,280,\\fscy90)\\t(280,380,\\fscy100)}`
    case 'none':
    default:
      return ''
  }
}
