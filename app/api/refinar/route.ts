import Anthropic from '@anthropic-ai/sdk'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { verificarLimite, respostaLimiteAtingido } from '@/lib/checkLimite'
import { NOME_PLANO, type Plano, type TipoUso } from '@/lib/limites'
import { checkRateLimitIp } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODULOS_REFINAVEIS: Record<string, { tipoLimite: TipoUso; system: string }> = {
  roteiro: {
    tipoLimite: 'roteiro',
    system: `Você é a Iara, assessora de conteúdo digital. O criador acabou de receber um roteiro e quer ajustar.

Mantenha:
- A estrutura geral (hooks, blocos, CTA) a menos que o pedido peça pra mudar
- O tom de voz que ele já tem
- Português brasileiro natural

Aplique apenas a instrução pedida e devolva APENAS o roteiro refinado (sem comentários, sem markdown extra).`,
  },
  stories: {
    tipoLimite: 'stories',
    system: `Você é a Iara, assessora de conteúdo. O criador acabou de receber stories e quer ajustar.

Mantenha:
- A sequência (mesma quantidade de slides)
- Estrutura JSON se já estava em JSON, ou texto se era texto
- Tom natural, brasileiro

Aplique a instrução e devolva o resultado refinado direto, sem comentário extra.`,
  },
  temas: {
    tipoLimite: 'temas',
    system: `Você é a Iara em modo Faísca Criativa. O criador quer refinar a ideia/tema.

Aplique a instrução e devolva o tema refinado direto, mantendo o mesmo formato.`,
  },
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const rl = await checkRateLimitIp(req, 'ia_geral', 60, 3600)
  if (rl) return rl

  const body = await req.json() as {
    modulo?: string
    conteudo_atual?: string
    instrucao?: string
  }

  const cfg = body.modulo ? MODULOS_REFINAVEIS[body.modulo] : null
  if (!cfg) return NextResponse.json({ error: 'Módulo não suporta refinamento' }, { status: 400 })

  const conteudoAtual = (body.conteudo_atual ?? '').slice(0, 12000)
  const instrucao = (body.instrucao ?? '').slice(0, 500).trim()
  if (conteudoAtual.length < 20) {
    return NextResponse.json({ error: 'Conteúdo atual muito curto' }, { status: 400 })
  }
  if (instrucao.length < 3) {
    return NextResponse.json({ error: 'Instrução muito curta' }, { status: 400 })
  }

  // Limite mensal por plano (consome do mesmo bucket do módulo)
  const admin = createAdminClient()
  const { data: perfil } = await admin
    .from('creator_profiles')
    .select('plano')
    .eq('user_id', user.id)
    .maybeSingle()
  const plano = (perfil?.plano ?? 'free') as Plano
  const lim = await verificarLimite(supabase, user.id, cfg.tipoLimite, plano)
  if (!lim.permitido) return respostaLimiteAtingido(lim.limite, lim.usado, NOME_PLANO[plano])

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: [{ type: 'text', text: cfg.system, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: `## Conteúdo atual\n\n${conteudoAtual}\n\n## Instrução de ajuste\n\n${instrucao}\n\nDevolva o conteúdo refinado.`,
      }],
    })

    const refinado = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    return NextResponse.json({ refinado })
  } catch (e) {
    console.error('[refinar] erro', e)
    return NextResponse.json({
      error: 'Erro ao refinar. Tente novamente.',
      detalhe: e instanceof Error ? e.message : 'erro',
    }, { status: 500 })
  }
}
