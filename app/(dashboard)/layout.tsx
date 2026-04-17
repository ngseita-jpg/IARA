import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Modo preview — bypassa auth para visualização local
  const cookieStore = await cookies()
  const isPreview = cookieStore.get('iara_preview')?.value === '1'

  if (isPreview) {
    return (
      <div className="min-h-screen bg-[#0a0a14]">
        <Navbar userEmail="demo@iara.app" />
        <main className="md:ml-64 pt-16 md:pt-0 min-h-screen pb-20 md:pb-0">
          <div className="p-6 md:p-8 max-w-6xl">
            {children}
          </div>
          <footer className="px-6 md:px-8 pb-6 flex gap-4 text-xs text-[#3a3a5a]">
            <Link href="/privacidade" className="hover:text-iara-400 transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-iara-400 transition-colors">Termos de Uso</Link>
            <span>© {new Date().getFullYear()} Iara</span>
          </footer>
        </main>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Redireciona para onboarding se não completou
  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('onboarding_completo')
    .eq('user_id', user.id)
    .single()

  if (!profile?.onboarding_completo) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      <Navbar userEmail={user.email} />
      <main className="md:ml-64 pt-16 md:pt-0 min-h-screen">
        <div className="p-6 md:p-8 max-w-6xl">
          {children}
        </div>
        <footer className="px-6 md:px-8 pb-6 flex gap-4 text-xs text-[#3a3a5a]">
          <Link href="/privacidade" className="hover:text-iara-400 transition-colors">Privacidade</Link>
          <Link href="/termos" className="hover:text-iara-400 transition-colors">Termos de Uso</Link>
          <span>© {new Date().getFullYear()} Iara</span>
        </footer>
      </main>
    </div>
  )
}
