import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/landing-page'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    if (user.user_metadata?.tipo_conta === 'marca') redirect('/marca/dashboard')
    redirect('/dashboard')
  }

  return <LandingPage />
}
