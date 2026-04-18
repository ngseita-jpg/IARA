import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 })

  const { data: conversas } = await supabase
    .from('conversas')
    .select('id')
    .or(`brand_user_id.eq.${user.id},creator_user_id.eq.${user.id}`)

  if (!conversas?.length) return NextResponse.json({ count: 0 })

  const ids = conversas.map(c => c.id)
  const { count } = await supabase
    .from('mensagens')
    .select('*', { count: 'exact', head: true })
    .in('conversa_id', ids)
    .neq('sender_id', user.id)
    .eq('lida', false)

  return NextResponse.json({ count: count ?? 0 })
}
