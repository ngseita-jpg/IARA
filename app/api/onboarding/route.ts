import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json() as {
    nome_artistico: string
    nicho: string
    plataformas: string[]
    tom_de_voz: string
    objetivo: string
  }

  const { error } = await supabase
    .from('creator_profiles')
    .upsert({
      user_id: user.id,
      nome_artistico: body.nome_artistico,
      nicho: body.nicho,
      plataformas: body.plataformas,
      tom_de_voz: body.tom_de_voz,
      objetivo: body.objetivo,
      onboarding_completo: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
