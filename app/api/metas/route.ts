import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { PONTOS_ACOES, getLevel } from '@/lib/badges'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const { data } = await supabase
    .from('metas')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return new Response(JSON.stringify(data ?? []), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const body = await req.json()
  const { titulo, descricao, plataforma, meta_tipo, quantidade_meta, data_limite } = body

  if (!titulo?.trim()) {
    return new Response(JSON.stringify({ error: 'Título é obrigatório' }), { status: 400 })
  }

  // Pontos de recompensa baseado na quantidade
  const pontos_recompensa = Math.max(15, (quantidade_meta ?? 1) * PONTOS_ACOES.META_CONCLUIDA)

  const { data, error } = await supabase
    .from('metas')
    .insert({
      user_id: user.id,
      titulo: titulo.trim(),
      descricao: descricao?.trim() || null,
      plataforma: plataforma || null,
      meta_tipo: meta_tipo || 'postagens',
      quantidade_meta: quantidade_meta ?? 1,
      quantidade_atual: 0,
      data_limite: data_limite || null,
      pontos_recompensa,
      status: 'ativa',
    })
    .select()
    .single()

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const { id, action } = await req.json()

  if (!id || !action) {
    return new Response(JSON.stringify({ error: 'id e action são obrigatórios' }), { status: 400 })
  }

  // Buscar meta atual
  const { data: meta, error: fetchError } = await supabase
    .from('metas')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !meta) {
    return new Response(JSON.stringify({ error: 'Meta não encontrada' }), { status: 404 })
  }

  if (meta.status !== 'ativa') {
    return new Response(JSON.stringify({ error: 'Meta já finalizada' }), { status: 400 })
  }

  let updateData: Record<string, unknown> = {}
  let pontosGanhos = 0
  let metaConcluida = false

  if (action === 'incrementar') {
    const novaQtd = meta.quantidade_atual + 1
    updateData.quantidade_atual = novaQtd

    if (novaQtd >= meta.quantidade_meta) {
      updateData.status = 'concluida'
      updateData.concluida_em = new Date().toISOString()
      metaConcluida = true
      pontosGanhos = meta.pontos_recompensa

      // Bônus se antes do prazo
      if (meta.data_limite && new Date() < new Date(meta.data_limite)) {
        pontosGanhos += PONTOS_ACOES.META_BONUS
      }
    }
  } else if (action === 'deletar') {
    await supabase.from('metas').delete().eq('id', id).eq('user_id', user.id)
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  const { data: updated } = await supabase
    .from('metas')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  // Awardar pontos se meta concluída
  if (metaConcluida && pontosGanhos > 0) {
    const { data: profile } = await supabase
      .from('creator_profiles')
      .select('pontos')
      .eq('user_id', user.id)
      .single()

    const pontosAtuais = profile?.pontos ?? 0
    const novosPoints = pontosAtuais + pontosGanhos
    const novoNivel = getLevel(novosPoints)

    await supabase
      .from('creator_profiles')
      .upsert({
        user_id: user.id,
        pontos: novosPoints,
        nivel: novoNivel,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
  }

  return new Response(
    JSON.stringify({ meta: updated, pontos_ganhos: pontosGanhos, meta_concluida: metaConcluida }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return new Response(JSON.stringify({ error: 'id obrigatório' }), { status: 400 })

  await supabase.from('metas').delete().eq('id', id).eq('user_id', user.id)

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
