import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: vagas } = await supabase
    .from('vagas')
    .select('id, titulo, descricao, tipo, valor, nichos, plataformas, prazo_inscricao, nome_empresa, created_at')
    .eq('status', 'aberta')
    .order('created_at', { ascending: false })

  return NextResponse.json({ vagas: vagas ?? [] })
}
