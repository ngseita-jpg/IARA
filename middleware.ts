import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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

  // Captura código de afiliado via ?ref=CODIGO (válido por 30 dias)
  const refCode = request.nextUrl.searchParams.get('ref')
  if (refCode && /^[a-z0-9]{4,16}$/.test(refCode)) {
    const existingRef = request.cookies.get('iara_ref')?.value
    if (!existingRef) {
      supabaseResponse.cookies.set('iara_ref', refCode, {
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        sameSite: 'lax',
        path: '/',
      })
    }
  }

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

  // Bloqueio de termos pra NOVOS usuarios (pos 2026-05-04).
  // Usuarios atuais marcados como '2026-04-01' via SQL (schema_termos.sql)
  // passam livres pra sempre — sao confianca pre-launch. So bloqueia quem
  // tem termos_versao_aceita = NULL.
  if (
    user
    && !isPreviewMode
    && !isOpenRoute
    && !isAuthRoute
    && pathname !== '/aceitar-termos'
    && !pathname.startsWith('/api/perfil/aceitar-termos')
    && !pathname.startsWith('/api/auth')   // callback supabase
  ) {
    try {
      // Service-role client pra bypass de RLS na leitura do profile
      const admin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } },
      )
      const [{ data: cp }, { data: bp }] = await Promise.all([
        admin.from('creator_profiles').select('termos_versao_aceita').eq('user_id', user.id).maybeSingle(),
        admin.from('brand_profiles').select('termos_versao_aceita').eq('user_id', user.id).maybeSingle(),
      ])
      const aceitouAlgum = !!(cp?.termos_versao_aceita || bp?.termos_versao_aceita)
      if (!aceitouAlgum) {
        const url = request.nextUrl.clone()
        url.pathname = '/aceitar-termos'
        url.search = ''
        return NextResponse.redirect(url)
      }
    } catch {
      // Falha aberta: se algo der errado lendo o profile (DB caiu, etc.),
      // deixa passar — preferimos disponibilidade a bloquear injustamente.
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
