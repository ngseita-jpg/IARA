import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { checkRateLimitIp } from '@/lib/rateLimit'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Rate limit duro: 3 tentativas por IP em 1h (impede ataque acidental ou malicioso)
  const rl = await checkRateLimitIp(req, 'delete_account', 3, 3600)
  if (rl) {
    await audit(req, 'rate_limit_atingido', {
      userId: user.id,
      statusHttp: 429,
      meta: { bucket: 'delete_account' },
    })
    return rl
  }

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

  // Remove dados do banco (explícito por garantia, independente de ON DELETE CASCADE)
  await Promise.all([
    supabase.from('user_photos').delete().eq('user_id', userId),
    supabase.from('creator_profiles').delete().eq('user_id', userId),
    supabase.from('voice_analyses').delete().eq('user_id', userId),
    supabase.from('metas').delete().eq('user_id', userId),
    supabase.from('calendar_items').delete().eq('user_id', userId),
    supabase.from('metricas_redes').delete().eq('user_id', userId),
    supabase.from('content_history').delete().eq('user_id', userId),
    supabase.from('social_connections').delete().eq('user_id', userId),
  ])

  // Deleta o usuário do Auth (requer service role key)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (serviceKey && supabaseUrl) {
    const adminClient = createAdminClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    await adminClient.auth.admin.deleteUser(userId)
  }

  // Audit (com user_id null no log que sobra após deletar)
  await audit(req, 'conta_deletada', {
    userId: null,
    statusHttp: 200,
    meta: { ex_user_id: userId, ex_email: user.email },
  })

  return NextResponse.json({ ok: true })
}
