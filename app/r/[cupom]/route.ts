import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ cupom: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { cupom } = await params
  const supabase = await createClient()

  const { data: afiliado } = await supabase
    .from('afiliados')
    .select('id, cliques, produtos_afiliados!produto_id(url_produto)')
    .eq('cupom_codigo', cupom.toUpperCase())
    .eq('status', 'ativo')
    .maybeSingle()

  if (!afiliado) {
    return NextResponse.redirect(new URL('/', _req.url))
  }

  // Track click (fire and forget)
  supabase
    .from('afiliados')
    .update({ cliques: (afiliado.cliques ?? 0) + 1 })
    .eq('id', afiliado.id)
    .then(() => {})

  const url = (afiliado.produtos_afiliados as unknown as { url_produto: string } | null)?.url_produto
  if (!url) return NextResponse.redirect(new URL('/', _req.url))

  return NextResponse.redirect(url)
}
