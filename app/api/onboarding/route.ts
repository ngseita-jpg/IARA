import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr) {
      console.error('[onboarding] auth error:', authErr.message)
      return NextResponse.json({ error: 'Sessão expirada. Recarregue a página.' }, { status: 401 })
    }
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await req.json() as {
      nome_artistico: string
      nicho: string
      plataformas: string[]
      tom_de_voz: string
      objetivo: string
    }

    if (!body.nome_artistico?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Captura cookie de indicação (pode ser null se não veio por link)
    const cookieStore = await cookies()
    const refCode = cookieStore.get('iara_ref')?.value ?? null

    // Admin client bypassa RLS — user_id vem do auth.getUser() verificado, seguro
    const admin = createAdminClient()
    const { error } = await admin
      .from('creator_profiles')
      .upsert({
        user_id: user.id,
        nome_artistico: body.nome_artistico,
        nicho: body.nicho,
        plataformas: body.plataformas,
        tom_de_voz: body.tom_de_voz,
        objetivo: body.objetivo,
        onboarding_completo: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    // Registra indicação pendente se veio de link de afiliado
    if (refCode && !error) {
      const { data: indicador } = await admin
        .from('creator_profiles')
        .select('user_id')
        .eq('ref_code', refCode)
        .maybeSingle()

      // Só registra se o indicador existe e NÃO é o próprio usuário (anti-autoindicação)
      if (indicador?.user_id && indicador.user_id !== user.id) {
        // Upsert porque a tabela tem unique(indicado_user_id) — nunca indica 2x
        await admin
          .from('iara_indicacoes')
          .insert({
            indicador_user_id: indicador.user_id,
            indicado_user_id: user.id,
            status: 'pendente',
          })
          .select()
          .single()
          .then(() => {
            // Limpa o cookie após atribuir (evita atribuição dupla)
          })
          .then(undefined, () => { /* já existia — ignora */ })
      }
    }

    if (error) {
      console.error('[onboarding] supabase upsert error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        user_id: user.id,
      })
      return NextResponse.json({
        error: error.message,
        code: error.code,
      }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[onboarding] unexpected error:', msg, err)
    return NextResponse.json({ error: `Erro interno: ${msg}` }, { status: 500 })
  }
}
