import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const HANDLE_REGEX = /^[a-z0-9][a-z0-9_-]{2,29}$/

// GET — retorna config pública atual do user logado
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data } = await supabase
    .from('creator_profiles')
    .select('handle_publico, midia_kit_publico')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    handle: data?.handle_publico ?? null,
    publico: data?.midia_kit_publico ?? false,
  })
}

// POST — atualiza handle e/ou flag publico
// body: { handle?: string | null, publico?: boolean }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json() as { handle?: string | null; publico?: boolean }

  const update: Record<string, unknown> = {}

  if (typeof body.handle !== 'undefined') {
    if (body.handle === null || body.handle === '') {
      update.handle_publico = null
    } else {
      const h = body.handle.toLowerCase().trim()
      if (!HANDLE_REGEX.test(h)) {
        return NextResponse.json({
          error: 'Handle inválido. Use 3-30 caracteres: letras, números, _ ou -',
        }, { status: 400 })
      }
      // Checa colisão com índice unique
      const admin = createAdminClient()
      const { data: existente } = await admin
        .from('creator_profiles')
        .select('user_id')
        .eq('handle_publico', h)
        .neq('user_id', user.id)
        .maybeSingle()
      if (existente) {
        return NextResponse.json({ error: 'Esse handle já está em uso' }, { status: 409 })
      }
      update.handle_publico = h
    }
  }

  if (typeof body.publico === 'boolean') {
    update.midia_kit_publico = body.publico
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada pra atualizar' }, { status: 400 })
  }

  const { error } = await supabase
    .from('creator_profiles')
    .update(update)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
