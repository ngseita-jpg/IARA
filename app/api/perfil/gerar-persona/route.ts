import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function parseArr(val: unknown): string {
  if (!val) return ''
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'string') {
    try { const r = JSON.parse(val); if (Array.isArray(r)) return r.join(', ') } catch {}
    return val
  }
  return ''
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const p = await req.json()

  const prompt = `Você é a Iara, especialista em criadores de conteúdo brasileiros. Com base nas respostas do questionário abaixo, escreva uma PERSONA COMPLETA desse criador em 4-5 parágrafos ricos.

Escreva em terceira pessoa, como um dossiê interno que a IA vai ler antes de gerar qualquer conteúdo para essa pessoa. Capture a essência real, a história, o propósito e o estilo único desse criador. Use os relatos pessoais que ele escreveu — eles são o ouro. Não use listas. Prosa corrida.

IDENTIDADE:
- Nome/marca: ${p.nome_artistico ?? 'não informado'}
- Nicho: ${p.nicho ?? 'não informado'}${p.sub_nicho ? ` — recorte específico: ${p.sub_nicho}` : ''}
- Estágio atual: ${p.estagio ?? 'não informado'}
${p.historia ? `- História de origem (nas palavras dele): "${p.historia}"` : ''}

AUDIÊNCIA:
- Público-alvo: ${p.audiencia ?? 'não informado'}
- Faixa etária: ${p.faixa_etaria ?? 'não informado'}
- Problema que resolve: ${p.problema_resolvido ?? 'não informado'}
${p.publico_real ? `- O que o público comenta/agradece (nas palavras dele): "${p.publico_real}"` : ''}

CRIAÇÃO:
- Plataformas: ${(p.plataformas ?? []).join(', ') || 'não informado'}
- Formatos preferidos: ${(p.formatos ?? []).join(', ') || 'não informado'}
- Frequência: ${p.frequencia ?? 'não informado'}
${p.conteudo_marcante ? `- Conteúdo que bombou (nas palavras dele): "${p.conteudo_marcante}"` : ''}

ESTILO E VOZ:
- Tom de voz: ${p.tom_de_voz ?? 'não informado'}
- Diferencial único: ${p.diferencial ?? 'não informado'}
${p.inspiracoes ? `- Inspirações: ${p.inspiracoes}` : ''}

OBJETIVOS E PROPÓSITO:
- Objetivos: ${parseArr(p.objetivo) || 'não informado'}
- Principais desafios: ${parseArr(p.desafio_principal) || 'não informado'}
- Meta em 12 meses: ${p.meta_12_meses || 'não informou'}
${p.proposito ? `- Propósito real (nas palavras dele): "${p.proposito}"` : ''}

Escreva a persona agora. Use os relatos pessoais para trazer profundidade real — não generalize:`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const persona = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    // Salvar persona gerada no perfil
    await supabase
      .from('creator_profiles')
      .update({ sobre: persona, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    return new Response(JSON.stringify({ persona }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erro ao gerar persona:', err)
    return new Response(JSON.stringify({ error: 'Erro ao gerar persona' }), { status: 500 })
  }
}
