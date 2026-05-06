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
  const pages = pagesData.data ?? []

  // CHECAGEM 1: User nao tem nenhuma Pagina FB
  if (pages.length === 0) {
    return NextResponse.redirect(new URL('/dashboard/metricas?error=sem_pagina_fb', req.url))
  }

  // Procura a PRIMEIRA Pagina que tem IG Business vinculada
  // (user pode ter Paginas que nao tem IG — pulamos elas)
  let igUsername: string | null = null
  let igUserId: string | null = null
  let pageUsada: { id: string; name: string } | null = null

  for (const p of pages) {
    const igRes = await fetch(
      `https://graph.facebook.com/v18.0/${p.id}?fields=instagram_business_account&access_token=${p.access_token}`
    )
    const igData = await igRes.json()
    const candidato = igData.instagram_business_account?.id

    if (candidato) {
      igUserId = candidato
      pageUsada = { id: p.id, name: p.name }
      // Busca o @ da conta IG
      const profileRes = await fetch(
        `https://graph.facebook.com/v18.0/${candidato}?fields=username&access_token=${p.access_token}`
      )
      const profileData = await profileRes.json()
      igUsername = profileData.username ?? null
      break
    }
  }

  // CHECAGEM 2: User tem Pagina(s) mas nenhuma tem IG Business vinculada
  if (!igUserId) {
    return NextResponse.redirect(new URL('/dashboard/metricas?error=ig_nao_vinculada', req.url))
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
