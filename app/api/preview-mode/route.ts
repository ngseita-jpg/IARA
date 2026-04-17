import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const ativar = req.nextUrl.searchParams.get('ativar') !== 'false'
  const res = NextResponse.json({ ok: true, preview: ativar })

  if (ativar) {
    res.cookies.set('iara_preview', '1', {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 horas
    })
  } else {
    res.cookies.delete('iara_preview')
  }

  return res
}
