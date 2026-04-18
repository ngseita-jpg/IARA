import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { LIMITES, inicioMesAtual } from '@/lib/limites'

export async function GET(req: NextRequest) {
  const isPreview = req.cookies.get('iara_preview')?.value === '1'

  if (isPreview) {
    return NextResponse.json({
      plano: 'free',
      uso: {
        roteiro:   { usado: 2, limite: 3 },
        carrossel: { usado: 2, limite: 2 },
        thumbnail: { usado: 1, limite: 2 },
        stories:   { usado: 1, limite: 2 },
        oratorio:  { usado: 0, limite: 1 },
        midia_kit: { usado: 0, limite: 1 },
        temas:     { usado: 1, limite: 2 },
        fotos:     { usado: 3, limite: 5 },
      },
    })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('plano')
    .eq('user_id', user.id)
    .single()

  const plano = (profile?.plano ?? 'free') as keyof typeof LIMITES
  const limites = LIMITES[plano]
  const mesAtual = inicioMesAtual()
  const uid = user.id

  const [
    { count: roteiro },
    { count: carrossel },
    { count: thumbnail },
    { count: stories },
    { count: midia_kit },
    { count: temas },
    { count: fotos },
    { count: oratorio },
  ] = await Promise.all([
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'roteiro').gte('created_at', mesAtual),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'carrossel').gte('created_at', mesAtual),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'thumbnail').gte('created_at', mesAtual),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'stories').gte('created_at', mesAtual),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'midia_kit').gte('created_at', mesAtual),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'temas').gte('created_at', mesAtual),
    supabase.from('content_history').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('tipo', 'foto').gte('created_at', mesAtual),
    supabase.from('voice_analyses').select('*', { count: 'exact', head: true }).eq('user_id', uid).gte('created_at', mesAtual),
  ])

  return NextResponse.json({
    plano,
    uso: {
      roteiro:   { usado: roteiro ?? 0,   limite: limites.roteiro },
      carrossel: { usado: carrossel ?? 0, limite: limites.carrossel },
      thumbnail: { usado: thumbnail ?? 0, limite: limites.thumbnail },
      stories:   { usado: stories ?? 0,   limite: limites.stories },
      oratorio:  { usado: oratorio ?? 0,  limite: limites.oratorio },
      midia_kit: { usado: midia_kit ?? 0, limite: limites.midia_kit },
      temas:     { usado: temas ?? 0,     limite: limites.temas },
      fotos:     { usado: fotos ?? 0,     limite: limites.fotos },
    },
  })
}
