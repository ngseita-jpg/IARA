import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// GET — busca métricas do usuário + última análise de IA
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const [{ data: metricas }, { data: ultimaAnalise }, { data: profile }] = await Promise.all([
    supabase
      .from('metricas_redes')
      .select('*')
      .eq('user_id', user.id)
      .order('plataforma'),
    supabase
      .from('analises_metricas')
      .select('analise, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('creator_profiles')
      .select('nicho, tom_de_voz, nome_artistico, plataformas, objetivo, voz_perfil, sobre')
      .eq('user_id', user.id)
      .single(),
  ])

  return new Response(
    JSON.stringify({
      metricas: metricas ?? [],
      ultimaAnalise: ultimaAnalise ?? null,
      profile: profile ?? null,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// POST — upsert métricas de uma plataforma
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const body = await req.json()
  const {
    plataforma,
    seguidores,
    alcance_mensal,
    impressoes_mensais,
    curtidas_mensais,
    comentarios_mensais,
    compartilhamentos_mensais,
    salvamentos_mensais,
    visualizacoes_mensais,
    posts_mensais,
  } = body

  if (!plataforma) {
    return new Response(JSON.stringify({ error: 'plataforma obrigatória' }), { status: 400 })
  }

  // Calcular taxa de engajamento automaticamente
  const interacoes = (curtidas_mensais ?? 0) + (comentarios_mensais ?? 0) + (compartilhamentos_mensais ?? 0) + (salvamentos_mensais ?? 0)
  const alcance = alcance_mensal ?? 0
  const taxa_engajamento = alcance > 0 ? Math.round((interacoes / alcance) * 10000) / 100 : null

  const { data, error } = await supabase
    .from('metricas_redes')
    .upsert({
      user_id: user.id,
      plataforma,
      seguidores: seguidores ?? 0,
      alcance_mensal: alcance_mensal ?? 0,
      impressoes_mensais: impressoes_mensais ?? 0,
      curtidas_mensais: curtidas_mensais ?? 0,
      comentarios_mensais: comentarios_mensais ?? 0,
      compartilhamentos_mensais: compartilhamentos_mensais ?? 0,
      salvamentos_mensais: salvamentos_mensais ?? 0,
      visualizacoes_mensais: visualizacoes_mensais ?? 0,
      posts_mensais: posts_mensais ?? 0,
      taxa_engajamento,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,plataforma' })
    .select()
    .single()

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
}

// DELETE — remove uma plataforma
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const { searchParams } = new URL(req.url)
  const plataforma = searchParams.get('plataforma')
  if (!plataforma) return new Response(JSON.stringify({ error: 'plataforma obrigatória' }), { status: 400 })

  await supabase.from('metricas_redes').delete().eq('user_id', user.id).eq('plataforma', plataforma)

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
}
