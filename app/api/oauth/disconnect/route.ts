import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const { platform } = await req.json()
  if (!platform) return new Response(JSON.stringify({ error: 'Plataforma não informada' }), { status: 400 })

  await supabase
    .from('social_connections')
    .delete()
    .eq('user_id', user.id)
    .eq('platform', platform)

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
