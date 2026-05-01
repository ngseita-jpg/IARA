import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// GET — retorna estado de notificação do user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data } = await supabase
    .from('user_notif_state')
    .select('uso_50_avisado_em, uso_80_avisado_em, bem_vindo_dica_em')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    uso_50_avisado_em: data?.uso_50_avisado_em ?? null,
    uso_80_avisado_em: data?.uso_80_avisado_em ?? null,
    bem_vindo_dica_em: data?.bem_vindo_dica_em ?? null,
  })
}

// POST — marca um campo como avisado agora (idempotente, upsert)
// body: { campo: 'uso_50_avisado_em' | 'uso_80_avisado_em' | 'bem_vindo_dica_em' }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { campo } = await req.json() as { campo?: string }
  const camposValidos = ['uso_50_avisado_em', 'uso_80_avisado_em', 'bem_vindo_dica_em']
  if (!campo || !camposValidos.includes(campo)) {
    return NextResponse.json({ error: 'Campo inválido' }, { status: 400 })
  }

  const agora = new Date().toISOString()

  const { error } = await supabase
    .from('user_notif_state')
    .upsert({
      user_id: user.id,
      [campo]: agora,
      updated_at: agora,
    }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
