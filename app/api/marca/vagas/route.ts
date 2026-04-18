import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: brand } = await supabase
    .from('brand_profiles').select('id').eq('user_id', user.id).single()
  if (!brand) return NextResponse.json({ vagas: [] })

  const { data: vagas } = await supabase
    .from('vagas')
    .select('*, candidaturas(count)')
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    vagas: (vagas ?? []).map(v => ({
      ...v,
      candidaturas_count: (v.candidaturas as { count: number }[])?.[0]?.count ?? 0,
      candidaturas: undefined,
    })),
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: brand } = await supabase
    .from('brand_profiles').select('id, nome_empresa').eq('user_id', user.id).single()
  if (!brand) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

  const body = await req.json()

  const { data, error } = await supabase
    .from('vagas')
    .insert({
      brand_id: brand.id,
      nome_empresa: brand.nome_empresa,
      titulo: body.titulo,
      descricao: body.descricao || null,
      tipo: body.tipo || 'pago',
      valor: body.valor ? Number(body.valor) : null,
      nichos: body.nichos || [],
      plataformas: body.plataformas || [],
      prazo_inscricao: body.prazo_inscricao || null,
      entregaveis: body.entregaveis?.filter(Boolean) || null,
      status: 'aberta',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ vaga: { ...data, candidaturas_count: 0 } })
}
