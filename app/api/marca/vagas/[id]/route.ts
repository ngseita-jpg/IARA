import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Ownership: vaga.brand_id deve pertencer ao brand_profile do user
  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!brand) return NextResponse.json({ error: 'Marca não encontrada' }, { status: 403 })

  const { status } = await req.json()
  const { error, data } = await supabase
    .from('vagas')
    .update({ status })
    .eq('id', id)
    .eq('brand_id', brand.id)
    .select('id')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data)  return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
