import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/dashboard/metricas?error=oauth_cancelled', req.url))
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/instagram/callback`

  // Trocar code por token
  const tokenRes = await fetch('https://graph.facebook.com/v18.0/oauth/access_token?' + new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
  }))
  const tokens = await tokenRes.json()

  if (!tokens.access_token) {
    return NextResponse.redirect(new URL('/dashboard/metricas?error=oauth_failed', req.url))
  }

  // Buscar páginas do usuário para encontrar conta Instagram vinculada
  const pagesRes = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokens.access_token}`
  )
  const pagesData = await pagesRes.json()
  const page = pagesData.data?.[0]

  let igUsername = null
  let igUserId = null

  if (page) {
    const igRes = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    )
    const igData = await igRes.json()
    igUserId = igData.instagram_business_account?.id ?? null

    if (igUserId) {
      const profileRes = await fetch(
        `https://graph.facebook.com/v18.0/${igUserId}?fields=username&access_token=${page.access_token}`
      )
      const profileData = await profileRes.json()
      igUsername = profileData.username ?? null
    }
  }

  await supabase.from('social_connections').upsert({
    user_id: user.id,
    platform: 'instagram',
    access_token: tokens.access_token,
    refresh_token: null,
    token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 dias
    platform_user_id: igUserId,
    platform_username: igUsername,
    connected_at: new Date().toISOString(),
  }, { onConflict: 'user_id,platform' })

  return NextResponse.redirect(new URL('/dashboard/metricas?connected=instagram', req.url))
}
