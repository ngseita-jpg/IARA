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
      <div className="min-h-screen app-bg relative">
        <div className="fixed inset-0 app-bg-grid opacity-[0.35] pointer-events-none z-0" />
        <Navbar userEmail="demo@iara.app" />
        <main className="relative z-10 md:ml-64 pt-16 md:pt-0 min-h-screen pb-24 md:pb-0">
          <div className="p-6 md:p-8 max-w-6xl content-enter">
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

  // Redireciona marcas para a área delas
  if (user.user_metadata?.tipo_conta === 'marca') {
    redirect('/marca/dashboard')
  }

  // Redireciona para onboarding se não completou
  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('onboarding_completo, nome_artistico')
    .eq('user_id', user.id)
    .single()

  if (!profile?.onboarding_completo) {
    // Perfil existe mas flag não foi marcada (usuário legado ou falha anterior)
    if (profile?.nome_artistico) {
      await supabase
        .from('creator_profiles')
        .update({ onboarding_completo: true })
        .eq('user_id', user.id)
    } else {
      redirect('/onboarding')
    }
  }

  return (
    <div className="min-h-screen app-bg relative">
      <div className="fixed inset-0 app-bg-grid opacity-[0.35] pointer-events-none z-0" />
      <Navbar userEmail={user.email} />
      <main className="relative z-10 md:ml-64 pt-16 md:pt-0 min-h-screen pb-24 md:pb-0">
        <div className="p-6 md:p-8 max-w-6xl content-enter">
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
