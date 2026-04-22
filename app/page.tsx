import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/landing-page'

export default async function Home() {
  const cookieStore = await cookies()
  const isPreview = cookieStore.get('iara_preview')?.value === '1'
  const autoLogin = cookieStore.get('iara_auto_login')?.value === '1'

  // Só redireciona para dashboard se o usuário explicitamente optou por isso no login
  if (!isPreview && autoLogin) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      if (user.user_metadata?.tipo_conta === 'marca') redirect('/marca/dashboard')
      redirect('/dashboard')
    }
  }

  return <LandingPage />
}
