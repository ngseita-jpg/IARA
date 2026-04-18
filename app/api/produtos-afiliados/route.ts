import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // If brand, return own products. If creator, return all active products with affiliation status.
  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (brand) {
    const { data } = await supabase
      .from('produtos_afiliados')
      .select('*, afiliados(id, cupom_codigo, status, cliques, vendas_confirmadas, comissao_total, creator_id, creator_profiles!creator_id(nome_artistico))')
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: false })
    return NextResponse.json({ produtos: data ?? [] })
  }

  // Creator view
  const { data: creator } = await supabase
    .from('creator_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: produtos } = await supabase
    .from('produtos_afiliados')
    .select('*, brand_profiles!brand_id(nome_empresa)')
    .eq('ativo', true)
    .eq('webhook_confirmado', true)
    .order('created_at', { ascending: false })

  if (!creator) return NextResponse.json({ produtos: produtos ?? [], minhasAfiliations: [] })

  const { data: minhas } = await supabase
    .from('afiliados')
    .select('*, produtos_afiliados!produto_id(titulo, url_produto, comissao_pct, desconto_pct, brand_profiles!brand_id(nome_empresa))')
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ produtos: produtos ?? [], minhasAfiliations: minhas ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { titulo, descricao, url_produto, preco, imagem_url, comissao_pct, desconto_pct } = body

  if (!titulo || !url_produto || !comissao_pct || !desconto_pct) {
    return NextResponse.json({ error: 'Campos obrigatórios: titulo, url_produto, comissao_pct, desconto_pct' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('produtos_afiliados')
    .insert({ brand_id: brand.id, titulo, descricao, url_produto, preco, imagem_url, comissao_pct, desconto_pct })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ produto: data }, { status: 201 })
}
