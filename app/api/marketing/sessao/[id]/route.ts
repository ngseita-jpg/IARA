import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/admin'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sessaoId = Number(id)
  if (!sessaoId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: sessao } = await admin
    .from('marketing_squad_sessoes')
    .select('*')
    .eq('id', sessaoId)
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!sessao) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })

  const { data: respostas } = await admin
    .from('marketing_squad_respostas')
    .select('agente, resposta, tokens_input, tokens_output, created_at')
    .eq('sessao_id', sessaoId)
    .order('created_at', { ascending: true })

  return NextResponse.json({
    sessao,
    respostas: respostas ?? [],
  })
}
