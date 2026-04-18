import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id: afiliado_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify brand owns this affiliation's product
  const { data: brand } = await supabase
    .from('brand_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: afiliado } = await supabase
    .from('afiliados')
    .select('id, produto_id, comissao_total, vendas_confirmadas, produtos_afiliados!produto_id(comissao_pct, brand_id)')
    .eq('id', afiliado_id)
    .maybeSingle()

  const prod = afiliado?.produtos_afiliados as unknown as { comissao_pct: number; brand_id: string } | null
  if (!afiliado || prod?.brand_id !== brand.id) {
    return NextResponse.json({ error: 'Afiliação não encontrada' }, { status: 404 })
  }

  const { valor_venda, observacoes } = await req.json()
  if (!valor_venda || valor_venda <= 0) {
    return NextResponse.json({ error: 'valor_venda obrigatório e positivo' }, { status: 400 })
  }

  const comissaoBruta = (valor_venda * (prod!.comissao_pct / 100))
  const comissao_criador = Number((comissaoBruta * 0.9).toFixed(2))
  const comissao_iara    = Number((comissaoBruta * 0.1).toFixed(2))

  const { error: insertError } = await supabase
    .from('vendas_afiliado')
    .insert({ afiliado_id, valor_venda, comissao_criador, comissao_iara, observacoes })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Update totals on afiliados row
  await supabase
    .from('afiliados')
    .update({
      vendas_confirmadas: (afiliado.vendas_confirmadas ?? 0) + 1,
      comissao_total: Number(((afiliado.comissao_total ?? 0) + comissao_criador).toFixed(2)),
    })
    .eq('id', afiliado_id)

  return NextResponse.json({ ok: true, comissao_criador, comissao_iara }, { status: 201 })
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: afiliado_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('vendas_afiliado')
    .select('*')
    .eq('afiliado_id', afiliado_id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ vendas: data ?? [] })
}
