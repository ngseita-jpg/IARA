import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const maxDuration = 60

// Colunas reais que existem em brand_profiles em produção
const COLUNAS_VALIDAS = new Set([
  'nome_empresa', 'cnpj', 'segmento', 'porte', 'site', 'instagram', 'sobre',
  'orcamento_medio', 'nichos_interesse', 'plataformas_foco', 'plano',
  'onboarding_completo', 'stripe_customer_id', 'stripe_subscription_id', 'plano_periodo',
])

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin client bypassa RLS — user_id vem de auth verificado, seguro
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('brand_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('[marca/perfil] GET error:', error.message, error.code)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ profile: data ?? null })
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sessão expirada. Recarregue a página.' }, { status: 401 })

    const body = await req.json()

    // Filtra payload mantendo só colunas válidas — evita erro 500 se schema
    // tem divergência entre dev e prod
    const clean: Record<string, unknown> = { user_id: user.id, updated_at: new Date().toISOString() }
    for (const [k, v] of Object.entries(body)) {
      if (COLUNAS_VALIDAS.has(k)) clean[k] = v
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('brand_profiles')
      .upsert(clean, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('[marca/perfil] upsert error:', error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }
    return NextResponse.json({ profile: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[marca/perfil] unexpected error:', msg, err)
    return NextResponse.json({ error: `Erro interno: ${msg}` }, { status: 500 })
  }
}
