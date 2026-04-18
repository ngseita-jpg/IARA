import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailPropostaAceita, emailPropostaRecusada } from '@/lib/email'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { acao, valor } = await req.json()
  const newStatus = acao === 'aceitar' ? 'fechado' : 'aberta'
  const updateData: Record<string, unknown> = { status: newStatus }
  if (acao === 'aceitar' && valor) updateData.valor_acordado = Number(valor)

  await supabase.from('conversas').update(updateData).eq('id', id)

  const valorFmt = valor ? ` por R$ ${Number(valor).toLocaleString('pt-BR')}` : ''
  const conteudo = acao === 'aceitar'
    ? `✅ Proposta aceita! Acordo fechado${valorFmt}.`
    : '❌ Proposta recusada. Podemos continuar negociando.'

  await supabase.from('mensagens').insert({
    conversa_id: id,
    sender_id: user.id,
    conteudo,
    tipo: acao === 'aceitar' ? 'aceite' : 'recusa',
  })

  // Notify brand of creator's decision (best-effort)
  const { data: conv } = await supabase
    .from('conversas')
    .select('brand_user_id, creator_user_id, candidatura_id, valor_acordado')
    .eq('id', id)
    .single()

  if (conv) {
    const { data: cand } = await supabase
      .from('candidaturas')
      .select('vagas!vaga_id(titulo), creator_profiles!creator_id(nome_artistico)')
      .eq('id', conv.candidatura_id)
      .single()

    const { data: brandProfile } = await supabase
      .from('brand_profiles')
      .select('nome_empresa')
      .eq('user_id', conv.brand_user_id)
      .single()

    if (cand && brandProfile) {
      const vg = cand.vagas as unknown as { titulo: string } | null
      const cp = cand.creator_profiles as unknown as { nome_artistico: string } | null
      const { data: brandUser } = await supabase.auth.admin.getUserById(conv.brand_user_id)
      if (brandUser?.user?.email && vg && cp) {
        if (acao === 'aceitar') {
          emailPropostaAceita({
            brandEmail: brandUser.user.email,
            brandNome: brandProfile.nome_empresa,
            creatorNome: cp.nome_artistico,
            vagaTitulo: vg.titulo,
            valor: conv.valor_acordado,
          })
        } else {
          emailPropostaRecusada({
            brandEmail: brandUser.user.email,
            brandNome: brandProfile.nome_empresa,
            creatorNome: cp.nome_artistico,
            vagaTitulo: vg.titulo,
          })
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
