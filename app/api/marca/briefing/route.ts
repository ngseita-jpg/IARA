import Anthropic from '@anthropic-ai/sdk'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { verificarLimiteMarca, respostaLimiteAtingidoMarca } from '@/lib/checkLimiteMarca'

export const runtime = 'nodejs'
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `Você é a Iara, estrategista sênior de marketing de influência no Brasil. Seu papel aqui é entregar BRIEFINGS DE CAMPANHA profissionais para marcas que vão publicar campanhas no marketplace Iara Hub.

Um briefing bem-feito:
- Deixa claro o OBJETIVO (marca/vendas/awareness/lançamento) e como será medido
- Define o PERFIL DO CRIADOR ideal (nicho, audiência, tom, região, tamanho)
- Lista ENTREGÁVEIS específicos com quantidade e plataforma
- Define DO's e DON'Ts editoriais (tom, hashtags, menções, disclaimer #publi)
- Sugere um PITCH DE 3 LINHAS pra atrair os criadores certos
- Dá TIMELINE realista de produção → aprovação → publicação
- Sugere RANGE DE VALOR realista pro mercado brasileiro 2026

Mercado brasileiro 2026, benchmarks honestos:
- Nano (1-10k): R\$ 150-500 por post · reels: +30%
- Micro (10-100k): R\$ 500-3.000 · reels: +40%
- Médio (100-500k): R\$ 3.000-15.000
- Macro (500k+): R\$ 15.000-80.000
- Celebridade (1M+): R\$ 80k+

Tom: direto, profissional, brasileiro. Sem jargão internacional mal traduzido.

Responda em markdown estruturado. Use ## pra seções e **negrito** pra destaque.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const lim = await verificarLimiteMarca(user.id, 'briefing_mes')
  if (!lim.ok) return respostaLimiteAtingidoMarca(lim)

  const body = await req.json() as {
    produto?: string
    objetivo?: string
    publico_alvo?: string
    budget_total?: string
    contexto?: string
  }

  if (!body.produto?.trim() || !body.objetivo?.trim()) {
    return NextResponse.json({ error: 'Produto e objetivo são obrigatórios' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: brand } = await admin
    .from('brand_profiles')
    .select('nome_empresa, segmento, porte, sobre, nichos_interesse, plataformas_foco')
    .eq('user_id', user.id)
    .maybeSingle()

  const contextoBrand = brand ? `
DADOS DA MARCA:
- Nome: ${brand.nome_empresa ?? 'não informado'}
- Segmento: ${brand.segmento ?? 'não informado'}
- Porte: ${brand.porte ?? 'não informado'}
- Nichos de interesse pré-definidos: ${(brand.nichos_interesse ?? []).join(', ') || 'nenhum'}
- Plataformas foco: ${(brand.plataformas_foco ?? []).join(', ') || 'não definido'}
- Sobre: ${brand.sobre ?? 'não informado'}
` : 'Marca sem perfil preenchido — use premissas neutras.'

  const prompt = `${contextoBrand}

BRIEFING QUE O MARKETING ME MANDOU:
- Produto/serviço foco: ${body.produto}
- Objetivo principal: ${body.objetivo}
- Público-alvo: ${body.publico_alvo || 'definir baseado no produto'}
- Budget total disponível: ${body.budget_total || 'a definir'}
- Contexto extra: ${body.contexto || '(não fornecido)'}

Gere o briefing completo seguindo a estrutura:

## 🎯 Objetivo e KPIs
(1 parágrafo + 3 KPIs mensuráveis)

## 👥 Perfil Ideal do Criador
(nicho, tamanho de audiência, tom, região, características específicas)

## 📦 Entregáveis
(lista específica com quantidade e plataforma — ex: "1 reel de 30-60s no Instagram + 3 stories + 1 carrossel editorial")

## ✅ Do's / ❌ Don'ts editoriais
(tom de voz, hashtags obrigatórias, menções, disclaimer #publi, keywords SEO)

## 💬 Pitch Magnetic (3 linhas pra atrair criadores)
Texto exato que a marca vai usar pra vender a oportunidade aos criadores

## 📅 Timeline sugerida
Semana 1: briefing + casting · Semana 2: produção · Semana 3: aprovação · Semana 4: publicação

## 💰 Range de valor sugerido por criador
(seguindo benchmark realista de 2026)

## 🚀 Próximo passo acionável
(uma ação única e concreta pra marca fazer AGORA)`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: prompt }],
    })
    const briefing = response.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')

    await admin.from('marca_content_history').insert({
      user_id: user.id,
      tipo: 'briefing',
      titulo: body.produto.slice(0, 120),
      dados_json: { objetivo: body.objetivo, publico: body.publico_alvo, budget: body.budget_total },
    })

    return NextResponse.json({ briefing, uso: { atual: lim.usoAtual + 1, limite: lim.limite } })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro' }, { status: 500 })
  }
}
