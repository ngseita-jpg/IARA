import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/afiliados/testar-webhook/[id]
 * Marca webhook_confirmado=true para um produto da marca autenticada.
 * A marca deve confirmar que integrou o webhook no checkout antes de chamar isso.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!brand) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: produto, error: fetchError } = await supabase
    .from('produtos_afiliados')
    .select('id, webhook_confirmado')
    .eq('id', id)
    .eq('brand_id', brand.id)
    .maybeSingle()

  if (fetchError || !produto) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  const { error } = await supabase
    .from('produtos_afiliados')
    .update({ webhook_confirmado: true })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
