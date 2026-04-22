import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const mensagem = body.mensagem as string
  const historico = (body.historico ?? []) as Anthropic.MessageParam[]

  if (!mensagem?.trim()) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })

  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('nome_empresa, segmento, porte, descricao')
    .eq('user_id', user.id)
    .maybeSingle()

  const system = `Você é a Iara, consultora estratégica de marketing de influência especializada em marcas e empresas brasileiras.

Seu papel: ajudar marcas a planejar campanhas com criadores de conteúdo, definir estratégias de influencer marketing, calcular ROI, escolher perfis ideais de criadores, criar briefings e orientar sobre melhores práticas do mercado brasileiro.

Marca atual:
- Nome: ${brand?.nome_empresa ?? 'não informado'}
- Segmento: ${brand?.segmento ?? 'não informado'}
- Porte: ${brand?.porte ?? 'não informado'}
- Descrição: ${brand?.descricao ?? 'não informado'}

Diretrizes:
- Seja direta e prática — responda com estratégias acionáveis
- Use dados reais do mercado brasileiro quando relevante
- Formate respostas com títulos (##), listas e destaques (**texto**) quando ajudar a clareza
- Seja consultiva: sugira proativamente o que a marca deveria fazer a seguir
- Mantenha linguagem profissional mas acessível, em português do Brasil`

  const messages: Anthropic.MessageParam[] = [
    ...historico,
    { role: 'user', content: mensagem },
  ]

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages,
    })

    const texto = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    return NextResponse.json({ resposta: texto })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro ao consultar IA: ${msg}` }, { status: 500 })
  }
}
