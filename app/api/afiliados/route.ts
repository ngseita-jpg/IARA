import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function gerarCupom(nomeArtistico: string): string {
  const prefixo = nomeArtistico
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5)
  const sufixo = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
  return `${prefixo}${sufixo}`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: creator } = await supabase
    .from('creator_profiles')
    .select('id, nome_artistico')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!creator) return NextResponse.json({ error: 'Complete seu perfil para se afiliar.' }, { status: 404 })

  const { produto_id } = await req.json()
  if (!produto_id) return NextResponse.json({ error: 'produto_id obrigatório' }, { status: 400 })

  // Verifica se produto existe e está ativo
  const { data: produto } = await supabase
    .from('produtos_afiliados')
    .select('id, ativo')
    .eq('id', produto_id)
    .eq('ativo', true)
    .maybeSingle()
  if (!produto) return NextResponse.json({ error: 'Produto não encontrado ou inativo.' }, { status: 404 })

  // Checa se já afiliado
  const { data: existing } = await supabase
    .from('afiliados')
    .select('id, cupom_codigo')
    .eq('produto_id', produto_id)
    .eq('creator_id', creator.id)
    .maybeSingle()
  if (existing) return NextResponse.json({ afiliado: existing })

  // Gera cupom único
  let cupom = gerarCupom(creator.nome_artistico)
  let attempts = 0
  while (attempts < 5) {
    const { data: clash } = await supabase
      .from('afiliados').select('id').eq('cupom_codigo', cupom).maybeSingle()
    if (!clash) break
    cupom = gerarCupom(creator.nome_artistico)
    attempts++
  }

  const { data, error } = await supabase
    .from('afiliados')
    .insert({ produto_id, creator_id: creator.id, cupom_codigo: cupom })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Você já está afiliado a este produto.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ afiliado: data }, { status: 201 })
}
