import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function fmtTempo(seg: number): string {
  const min = Math.floor(seg / 60)
  const s = Math.floor(seg % 60)
  return `${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: video } = await admin
    .from('cortes_videos')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!video) return NextResponse.json({ error: 'Vídeo não encontrado' }, { status: 404 })

  const { data: trechos } = await admin
    .from('cortes_trechos')
    .select('*')
    .eq('video_id', id)
    .order('ordem', { ascending: true })

  return NextResponse.json({
    video,
    trechos: (trechos ?? []).map(t => ({
      ...t,
      inicio_formatado: fmtTempo(t.inicio_segundos),
      fim_formatado: fmtTempo(t.fim_segundos),
      duracao_formatada: fmtTempo(t.fim_segundos - t.inicio_segundos),
    })),
  })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { error } = await admin.from('cortes_videos').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
