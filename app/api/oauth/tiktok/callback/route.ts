import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/dashboard/metricas?error=oauth_cancelled', req.url))
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/tiktok/callback`

  // Trocar code por tokens
  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })
  const tokens = await tokenRes.json()

  if (!tokens.data?.access_token) {
    return NextResponse.redirect(new URL('/dashboard/metricas?error=oauth_failed', req.url))
  }

  const accessToken = tokens.data.access_token

  // Buscar info do usuário TikTok
  const userRes = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,follower_count',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const userData = await userRes.json()
  const tikUser = userData.data?.user

  await supabase.from('social_connections').upsert({
    user_id: user.id,
    platform: 'tiktok',
    access_token: accessToken,
    refresh_token: tokens.data.refresh_token ?? null,
    token_expires_at: new Date(Date.now() + (tokens.data.expires_in ?? 86400) * 1000).toISOString(),
    platform_user_id: tikUser?.open_id ?? null,
    platform_username: tikUser?.display_name ?? null,
    connected_at: new Date().toISOString(),
  }, { onConflict: 'user_id,platform' })

  return NextResponse.redirect(new URL('/dashboard/metricas?connected=tiktok', req.url))
}
