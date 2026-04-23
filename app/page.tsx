import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/landing-page'

export default async function Home() {
  const cookieStore = await cookies()
  const isPreview = cookieStore.get('iara_preview')?.value === '1'
  const autoLogin = cookieStore.get('iara_auto_login')?.value === '1'

  // Detecta sessão ativa (sem redirecionar) pra passar pra landing
  // Assim o usuário logado vê botão "Ir para dashboard" em vez de "Entrar"
  let tipoConta: 'criador' | 'marca' | null = null
  if (!isPreview) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      tipoConta = user.user_metadata?.tipo_conta === 'marca' ? 'marca' : 'criador'
      // Só redireciona se optou explicitamente por auto-login
      if (autoLogin) {
        if (tipoConta === 'marca') redirect('/marca/dashboard')
        redirect('/dashboard')
      }
    }
  }

  return <LandingPage tipoConta={tipoConta} />
}
