import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data, error } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // PGRST116 = row not found — perfil ainda não foi criado
  if (error && error.code !== 'PGRST116') {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify(data ?? null), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function PUT(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await req.json()
  const { nome_artistico, nicho, tom_de_voz, plataformas, objetivo, sobre } = body

  const { data, error } = await supabase
    .from('creator_profiles')
    .upsert(
      {
        user_id: user.id,
        nome_artistico: nome_artistico?.trim() || null,
        nicho: nicho?.trim() || null,
        tom_de_voz: tom_de_voz?.trim() || null,
        plataformas: plataformas ?? [],
        objetivo: objetivo?.trim() || null,
        sobre: sobre?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}
