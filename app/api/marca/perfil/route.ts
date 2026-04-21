import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[marca/perfil] GET error:', error.message, error.code)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data ?? null })
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr) {
      console.error('[marca/perfil] auth error:', authErr.message)
      return NextResponse.json({ error: 'Sessão expirada. Recarregue a página.' }, { status: 401 })
    }
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const { data, error } = await supabase
      .from('brand_profiles')
      .upsert(
        { ...body, user_id: user.id, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('[marca/perfil] upsert error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        user_id: user.id,
      })
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[marca/perfil] unexpected error:', msg, err)
    return NextResponse.json({ error: `Erro interno: ${msg}` }, { status: 500 })
  }
}
