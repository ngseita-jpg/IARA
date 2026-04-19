import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('id, nome_empresa, segmento, porte')
    .eq('user_id', user.id)
    .single()

  if (!brand) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

  // Vagas e candidaturas
  const { data: vagas } = await supabase
    .from('vagas')
    .select('id, titulo, status, created_at, candidaturas(count)')
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false })

  const totalVagas = vagas?.length ?? 0
  const vagasAbertas = vagas?.filter(v => v.status === 'aberta').length ?? 0
  const totalCandidaturas = vagas?.reduce((acc, v) => {
    const count = (v.candidaturas as { count: number }[])?.[0]?.count ?? 0
    return acc + count
  }, 0) ?? 0

  // Afiliados — produtos e stats
  const { data: produtos } = await supabase
    .from('produtos_afiliados')
    .select(`
      id, titulo, preco, comissao_pct,
      afiliados(id, cliques, vendas_confirmadas, comissao_total, status,
        creator_profiles(nome_artistico))
    `)
    .eq('brand_id', brand.id)
    .eq('ativo', true)

  const produtosStats = (produtos ?? []).map(p => {
    const afiliados = (p.afiliados as unknown as {
      id: string; cliques: number; vendas_confirmadas: number
      comissao_total: number; status: string
      creator_profiles: { nome_artistico: string } | null
    }[]) ?? []
    const ativos = afiliados.filter(a => a.status === 'ativo')
    const totalCliques = afiliados.reduce((s, a) => s + (a.cliques ?? 0), 0)
    const totalVendas = afiliados.reduce((s, a) => s + (a.vendas_confirmadas ?? 0), 0)
    const totalComissao = afiliados.reduce((s, a) => s + (Number(a.comissao_total) ?? 0), 0)
    const faturamentoBruto = p.preco ? totalVendas * Number(p.preco) : 0
    const txConversao = totalCliques > 0 ? ((totalVendas / totalCliques) * 100).toFixed(1) : '0.0'
    return {
      titulo: p.titulo,
      preco: p.preco,
      comissao_pct: p.comissao_pct,
      totalAfiliados: afiliados.length,
      afiliadosAtivos: ativos.length,
      totalCliques,
      totalVendas,
      totalComissao,
      faturamentoBruto,
      txConversao,
      topCriadores: ativos
        .sort((a, b) => (b.vendas_confirmadas ?? 0) - (a.vendas_confirmadas ?? 0))
        .slice(0, 3)
        .map(a => ({
          nome: a.creator_profiles?.nome_artistico ?? 'Criador',
          vendas: a.vendas_confirmadas,
          cliques: a.cliques,
        })),
    }
  })

  const somaCliques = produtosStats.reduce((s, p) => s + p.totalCliques, 0)
  const somaVendas = produtosStats.reduce((s, p) => s + p.totalVendas, 0)
  const somaFaturamento = produtosStats.reduce((s, p) => s + p.faturamentoBruto, 0)
  const somaComissao = produtosStats.reduce((s, p) => s + p.totalComissao, 0)
  const txGeralConversao = somaCliques > 0 ? ((somaVendas / somaCliques) * 100).toFixed(1) : '0.0'

  // Gerar análise com IA
  const contexto = `
Marca: ${brand.nome_empresa} (${brand.segmento ?? 'não informado'}, porte: ${brand.porte ?? 'não informado'})

VAGAS DE CAMPANHA:
- Total de vagas criadas: ${totalVagas}
- Vagas abertas agora: ${vagasAbertas}
- Total de candidaturas recebidas: ${totalCandidaturas}
- Média de candidaturas por vaga: ${totalVagas > 0 ? (totalCandidaturas / totalVagas).toFixed(1) : 0}

PROGRAMA DE AFILIADOS:
- Produtos ativos no programa: ${produtos?.length ?? 0}
- Total de cliques rastreados: ${somaCliques}
- Total de vendas confirmadas: ${somaVendas}
- Taxa de conversão geral: ${txGeralConversao}%
- Faturamento bruto gerado: R$ ${somaFaturamento.toFixed(2)}
- Total pago em comissões: R$ ${somaComissao.toFixed(2)}

PRODUTOS:
${produtosStats.map(p => `- ${p.titulo}: ${p.totalVendas} vendas, ${p.totalCliques} cliques, R$ ${p.faturamentoBruto.toFixed(2)} faturamento`).join('\n')}
`

  let analise = ''
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: `Você é a Iara, analista de ROI de marketing de influência para marcas brasileiras.
Analise os dados fornecidos e entregue:
1. **Resumo executivo** (2-3 frases): situação atual da marca na plataforma
2. **Pontos fortes** (máx 2 bullets): o que está funcionando bem
3. **Oportunidades** (máx 2 bullets): onde pode melhorar com ação concreta
4. **Próximo passo prioritário** (1 frase direta): o que fazer agora

Seja direto, use dados reais, foque em ações práticas. Responda em português.`,
      messages: [{ role: 'user', content: contexto }],
    })
    analise = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')
  } catch {
    analise = 'Análise temporariamente indisponível.'
  }

  return NextResponse.json({
    brand: { nome: brand.nome_empresa, segmento: brand.segmento, porte: brand.porte },
    vagas: { total: totalVagas, abertas: vagasAbertas, candidaturas: totalCandidaturas },
    afiliados: {
      produtos: produtosStats,
      totais: {
        cliques: somaCliques,
        vendas: somaVendas,
        faturamento: somaFaturamento,
        comissao: somaComissao,
        txConversao: txGeralConversao,
      },
    },
    analise,
    geradoEm: new Date().toISOString(),
  })
}
