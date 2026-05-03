import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let profile: { plano: string | null; nome_artistico: string | null; stripe_customer_id: string | null } | null = null
    try {
      const admin = createAdminClient()
      const { data, error: dbErr } = await admin
        .from('creator_profiles')
        .select('plano, nome_artistico, stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (dbErr) {
        console.error('[api/perfil/conta] supabase erro:', dbErr.message)
      } else {
        profile = data
      }

      // Auto-heal: usuário sem profile (ex: cadastro como marca, ou registro
      // antigo antes do trigger). Cria profile mínimo pra UI não quebrar.
      // Usa upsert pra ser idempotente em caso de race condition.
      if (!profile && !dbErr) {
        const { data: created, error: upsertErr } = await admin
          .from('creator_profiles')
          .upsert({ user_id: user.id, plano: 'free' }, { onConflict: 'user_id', ignoreDuplicates: false })
          .select('plano, nome_artistico, stripe_customer_id')
          .maybeSingle()

        if (upsertErr) {
          console.error('[api/perfil/conta] auto-heal upsert erro:', upsertErr.message)
          // Re-tenta SELECT — talvez outro request criou no meio tempo
          const { data: retry } = await admin
            .from('creator_profiles')
            .select('plano, nome_artistico, stripe_customer_id')
            .eq('user_id', user.id)
            .maybeSingle()
          profile = retry
        } else {
          profile = created
        }
      }
    } catch (e) {
      // Se admin client falhar (env var ausente, etc), retorna defaults — UI carrega
      console.error('[api/perfil/conta] admin client erro:', e instanceof Error ? e.message : e)
    }

    return NextResponse.json({
      email: user.email,
      full_name: user.user_metadata?.full_name ?? null,
      plano: profile?.plano ?? 'free',
      nome_artistico: profile?.nome_artistico ?? null,
      stripe_customer_id: profile?.stripe_customer_id ?? null,
    })
  } catch (e) {
    // Último guard: nunca retornar 500 silencioso pra essa rota crítica
    console.error('[api/perfil/conta] erro fatal:', e instanceof Error ? e.message : e)
    return NextResponse.json(
      { error: 'Erro temporário ao carregar conta. Tente novamente.' },
      { status: 503 },
    )
  }
}
