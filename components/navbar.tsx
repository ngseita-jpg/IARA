'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles,
  FileText,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Menu,
  X,
  User,
  Mic,
  Target,
  Calendar,
  TrendingUp,
  Layers,
  BookOpen,
  Image,
  Images,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { label: 'Dashboard',   href: '/dashboard',             icon: LayoutDashboard },
  { label: 'Roteiros',    href: '/dashboard/roteiros',    icon: FileText },
  { label: 'Carrossel',   href: '/dashboard/carrossel',   icon: Layers },
  { label: 'Thumbnail',   href: '/dashboard/thumbnail',   icon: Image },
  { label: 'Banco de Fotos', href: '/dashboard/fotos',   icon: Images },
  { label: 'Stories',     href: '/dashboard/stories',     icon: Layers },
  { label: 'Mídia Kit',   href: '/dashboard/midia-kit',   icon: BookOpen },
  { label: 'Métricas',    href: '/dashboard/metricas',    icon: TrendingUp },
  { label: 'Calendário',  href: '/dashboard/calendario',  icon: Calendar },
  { label: 'Metas',       href: '/dashboard/metas',       icon: Target },
  { label: 'Oratória',    href: '/dashboard/oratorio',    icon: Mic },
  { label: 'Meu Perfil',  href: '/dashboard/perfil',      icon: User },
]

export function Navbar({ userEmail }: { userEmail?: string }) {
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
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2 mb-8 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center shadow-lg shadow-iara-900/50">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold iara-gradient-text">Iara</span>
        </Link>

        {/* Nav items */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
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
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t border-iara-900/30 pt-4 mt-4">
          {userEmail && (
            <p className="px-3 text-xs text-[#5a5a7a] truncate mb-3">{userEmail}</p>
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
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-lg font-bold iara-gradient-text">Iara</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-[#9b9bb5] hover:bg-iara-900/30"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d1a]/95 backdrop-blur-sm border-t border-iara-900/30 px-2 pb-safe">
        <div className="flex items-center justify-around">
          {[
            { label: 'Início',     href: '/dashboard',           icon: LayoutDashboard },
            { label: 'Roteiros',   href: '/dashboard/roteiros',  icon: FileText },
            { label: 'Carrossel',  href: '/dashboard/carrossel', icon: Layers },
            { label: 'Stories',    href: '/dashboard/stories',   icon: Sparkles },
            { label: 'Mais',       href: '#mais',                icon: Menu },
          ].map((item) => {
            const isActive = item.href !== '#mais' && (pathname === item.href || pathname.startsWith(item.href + '/'))
            const isMais = item.href === '#mais'
            const Icon = item.icon
            return (
              <button
                key={item.href}
                onClick={() => isMais ? setMobileOpen(v => !v) : undefined}
                className="flex-1"
              >
                {isMais ? (
                  <div className={`flex flex-col items-center gap-1 py-3 ${mobileOpen ? 'text-iara-400' : 'text-[#5a5a7a]'}`}>
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Mais</span>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex flex-col items-center gap-1 py-3 transition-colors ${
                      isActive ? 'text-iara-400' : 'text-[#5a5a7a]'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute w-8 h-0.5 rounded-full bg-iara-500" style={{ marginTop: -12 }} />
                    )}
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Mobile menu overlay (Mais) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-[#0a0a14]/95 backdrop-blur-sm pt-16 pb-20" onClick={() => setMobileOpen(false)}>
          <nav className="flex flex-col gap-1 p-4" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-[#5a5a7a] font-semibold uppercase tracking-wider px-4 mb-2">Todos os módulos</p>
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
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
