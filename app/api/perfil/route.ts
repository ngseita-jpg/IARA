import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })
  }

  // Admin client bypassa RLS — user_id vem de auth.getUser() já verificado, é seguro
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('creator_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify(data ?? null), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })
  }

  const body = await req.json()

  // Admin client bypassa RLS — user_id é fixado abaixo a partir do auth verificado
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('creator_profiles')
    .upsert(
      {
        user_id: user.id,
        nome_artistico:     body.nome_artistico?.trim()     || null,
        nicho:              body.nicho?.trim()              || null,
        sub_nicho:          body.sub_nicho?.trim()          || null,
        estagio:            body.estagio?.trim()            || null,
        historia:           body.historia?.trim()           || null,
        audiencia:          body.audiencia?.trim()          || null,
        faixa_etaria:       body.faixa_etaria?.trim()       || null,
        problema_resolvido: body.problema_resolvido?.trim() || null,
        publico_real:       body.publico_real?.trim()       || null,
        plataformas:        body.plataformas                ?? [],
        formatos:           body.formatos                   ?? [],
        frequencia:         body.frequencia?.trim()         || null,
        conteudo_marcante:  body.conteudo_marcante?.trim()  || null,
        tom_de_voz:         body.tom_de_voz?.trim()         || null,
        diferencial:        body.diferencial?.trim()        || null,
        inspiracoes:        body.inspiracoes?.trim()        || null,
        objetivo:           Array.isArray(body.objetivos) ? JSON.stringify(body.objetivos) : (body.objetivo?.trim() || null),
        desafio_principal:  Array.isArray(body.desafios)   ? JSON.stringify(body.desafios)  : (body.desafio_principal?.trim() || null),
        meta_12_meses:      body.meta_12_meses?.trim()      || null,
        proposito:          body.proposito?.trim()          || null,
        video_referencias:  body.video_referencias          ?? [],
        sobre:              body.sobre?.trim()              || null,
        updated_at:        new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}
