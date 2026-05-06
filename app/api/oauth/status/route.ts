import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Retorna quais providers OAuth estao configurados (env vars presentes).
// Usado pelo client pra desabilitar botao "Conectar" e evitar redirect-loop
// silencioso quando o app ainda nao foi cadastrado no provider.
//
// Instagram: temos config (META_APP_ID, etc) mas o app esta em DEV MODE no Meta
// — apenas testers cadastrados conectam. Pra liberar pra todos os users, precisa
// passar pela App Review (2-4 sem). Ate la, INSTAGRAM_OAUTH_LIVE=true bypassa.
export function GET() {
  const instagramConfigOk = !!process.env.META_APP_ID && !!process.env.NEXT_PUBLIC_APP_URL
  const instagramLiberado = process.env.INSTAGRAM_OAUTH_LIVE === 'true'

  return NextResponse.json({
    instagram: instagramConfigOk && instagramLiberado,
    youtube:   !!process.env.GOOGLE_CLIENT_ID && !!process.env.NEXT_PUBLIC_APP_URL,
    tiktok:    !!process.env.TIKTOK_CLIENT_KEY && !!process.env.NEXT_PUBLIC_APP_URL,
    linkedin:  !!process.env.LINKEDIN_CLIENT_ID && !!process.env.NEXT_PUBLIC_APP_URL,
  })
}
