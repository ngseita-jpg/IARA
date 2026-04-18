'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles, LayoutDashboard, LogOut, ChevronRight,
  Menu, X, Users, Building2, Briefcase,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { label: 'Painel',           href: '/marca/dashboard',           icon: LayoutDashboard },
  { label: 'Buscar Criadores', href: '/marca/dashboard/criadores', icon: Users },
  { label: 'Minha Empresa',    href: '/marca/dashboard/perfil',    icon: Building2 },
  { label: 'Vagas',            href: '/marca/dashboard/vagas',     icon: Briefcase, soon: true },
]

export function MarcaNavbar({ nomeEmpresa }: { nomeEmpresa?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-[#0d0d1a] border-r border-iara-900/30 px-4 py-6 fixed left-0 top-0 z-40">
        {/* Logo */}
        <Link href="/marca/dashboard" className="flex items-center gap-2.5 px-2 mb-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center shadow-lg shadow-iara-900/50">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold iara-gradient-text">Iara</span>
        </Link>

        {/* Badge marca */}
        <div className="px-2 mb-8">
          <span className="text-[10px] font-semibold text-accent-purple uppercase tracking-widest">
            Área da Marca
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <div key={item.href} className="relative">
                {item.soon ? (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#3a3a5a] cursor-not-allowed">
                    <Icon className="w-4 h-4 text-[#2a2a4a]" />
                    {item.label}
                    <span className="ml-auto text-[9px] font-bold text-accent-purple/50 uppercase tracking-wider">Em breve</span>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-iara-600/20 text-iara-300 border border-iara-600/30'
                        : 'text-[#9b9bb5] hover:bg-iara-900/30 hover:text-[#f1f1f8]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-iara-400' : 'text-[#5a5a7a] group-hover:text-[#9b9bb5]'}`} />
                    {item.label}
                    {isActive && <ChevronRight className="w-3 h-3 ml-auto text-iara-500" />}
                  </Link>
                )}
              </div>
            )
          })}
        </nav>

        {/* Empresa + logout */}
        <div className="border-t border-iara-900/30 pt-4 mt-4">
          {nomeEmpresa && (
            <p className="px-3 text-xs text-[#5a5a7a] truncate mb-3">{nomeEmpresa}</p>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-[#9b9bb5] hover:bg-red-900/20 hover:text-red-400 transition-all duration-200 group"
          >
            <LogOut className="w-4 h-4 group-hover:text-red-400" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0d0d1a]/95 backdrop-blur-sm border-b border-iara-900/30 fixed top-0 left-0 right-0 z-40">
        <Link href="/marca/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-lg font-bold iara-gradient-text">Iara</span>
          <span className="text-[10px] text-accent-purple/70 font-semibold uppercase ml-1">Marca</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-[#9b9bb5] hover:bg-iara-900/30"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d1a]/95 backdrop-blur-sm border-t border-iara-900/30 px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around">
          {[
            { label: 'Painel',    href: '/marca/dashboard',           icon: LayoutDashboard },
            { label: 'Criadores', href: '/marca/dashboard/criadores', icon: Users },
            { label: 'Empresa',   href: '/marca/dashboard/perfil',    icon: Building2 },
          ].map((item) => {
            const isActive = pathname === item.href || (item.href !== '/marca/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  isActive ? 'text-iara-400' : 'text-[#5a5a7a]'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-iara-500" />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-[#0a0a14]/95 backdrop-blur-sm pt-16 pb-20" onClick={() => setMobileOpen(false)}>
          <nav className="flex flex-col gap-1 p-4" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-[#5a5a7a] font-semibold uppercase tracking-wider px-4 mb-2">Menu da marca</p>
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <div key={item.href}>
                  {item.soon ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[#3a3a5a]">
                      <Icon className="w-4 h-4" />
                      {item.label}
                      <span className="ml-auto text-[9px] text-accent-purple/50 font-semibold uppercase">Em breve</span>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-iara-600/20 text-iara-300 border border-iara-600/30'
                          : 'text-[#9b9bb5] hover:bg-iara-900/30'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  )}
                </div>
              )
            })}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-[#9b9bb5] hover:bg-red-900/20 hover:text-red-400 mt-2 border-t border-[#1a1a2e] pt-4"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </nav>
        </div>
      )}
    </>
  )
}
