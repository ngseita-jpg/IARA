import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/afiliados/webhook
 *
 * Endpoint que a loja da marca integra no checkout para confirmar vendas automaticamente.
 * Sem autenticação de usuário — autenticado via webhook_secret do produto.
 *
 * Body: { cupom: string, valor_venda: number, secret: string, observacoes?: string }
 *
 * Exemplo de uso em Shopify (Order webhook):
 *   fetch('https://iarahubapp.com.br/api/afiliados/webhook', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ cupom: order.discount_codes[0].code, valor_venda: order.total_price, secret: 'SEU_SECRET' })
 *   })
 */
export async function POST(req: NextRequest) {
  let body: { cupom?: string; valor_venda?: number; secret?: string; observacoes?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  const { cupom, valor_venda, secret, observacoes } = body

  if (!cupom || !valor_venda || !secret) {
    return NextResponse.json({ error: 'cupom, valor_venda e secret são obrigatórios' }, { status: 400 })
  }
  if (typeof valor_venda !== 'number' || valor_venda <= 0) {
    return NextResponse.json({ error: 'valor_venda deve ser um número positivo' }, { status: 400 })
  }

  const supabase = await createClient()

  // Busca afiliado pelo cupom
  const { data: afiliado } = await supabase
    .from('afiliados')
    .select('id, cliques, vendas_confirmadas, comissao_total, produto_id, produtos_afiliados!produto_id(comissao_pct, webhook_secret, brand_id)')
    .eq('cupom_codigo', cupom.toUpperCase())
    .eq('status', 'ativo')
    .maybeSingle()

  if (!afiliado) {
    return NextResponse.json({ error: 'Cupom inválido ou inativo' }, { status: 404 })
  }

  const prod = afiliado.produtos_afiliados as unknown as {
    comissao_pct: number
    webhook_secret: string
    brand_id: string
  } | null

  // Valida o secret do produto — barreira contra chamadas forjadas
  if (!prod || prod.webhook_secret !== secret) {
    return NextResponse.json({ error: 'Secret inválido' }, { status: 401 })
  }

  const comissaoBruta   = valor_venda * (prod.comissao_pct / 100)
  const comissao_criador = Number((comissaoBruta * 0.9).toFixed(2))
  const comissao_iara    = Number((comissaoBruta * 0.1).toFixed(2))

  const { error: insertError } = await supabase
    .from('vendas_afiliado')
    .insert({
      afiliado_id: afiliado.id,
      valor_venda,
      comissao_criador,
      comissao_iara,
      observacoes: observacoes ?? 'Via webhook automático',
      origem: 'webhook',
    })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Atualiza totais + limpa flag de suspeito
  await supabase
    .from('afiliados')
    .update({
      vendas_confirmadas: (afiliado.vendas_confirmadas ?? 0) + 1,
      comissao_total: Number(((afiliado.comissao_total ?? 0) + comissao_criador).toFixed(2)),
      suspeito: false,
    })
    .eq('id', afiliado.id)

  // Marca o produto como confirmado (caso ainda não esteja) — primeira venda real via webhook é prova suficiente
  await supabase
    .from('produtos_afiliados')
    .update({ webhook_confirmado: true })
    .eq('id', afiliado.produto_id)
    .eq('webhook_confirmado', false)

  return NextResponse.json({
    ok: true,
    comissao_criador,
    comissao_iara,
    mensagem: 'Venda registrada automaticamente.',
  })
}
