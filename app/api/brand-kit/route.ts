import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * GET — retorna brand kit do user (ou null se nao tem).
 * Usado pela /dashboard/brand-kit pra mostrar o estado atual + por outras
 * rotas IA (carrossel, post-do-dia) pra injetar contexto visual no prompt.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('brand_kits')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error && /relation.*does not exist/i.test(error.message ?? '')) {
    return NextResponse.json({ brand_kit: null, setup_pendente: true })
  }
  return NextResponse.json({ brand_kit: data ?? null })
}

/**
 * DELETE — apaga o brand kit (user quer recomecar do zero).
 */
export async function DELETE(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()
  await admin.from('brand_kits').delete().eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
