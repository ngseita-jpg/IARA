import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Modo preview de desenvolvimento — bypassa auth
  const isPreviewMode = request.cookies.get('iara_preview')?.value === '1'

  // Rotas sempre acessíveis (logado ou não) — sem redirect para nenhum lado
  const openRoutes = ['/', '/empresas', '/ajuda', '/privacidade', '/termos', '/r/', '/preview', '/api/preview-mode', '/api/ajuda', '/auth', '/redefinir-senha']
  const isOpenRoute = openRoutes.some((route) => pathname === route || pathname.startsWith(route))

  // Rotas de auth: redireciona usuário logado para dashboard
  const authRoutes = ['/login', '/register', '/esqueci-senha']
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Usuário não autenticado em rota protegida → login com aviso
  if (!user && !isOpenRoute && !isAuthRoute && !isPreviewMode) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('mensagem', 'acesso-restrito')
    return NextResponse.redirect(url)
  }

  // Usuário autenticado em rota de auth → dashboard
  if (user && isAuthRoute && !isPreviewMode) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
