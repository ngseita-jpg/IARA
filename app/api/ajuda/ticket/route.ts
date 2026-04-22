import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { emailTicketNovoAdmin } from '@/lib/email'

export const runtime = 'nodejs'

type Categoria = 'conta' | 'pagamento' | 'modulo' | 'bug' | 'sugestao' | 'outro'
const CATEGORIAS: Categoria[] = ['conta', 'pagamento', 'modulo', 'bug', 'sugestao', 'outro']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await req.json() as {
    email?: string
    nome?: string
    categoria: string
    assunto: string
    mensagem: string
  }

  // Validação
  const assunto = (body.assunto ?? '').trim().slice(0, 200)
  const mensagem = (body.mensagem ?? '').trim().slice(0, 5000)
  const categoria = (CATEGORIAS.includes(body.categoria as Categoria) ? body.categoria : 'outro') as Categoria
  const email = (user?.email ?? body.email ?? '').trim().toLowerCase()
  const nome = (body.nome ?? user?.user_metadata?.full_name ?? '').trim().slice(0, 100)

  if (!assunto || !mensagem) {
    return NextResponse.json({ error: 'Assunto e mensagem obrigatórios' }, { status: 400 })
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Busca plano pra contexto (se logado)
  let plano: string | null = null
  if (user) {
    const { data } = await admin
      .from('creator_profiles')
      .select('plano')
      .eq('user_id', user.id)
      .maybeSingle()
    plano = data?.plano ?? null
  }

  const { data: ticket, error } = await admin
    .from('suporte_tickets')
    .insert({
      user_id: user?.id ?? null,
      email,
      nome: nome || null,
      categoria,
      assunto,
      mensagem,
    })
    .select('id')
    .single()

  if (error || !ticket) {
    console.error('[ticket]', error)
    return NextResponse.json({ error: 'Erro ao salvar ticket' }, { status: 500 })
  }

  // Email pra mim (fire-and-forget)
  emailTicketNovoAdmin({
    ticketId: ticket.id,
    userEmail: email,
    userNome: nome || null,
    categoria,
    assunto,
    mensagem,
    userPlano: plano,
  }).catch(() => { /* ignore */ })

  return NextResponse.json({ ok: true, ticket_id: ticket.id })
}

export async function GET() {
  // Lista tickets do usuário logado
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('suporte_tickets')
    .select('id, categoria, assunto, mensagem, status, resposta_admin, created_at, responded_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ tickets: data ?? [] })
}
