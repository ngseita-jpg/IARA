import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getLevel, PONTOS_ACOES } from '@/lib/badges'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const { searchParams } = new URL(req.url)
  const inicio = searchParams.get('inicio')
  const fim = searchParams.get('fim')

  let query = supabase
    .from('calendar_items')
    .select('*, meta:meta_id(id, titulo, quantidade_atual, quantidade_meta, pontos_recompensa, status)')
    .eq('user_id', user.id)
    .order('data_planejada', { ascending: true })

  if (inicio) query = query.gte('data_planejada', inicio)
  if (fim) query = query.lte('data_planejada', fim)

  const { data } = await query

  // Buscar metas ativas para o painel lateral
  const { data: metas } = await supabase
    .from('metas')
    .select('id, titulo, plataforma, meta_tipo, quantidade_atual, quantidade_meta, pontos_recompensa, status, data_limite')
    .eq('user_id', user.id)
    .eq('status', 'ativa')
    .order('created_at', { ascending: false })

  return new Response(JSON.stringify({ items: data ?? [], metas: metas ?? [] }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const body = await req.json()
  const { titulo, plataforma, tipo_conteudo, data_planejada, meta_id } = body

  if (!titulo?.trim() || !data_planejada) {
    return new Response(JSON.stringify({ error: 'Título e data são obrigatórios' }), { status: 400 })
  }

  const { data, error } = await supabase
    .from('calendar_items')
    .insert({
      user_id: user.id,
      titulo: titulo.trim(),
      plataforma: plataforma || null,
      tipo_conteudo: tipo_conteudo || 'post',
      data_planejada,
      meta_id: meta_id || null,
      pontos: PONTOS_ACOES.ITEM_CALENDARIO,
    })
    .select('*, meta:meta_id(id, titulo, quantidade_atual, quantidade_meta, pontos_recompensa, status)')
    .single()

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const { id } = await req.json()
  if (!id) return new Response(JSON.stringify({ error: 'id obrigatório' }), { status: 400 })

  // Buscar item
  const { data: item } = await supabase
    .from('calendar_items')
    .select('*, meta:meta_id(id, quantidade_atual, quantidade_meta, pontos_recompensa, status)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!item || item.concluido) {
    return new Response(JSON.stringify({ error: 'Item não encontrado ou já concluído' }), { status: 404 })
  }

  // Marcar item como concluído
  await supabase
    .from('calendar_items')
    .update({ concluido: true, concluido_em: new Date().toISOString() })
    .eq('id', id)

  let pontosGanhos = item.pontos ?? 5
  let metaConcluida = false
  let metaPontos = 0

  // Se tem meta vinculada e ela ainda está ativa, incrementar progresso
  if (item.meta_id && item.meta?.status === 'ativa') {
    const novaQtd = (item.meta.quantidade_atual ?? 0) + 1

    const updateMeta: Record<string, unknown> = { quantidade_atual: novaQtd }

    if (novaQtd >= item.meta.quantidade_meta) {
      updateMeta.status = 'concluida'
      updateMeta.concluida_em = new Date().toISOString()
      metaConcluida = true
      metaPontos = item.meta.pontos_recompensa ?? 25
      pontosGanhos += metaPontos
    }

    await supabase
      .from('metas')
      .update(updateMeta)
      .eq('id', item.meta_id)
      .eq('user_id', user.id)
  }

  // Creditar pontos no perfil
  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('pontos')
    .eq('user_id', user.id)
    .single()

  const novosPoints = (profile?.pontos ?? 0) + pontosGanhos
  await supabase
    .from('creator_profiles')
    .upsert({ user_id: user.id, pontos: novosPoints, nivel: getLevel(novosPoints), updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

  return new Response(
    JSON.stringify({ ok: true, pontos_ganhos: pontosGanhos, meta_concluida: metaConcluida, pontos_total: novosPoints }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return new Response(JSON.stringify({ error: 'id obrigatório' }), { status: 400 })

  await supabase.from('calendar_items').delete().eq('id', id).eq('user_id', user.id)

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
}
