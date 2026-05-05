import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { TERMOS_VERSAO_ATUAL } from '@/lib/termos-versao'

export const runtime = 'nodejs'

/**
 * Registra que o usuario aceitou a versao atual dos termos.
 * Atualiza creator_profiles.termos_versao_aceita + termos_aceitos_at.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const updates = {
    termos_versao_aceita: TERMOS_VERSAO_ATUAL,
    termos_aceitos_at: new Date().toISOString(),
  }

  // Atualiza ambos perfis (se existirem) — user pode ser criador OU marca
  await Promise.all([
    admin.from('creator_profiles').update(updates).eq('user_id', user.id),
    admin.from('brand_profiles').update(updates).eq('user_id', user.id),
  ])

  // Audit log
  void admin.from('api_audit_log').insert({
    user_id: user.id,
    evento: 'termos_aceitos',
    rota: '/api/perfil/aceitar-termos',
    status_http: 200,
    meta: { versao: TERMOS_VERSAO_ATUAL },
  }).then(() => null, () => null)

  return NextResponse.json({ ok: true, versao: TERMOS_VERSAO_ATUAL })
}
