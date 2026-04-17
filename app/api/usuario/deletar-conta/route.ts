import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = user.id

  // Remove arquivos do Storage
  const { data: photos } = await supabase
    .from('user_photos')
    .select('storage_path')
    .eq('user_id', userId)

  if (photos && photos.length > 0) {
    const paths = photos.map((p) => p.storage_path)
    await supabase.storage.from('fotos-usuario').remove(paths)
  }

  // Remove dados do banco (cascata pelo ON DELETE CASCADE já cuida das tabelas filhas)
  // Mas fazemos explícito por garantia
  await supabase.from('user_photos').delete().eq('user_id', userId)
  await supabase.from('creator_profiles').delete().eq('user_id', userId)
  await supabase.from('voice_analyses').delete().eq('user_id', userId)
  await supabase.from('metas').delete().eq('user_id', userId)
  await supabase.from('calendar_items').delete().eq('user_id', userId)

  // Deleta o usuário do Auth (requer service role key)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (serviceKey && supabaseUrl) {
    const adminClient = createAdminClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    await adminClient.auth.admin.deleteUser(userId)
  }

  return NextResponse.json({ ok: true })
}
