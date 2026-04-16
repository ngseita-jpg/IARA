import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const appId = process.env.META_APP_ID
  if (!appId) return NextResponse.redirect(new URL('/dashboard/metricas?error=config_missing', req.url))

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/instagram/callback`

  const url = new URL('https://www.facebook.com/v18.0/dialog/oauth')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement')
  url.searchParams.set('state', user.id)

  return NextResponse.redirect(url.toString())
}
