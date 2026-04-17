import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = user.id

  const [profile, voiceAnalyses, metas, calendarItems, photos] = await Promise.all([
    supabase.from('creator_profiles').select('*').eq('user_id', userId).single(),
    supabase.from('voice_analyses').select('*').eq('user_id', userId),
    supabase.from('metas').select('*').eq('user_id', userId),
    supabase.from('calendar_items').select('*').eq('user_id', userId),
    supabase.from('user_photos').select('id, nome, public_url, tamanho_kb, created_at').eq('user_id', userId),
  ])

  const payload = {
    exportado_em: new Date().toISOString(),
    usuario: {
      id: user.id,
      email: user.email,
      criado_em: user.created_at,
    },
    perfil: profile.data ?? null,
    analises_voz: voiceAnalyses.data ?? [],
    metas: metas.data ?? [],
    calendario: calendarItems.data ?? [],
    fotos: photos.data ?? [],
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="iara-dados-${userId.slice(0, 8)}.json"`,
    },
  })
}
