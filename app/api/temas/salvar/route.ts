import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { LIMITES, inicioMesAtual } from '@/lib/limites'

export async function POST(req: NextRequest) {
  const isPreview = req.cookies.get('iara_preview')?.value === '1'
  if (isPreview) return NextResponse.json({ ok: true })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check limit before saving
  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('plano')
    .eq('user_id', user.id)
    .single()

  const plano = (profile?.plano ?? 'free') as keyof typeof LIMITES
  const limite = LIMITES[plano]?.temas ?? null
  const mesAtual = inicioMesAtual()

  if (limite !== null) {
    const { count } = await supabase
      .from('content_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tipo', 'temas')
      .gte('created_at', mesAtual)

    if ((count ?? 0) >= limite) {
      return NextResponse.json({ error: 'limit_reached', limite }, { status: 429 })
    }
  }

  const { error } = await supabase.from('content_history').insert({
    user_id: user.id,
    tipo: 'temas',
    conteudo: '[sessão de geração de temas]',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** Check remaining uses without saving */
export async function GET(req: NextRequest) {
  const isPreview = req.cookies.get('iara_preview')?.value === '1'
  if (isPreview) return NextResponse.json({ restantes: 99, limite: 99 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('plano')
    .eq('user_id', user.id)
    .single()

  const plano = (profile?.plano ?? 'free') as keyof typeof LIMITES
  const limite = LIMITES[plano]?.temas ?? null
  const mesAtual = inicioMesAtual()

  const { count } = await supabase
    .from('content_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('tipo', 'temas')
    .gte('created_at', mesAtual)

  const usado = count ?? 0
  const restantes = limite === null ? null : Math.max(0, limite - usado)
  return NextResponse.json({ usado, limite, restantes })
}
