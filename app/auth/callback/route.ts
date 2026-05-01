import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Valida que next é uma rota interna (path relativo) — bloqueia open redirect
function safeNext(raw: string | null): string {
  const fallback = '/dashboard'
  if (!raw) return fallback
  // Aceita só caminhos que começam com / e não com // ou /\ (browser trata como host)
  if (!raw.startsWith('/')) return fallback
  if (raw.startsWith('//')) return fallback
  if (raw.startsWith('/\\')) return fallback
  return raw
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Código inválido ou ausente — volta ao login com mensagem de erro
  return NextResponse.redirect(`${origin}/login?mensagem=link-expirado`)
}
