import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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
