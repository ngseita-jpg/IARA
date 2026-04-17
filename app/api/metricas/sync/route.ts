import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── helpers ──────────────────────────────────────────────────────────────────

function monthStart() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── sync por plataforma ───────────────────────────────────────────────────────

async function syncYouTube(accessToken: string, refreshToken: string | null, userId: string, supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>) {
  let token = accessToken

  // Renovar token se expirado
  if (refreshToken) {
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    const refreshData = await refreshRes.json()
    if (refreshData.access_token) {
      token = refreshData.access_token
      await supabase.from('social_connections').update({
        access_token: token,
        token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
      }).eq('user_id', userId).eq('platform', 'youtube')
    }
  }

  // Estatísticas do canal
  const channelRes = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true',
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const channelData = await channelRes.json()
  const stats = channelData.items?.[0]?.statistics

  if (!stats) return null

  // Analytics mensais
  const analyticsRes = await fetch(
    `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${monthStart()}&endDate=${today()}&metrics=views,likes,comments,shares,estimatedMinutesWatched&dimensions=month`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const analyticsData = await analyticsRes.json()
  const row = analyticsData.rows?.[0]

  return {
    plataforma: 'youtube',
    seguidores: parseInt(stats.subscriberCount ?? '0'),
    visualizacoes_mensais: row ? parseInt(row[1]) : 0,
    curtidas_mensais: row ? parseInt(row[2]) : 0,
    comentarios_mensais: row ? parseInt(row[3]) : 0,
    compartilhamentos_mensais: row ? parseInt(row[4]) : 0,
    alcance_mensal: 0,
    impressoes_mensais: 0,
    salvamentos_mensais: 0,
    posts_mensais: parseInt(stats.videoCount ?? '0'),
  }
}

async function syncInstagram(accessToken: string, userId: string, supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>) {
  // Buscar conta Instagram Business conectada
  const pagesRes = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
  )
  const pagesData = await pagesRes.json()
  const page = pagesData.data?.[0]
  if (!page) return null

  const igRes = await fetch(
    `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
  )
  const igData = await igRes.json()
  const igId = igData.instagram_business_account?.id
  if (!igId) return null

  // Perfil + métricas básicas
  const profileRes = await fetch(
    `https://graph.facebook.com/v18.0/${igId}?fields=followers_count,media_count&access_token=${page.access_token}`
  )
  const profile = await profileRes.json()

  // Insights mensais (reach, impressions)
  const insightRes = await fetch(
    `https://graph.facebook.com/v18.0/${igId}/insights?metric=reach,impressions&period=month&access_token=${page.access_token}`
  )
  const insightData = await insightRes.json()
  const insights = insightData.data ?? []

  const reach = insights.find((i: { name: string; values: { value: number }[] }) => i.name === 'reach')?.values?.[0]?.value ?? 0
  const impressions = insights.find((i: { name: string; values: { value: number }[] }) => i.name === 'impressions')?.values?.[0]?.value ?? 0

  return {
    plataforma: 'instagram',
    seguidores: profile.followers_count ?? 0,
    alcance_mensal: reach,
    impressoes_mensais: impressions,
    posts_mensais: profile.media_count ?? 0,
    visualizacoes_mensais: 0,
    curtidas_mensais: 0,
    comentarios_mensais: 0,
    compartilhamentos_mensais: 0,
    salvamentos_mensais: 0,
  }
}

async function syncTikTok(accessToken: string) {
  const userRes = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=display_name,follower_count,following_count,likes_count,video_count',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const userData = await userRes.json()
  const u = userData.data?.user
  if (!u) return null

  return {
    plataforma: 'tiktok',
    seguidores: u.follower_count ?? 0,
    curtidas_mensais: 0, // TikTok não fornece mensalmente via API gratuita
    visualizacoes_mensais: 0,
    alcance_mensal: 0,
    impressoes_mensais: 0,
    compartilhamentos_mensais: 0,
    salvamentos_mensais: 0,
    posts_mensais: u.video_count ?? 0,
  }
}

async function syncLinkedIn(accessToken: string) {
  const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const profile = await profileRes.json()
  if (!profile.sub) return null

  // LinkedIn não disponibiliza métricas de criadores pessoais via API gratuita
  // Retorna apenas o básico para confirmar conexão
  return {
    plataforma: 'linkedin',
    seguidores: 0,
    alcance_mensal: 0,
    impressoes_mensais: 0,
    curtidas_mensais: 0,
    comentarios_mensais: 0,
    compartilhamentos_mensais: 0,
    salvamentos_mensais: 0,
    visualizacoes_mensais: 0,
    posts_mensais: 0,
  }
}

// ─── rota principal ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const { platform } = await req.json()

  const { data: connections } = await supabase
    .from('social_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('platform', platform ?? undefined)

  if (!connections || connections.length === 0) {
    return new Response(JSON.stringify({ error: 'Nenhuma conta conectada' }), { status: 400 })
  }

  const resultados: string[] = []

  for (const conn of connections) {
    let metricas = null

    try {
      if (conn.platform === 'youtube') {
        metricas = await syncYouTube(conn.access_token, conn.refresh_token, user.id, supabase)
      } else if (conn.platform === 'instagram') {
        metricas = await syncInstagram(conn.access_token, user.id, supabase)
      } else if (conn.platform === 'tiktok') {
        metricas = await syncTikTok(conn.access_token)
      } else if (conn.platform === 'linkedin') {
        metricas = await syncLinkedIn(conn.access_token)
      }
    } catch {
      continue
    }

    if (metricas) {
      await supabase.from('metricas_redes').upsert(
        { user_id: user.id, ...metricas },
        { onConflict: 'user_id,plataforma' }
      )
      resultados.push(conn.platform)
    }
  }

  return NextResponse.json({ synced: resultados })
}

// Retornar conexões ativas do usuário
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })

  const { data } = await supabase
    .from('social_connections')
    .select('platform, platform_username, connected_at, token_expires_at')
    .eq('user_id', user.id)

  return NextResponse.json({ connections: data ?? [] })
}
