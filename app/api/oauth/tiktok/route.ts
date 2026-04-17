import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const clientKey = process.env.TIKTOK_CLIENT_KEY
  if (!clientKey) return NextResponse.redirect(new URL('/dashboard/metricas?error=config_missing', req.url))

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/tiktok/callback`

  const url = new URL('https://www.tiktok.com/v2/auth/authorize/')
  url.searchParams.set('client_key', clientKey)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'user.info.basic,user.info.profile,user.info.stats,video.list')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', user.id)

  return NextResponse.redirect(url.toString())
}
