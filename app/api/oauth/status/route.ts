import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Retorna quais providers OAuth estão configurados (env vars presentes).
// Usado pelo client pra desabilitar botão "Conectar" e evitar redirect-loop
// silencioso quando o app ainda não foi cadastrado no provider.
export function GET() {
  return NextResponse.json({
    instagram: !!process.env.META_APP_ID && !!process.env.NEXT_PUBLIC_APP_URL,
    youtube:   !!process.env.GOOGLE_CLIENT_ID && !!process.env.NEXT_PUBLIC_APP_URL,
    tiktok:    !!process.env.TIKTOK_CLIENT_KEY && !!process.env.NEXT_PUBLIC_APP_URL,
    linkedin:  !!process.env.LINKEDIN_CLIENT_ID && !!process.env.NEXT_PUBLIC_APP_URL,
  })
}
