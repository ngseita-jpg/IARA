import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// GET /api/indicacoes — retorna dados do afiliado logado (link, saldo, histórico)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()

  // Garante ref_code (gera se não existe)
  const { data: perfil } = await admin
    .from('creator_profiles')
    .select('ref_code, nome_artistico, pix_recebimento, pix_tipo')
    .eq('user_id', user.id)
    .maybeSingle()

  let refCode = perfil?.ref_code
  if (!refCode) {
    const { data: novoRef } = await admin.rpc('gerar_ref_code')
    refCode = novoRef as string
    await admin
      .from('creator_profiles')
      .update({ ref_code: refCode })
      .eq('user_id', user.id)
  }

  // Indicações do usuário com eventos agregados
  const { data: indicacoes } = await admin
    .from('iara_indicacoes')
    .select(`
      id, status, plano, valor_primeira_venda, valor_recorrente_mensal,
      meses_recorrencia_pagos, meses_recorrencia_total, valor_total_apurado,
      created_at, ativada_at
    `)
    .eq('indicador_user_id', user.id)
    .order('created_at', { ascending: false })

  // Saldo consolidado (via view)
  const { data: saldoRow } = await admin
    .from('iara_indicacoes_saldo')
    .select('*')
    .eq('indicador_user_id', user.id)
    .maybeSingle()

  // Últimos pagamentos
  const { data: pagamentos } = await admin
    .from('iara_indicacoes_pagamentos')
    .select('id, referencia_mes, valor_total, status, pago_at, created_at')
    .eq('indicador_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(12)

  return NextResponse.json({
    ref_code: refCode,
    link_completo: `https://iarahubapp.com.br/?ref=${refCode}`,
    pix: {
      chave: perfil?.pix_recebimento ?? null,
      tipo: perfil?.pix_tipo ?? null,
    },
    saldo: {
      indicacoes_ativas: Number(saldoRow?.indicacoes_ativas ?? 0),
      indicacoes_pendentes: Number(saldoRow?.indicacoes_pendentes ?? 0),
      total_apurado: Number(saldoRow?.total_apurado ?? 0),
      total_pago: Number(saldoRow?.total_pago ?? 0),
      saldo_pendente: Number(saldoRow?.saldo_pendente ?? 0),
    },
    indicacoes: indicacoes ?? [],
    pagamentos: pagamentos ?? [],
  })
}

// PATCH /api/indicacoes — atualiza chave PIX
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json() as { pix_chave?: string; pix_tipo?: string }
  const chave = (body.pix_chave ?? '').trim().slice(0, 200)
  const tipo = body.pix_tipo

  const tiposValidos = ['cpf', 'cnpj', 'email', 'celular', 'aleatoria']
  if (!chave || !tipo || !tiposValidos.includes(tipo)) {
    return NextResponse.json({ error: 'Chave PIX e tipo válidos são obrigatórios' }, { status: 400 })
  }

  const admin = createAdminClient()
  await admin
    .from('creator_profiles')
    .update({ pix_recebimento: chave, pix_tipo: tipo })
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
