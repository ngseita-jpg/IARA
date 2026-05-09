import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const hoje = new Date().toISOString().slice(0, 10)

  const { data: post } = await admin
    .from('manha_posts')
    .select('id, data, tema, slides_json, legenda, hashtags, status, imagens_geradas')
    .eq('user_id', user.id)
    .eq('data', hoje)
    .maybeSingle()

  if (!post || post.status !== 'pronto') {
    return NextResponse.json({ post: null })
  }

  return NextResponse.json({ post })
}
