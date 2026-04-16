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
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { label: 'Dashboard',   href: '/dashboard',             icon: LayoutDashboard },
  { label: 'Roteiros',    href: '/dashboard/roteiros',    icon: FileText },
  { label: 'Carrossel',   href: '/dashboard/carrossel',   icon: Layers },
  { label: 'Thumbnail',   href: '/dashboard/thumbnail',   icon: Image },
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
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0d0d1a] border-b border-iara-900/30 fixed top-0 left-0 right-0 z-40">
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

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-[#0a0a14]/95 backdrop-blur-sm pt-16">
          <nav className="flex flex-col gap-1 p-4">
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
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-[#9b9bb5] hover:bg-red-900/20 hover:text-red-400 mt-4"
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
