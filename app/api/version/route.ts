import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    version: '2456b0e',
    built: new Date().toISOString(),
    gerar_payload: 'num_imagens_only',
  })
}
