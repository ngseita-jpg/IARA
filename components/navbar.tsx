'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
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
  Smartphone,
  Lightbulb,
  History,
  Briefcase,
  Tag,
  HelpCircle,
  Gift,
  Megaphone,
  Scissors,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { UsoSidebar } from '@/components/uso-sidebar'
import { IaraLogo } from '@/components/iara-logo'

const navItems: { label: string; href: string; icon: React.ElementType; badge?: string }[] = [
  { label: 'Dashboard',       href: '/dashboard',              icon: LayoutDashboard },
  { label: 'Faísca Criativa', href: '/dashboard/temas',        icon: Lightbulb },
  { label: 'Roteiros',        href: '/dashboard/roteiros',     icon: FileText },
  { label: 'Carrossel',       href: '/dashboard/carrossel',    icon: Layers },
  { label: 'Thumbnail',       href: '/dashboard/thumbnail',    icon: Image },
  { label: 'Cortes YouTube',  href: '/dashboard/cortes',       icon: Scissors, badge: 'Novo' },
  { label: 'Banco de Fotos',  href: '/dashboard/fotos',        icon: Images },
  { label: 'Stories',         href: '/dashboard/stories',      icon: Smartphone },
  { label: 'Mídia Kit',       href: '/dashboard/midia-kit',    icon: BookOpen },
  { label: 'Métricas',        href: '/dashboard/metricas',     icon: TrendingUp },
  { label: 'Calendário',      href: '/dashboard/calendario',   icon: Calendar },
  { label: 'Metas',           href: '/dashboard/metas',        icon: Target },
  { label: 'Oratória',        href: '/dashboard/oratorio',     icon: Mic },
  { label: 'Persona IA',      href: '/dashboard/persona',      icon: User },
  { label: 'Oportunidades',   href: '/dashboard/vagas',        icon: Briefcase },
  { label: 'Afiliados',       href: '/dashboard/afiliados',    icon: Tag },
  { label: 'Indique e Ganhe', href: '/dashboard/indicacoes',   icon: Gift },
  { label: 'Histórico',       href: '/dashboard/historico',    icon: History },
]

import { ADMIN_EMAILS } from '@/lib/admin'

const ADMIN_NAV_ITEMS = [
  { label: 'Marketing Squad', href: '/dashboard/marketing',    icon: Megaphone, adminEmails: ADMIN_EMAILS },
]

export function Navbar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const check = () =>
      fetch('/api/conversas/nao-lidas').then(r => r.ok ? r.json() : { count: 0 }).then(d => setUnread(d.count ?? 0))
    check()
    const iv = setInterval(check, 30000)
    return () => clearInterval(iv)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = 'iara_auto_login=; path=/; max-age=0; samesite=lax'
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 h-screen border-r border-iara-900/30 px-4 py-6 fixed left-0 top-0 z-40 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0e0e1e 0%, #0a0a14 100%)' }}>
        {/* Top glow */}
        <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none sidebar-top-glow" />
        {/* Logo */}
        <Link href="/dashboard" className="px-2 mb-8 relative z-10 flex-shrink-0">
          <IaraLogo size="sm" layout="horizontal" />
        </Link>

        {/* Nav items — scrollável */}
        <nav className="flex-1 overflow-y-auto space-y-0.5 relative z-10 no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'active-nav-item bg-iara-600/15 text-iara-300 border border-iara-600/25 shadow-sm shadow-iara-900/40'
                    : 'text-[#9b9bb5] hover:bg-iara-900/25 hover:text-[#f1f1f8] hover:border hover:border-iara-900/20 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-iara-400' : 'text-[#5a5a7a] group-hover:text-[#9b9bb5]'}`} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md tracking-widest uppercase"
                    style={{ background: 'linear-gradient(135deg,#E2C068,#a855f7)', color: '#0a0a14' }}>
                    {item.badge}
                  </span>
                )}
                {item.href === '/dashboard/vagas' && unread > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-iara-500 text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
                {isActive && !item.badge && (item.href !== '/dashboard/vagas' || unread === 0) && (
                  <ChevronRight className="w-3 h-3 text-iara-500/70" />
                )}
              </Link>
            )
          })}

          {/* Itens admin-only (acesso restrito ao fundador) */}
          {ADMIN_NAV_ITEMS.filter(i => userEmail && i.adminEmails.includes(userEmail)).map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'active-nav-item bg-accent-purple/15 text-accent-purple border border-accent-purple/25 shadow-sm shadow-purple-900/40'
                    : 'text-[#9b9bb5] hover:bg-accent-purple/10 hover:text-accent-purple border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-accent-purple' : 'text-[#5a5a7a] group-hover:text-accent-purple'}`} />
                {item.label}
                <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-accent-purple/20 text-accent-purple tracking-widest">ADM</span>
              </Link>
            )
          })}
        </nav>

        {/* Usage tracker */}
        <div className="flex-shrink-0">
          <UsoSidebar />
        </div>

        {/* User + logout */}
        <div className="flex-shrink-0 border-t border-iara-900/30 pt-4 mt-4">
          {userEmail && (
            <p className="px-3 text-xs text-[#5a5a7a] truncate mb-2">{userEmail}</p>
          )}
          <Link
            href="/conta"
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-[#9b9bb5] hover:bg-iara-900/25 hover:text-[#f1f1f8] transition-all duration-200 group"
          >
            <User className="w-4 h-4 text-[#5a5a7a] group-hover:text-[#9b9bb5]" />
            Minha Conta
          </Link>
          <Link
            href="/ajuda"
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-[#9b9bb5] hover:bg-iara-900/25 hover:text-[#f1f1f8] transition-all duration-200 group"
          >
            <HelpCircle className="w-4 h-4 text-[#5a5a7a] group-hover:text-[#9b9bb5]" />
            Ajuda
          </Link>
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
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-iara-900/30 fixed top-0 left-0 right-0 z-40"
        style={{ background: 'rgba(10,10,20,0.96)', backdropFilter: 'blur(20px)', boxShadow: '0 1px 0 rgba(99,102,241,0.08)' }}>
        <Link href="/dashboard">
          <IaraLogo size="sm" layout="horizontal" />
        </Link>
        <div className="flex items-center gap-2">
          {/* Logout rápido */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#6b6b8a] border border-[#1a1a2e] hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/40 transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-[#9b9bb5] hover:bg-iara-900/30"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d1a]/95 backdrop-blur-sm border-t border-iara-900/30 px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around">
          {[
            { label: 'Início',     href: '/dashboard',           icon: LayoutDashboard },
            { label: 'Roteiros',   href: '/dashboard/roteiros',  icon: FileText },
            { label: 'Carrossel',  href: '/dashboard/carrossel', icon: Layers },
            { label: 'Stories',    href: '/dashboard/stories',   icon: Smartphone },
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
                  <div className={`flex flex-col items-center gap-1 py-3 transition-colors ${mobileOpen ? 'text-iara-400' : 'text-[#5a5a7a]'}`}>
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Mais</span>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`relative flex flex-col items-center gap-1 py-3 transition-colors ${
                      isActive ? 'text-iara-400' : 'text-[#5a5a7a]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-iara-500" />
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
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md tracking-widest uppercase"
                      style={{ background: 'linear-gradient(135deg,#E2C068,#a855f7)', color: '#0a0a14' }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
            {/* Itens admin no overlay mobile */}
            {ADMIN_NAV_ITEMS.filter(i => userEmail && i.adminEmails.includes(userEmail)).map(item => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
                      : 'text-[#9b9bb5] hover:bg-accent-purple/10 hover:text-accent-purple'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-accent-purple/20 text-accent-purple tracking-widest">ADM</span>
                </Link>
              )
            })}
            <div className="border-t border-[#1a1a2e] mt-2 pt-4 space-y-1">
              <Link
                href="/conta"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-[#9b9bb5] hover:bg-iara-900/30"
              >
                <User className="w-4 h-4" />
                Minha Conta
              </Link>
              <Link
                href="/ajuda"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-[#9b9bb5] hover:bg-iara-900/30"
              >
                <HelpCircle className="w-4 h-4" />
                Ajuda
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-[#9b9bb5] hover:bg-red-900/20 hover:text-red-400"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
