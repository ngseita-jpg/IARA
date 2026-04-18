import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MarcaNavbar } from '@/components/marca-navbar'
import Link from 'next/link'

export default async function MarcaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (user.user_metadata?.tipo_conta !== 'marca') redirect('/dashboard')

  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('onboarding_completo, nome_empresa')
    .eq('user_id', user.id)
    .single()

  if (!brand?.onboarding_completo) {
    redirect('/marca/onboarding')
  }

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      <MarcaNavbar nomeEmpresa={brand?.nome_empresa ?? undefined} />
      <main className="md:ml-64 pt-16 md:pt-0 min-h-screen pb-24 md:pb-0">
        <div className="p-6 md:p-8 max-w-6xl">
          {children}
        </div>
        <footer className="px-6 md:px-8 pb-6 flex gap-4 text-xs text-[#3a3a5a]">
          <Link href="/privacidade" className="hover:text-[#E2C068] transition-colors">Privacidade</Link>
          <Link href="/termos" className="hover:text-[#E2C068] transition-colors">Termos de Uso</Link>
          <span>© {new Date().getFullYear()} Iara Hub</span>
        </footer>
      </main>
    </div>
  )
}
