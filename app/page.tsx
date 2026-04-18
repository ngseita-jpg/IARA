import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/landing-page'

export default async function Home() {
  const cookieStore = await cookies()
  const isPreview = cookieStore.get('iara_preview')?.value === '1'

  if (!isPreview) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      if (user.user_metadata?.tipo_conta === 'marca') redirect('/marca/dashboard')
      redirect('/dashboard')
    }
  }

  return <LandingPage />
}
