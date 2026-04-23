import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/admin'

export const runtime = 'nodejs'

async function ensureAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return { admin: false as const, error: NextResponse.json({ error: 'Apenas admin' }, { status: 403 }) }
  }
  return { admin: true as const, user }
}

// GET — lista afiliados elegíveis a pagamento no ciclo atual
export async function GET() {
  const check = await ensureAdmin()
  if (!check.admin) return check.error

  const admin = createAdminClient()
  const hoje = new Date()
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const MIN_PAYOUT = 50

  // Busca saldos da view + dados do perfil
  const { data: saldos } = await admin
    .from('iara_indicacoes_saldo')
    .select('*')

  const indicadoresIds = (saldos ?? [])
    .filter(s => Number(s.saldo_pendente) >= MIN_PAYOUT)
    .map(s => s.indicador_user_id)

  if (indicadoresIds.length === 0) {
    return NextResponse.json({ mes: mesAtual, elegiveis: [], total: 0 })
  }

  // Dados do perfil (nome + pix)
  const { data: perfis } = await admin
    .from('creator_profiles')
    .select('user_id, nome_artistico, full_name, pix_recebimento, pix_tipo')
    .in('user_id', indicadoresIds)

  // Emails
  const elegiveis = await Promise.all(
    indicadoresIds.map(async userId => {
      const saldo = saldos!.find(s => s.indicador_user_id === userId)!
      const perfil = perfis?.find(p => p.user_id === userId)
      const { data: auth } = await admin.auth.admin.getUserById(userId)
      return {
        user_id: userId,
        nome: perfil?.nome_artistico ?? perfil?.full_name ?? 'Sem nome',
        email: auth.user?.email ?? null,
        pix_chave: perfil?.pix_recebimento ?? null,
        pix_tipo: perfil?.pix_tipo ?? null,
        indicacoes_ativas: Number(saldo.indicacoes_ativas ?? 0),
        saldo_pendente: Number(saldo.saldo_pendente),
        total_apurado: Number(saldo.total_apurado),
      }
    })
  )

  const total = elegiveis.reduce((sum, e) => sum + e.saldo_pendente, 0)

  return NextResponse.json({ mes: mesAtual, elegiveis, total })
}

// POST — registra pagamento feito (sem disparar PIX — você paga manual)
export async function POST(req: NextRequest) {
  const check = await ensureAdmin()
  if (!check.admin) return check.error

  const body = await req.json() as {
    indicador_user_id: string
    valor_total: number
    comprovante_url?: string
    observacoes?: string
  }

  if (!body.indicador_user_id || !body.valor_total) {
    return NextResponse.json({ error: 'user_id e valor obrigatórios' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Busca perfil pra gravar pix
  const { data: perfil } = await admin
    .from('creator_profiles')
    .select('pix_recebimento, pix_tipo')
    .eq('user_id', body.indicador_user_id)
    .maybeSingle()

  if (!perfil?.pix_recebimento) {
    return NextResponse.json({ error: 'Afiliado sem PIX cadastrado' }, { status: 400 })
  }

  // Captura todos eventos NÃO pagos desse afiliado
  const { data: eventos } = await admin
    .from('iara_indicacoes_eventos')
    .select('id, indicacao_id, iara_indicacoes!inner(indicador_user_id)')
    .eq('iara_indicacoes.indicador_user_id', body.indicador_user_id)

  const eventosIds = (eventos ?? []).map(e => e.id)

  const hoje = new Date()
  const referenciaMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`

  const { data: pag, error } = await admin
    .from('iara_indicacoes_pagamentos')
    .insert({
      indicador_user_id: body.indicador_user_id,
      referencia_mes: referenciaMes,
      valor_total: body.valor_total,
      eventos_ids: eventosIds,
      pix_chave: perfil.pix_recebimento,
      pix_tipo: perfil.pix_tipo,
      status: 'pago',
      pago_at: new Date().toISOString(),
      comprovante_url: body.comprovante_url ?? null,
      observacoes: body.observacoes ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, pagamento_id: pag.id })
}
