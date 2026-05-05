'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { X } from 'lucide-react'

const STORAGE_KEY = 'iara_cookie_consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const choice = localStorage.getItem(STORAGE_KEY)
    if (!choice) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  function reject() {
    localStorage.setItem(STORAGE_KEY, 'rejected')
    setVisible(false)
  }

  if (!visible) return null

  // Areas onde o banner NAO deve aparecer ate user aceitar — bloqueava CTAs
  // criticos (botao de cadastro, checkbox de termos, input de chat etc.).
  // Em rotas autenticadas (dashboard, conta, marca, admin), aparece NO TOPO
  // pra nao tampar nada do conteudo principal.
  const isAuthArea = pathname?.startsWith('/dashboard')
    || pathname?.startsWith('/conta')
    || pathname?.startsWith('/marca')
    || pathname?.startsWith('/admin')
    || pathname?.startsWith('/aceitar-termos')
    || pathname?.startsWith('/bem-vindo')

  // Em paginas publicas tambem usa formato compacto pra nao bloquear CTAs.
  return (
    <div
      className={`fixed left-0 right-0 z-40 px-3 ${
        isAuthArea
          ? 'top-0 pt-[calc(env(safe-area-inset-top,0px)+8px)] pb-2'
          : 'bottom-0 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2'
      }`}
    >
      <div className="max-w-3xl mx-auto bg-[#0d0d1a]/95 backdrop-blur border border-iara-900/40 rounded-xl px-3 py-2 shadow-xl shadow-black/40 flex items-center gap-2">
        <p className="flex-1 text-[11px] text-[#9b9bb5] leading-tight min-w-0">
          🍪 Usamos cookies essenciais ·{' '}
          <Link href="/privacidade" className="text-iara-400 hover:text-iara-300 underline">privacidade</Link>
          {' · '}
          <Link href="/termos" className="text-iara-400 hover:text-iara-300 underline">termos</Link>
        </p>
        <button
          onClick={accept}
          className="flex-shrink-0 px-2.5 py-1.5 rounded-md bg-iara-600 hover:bg-iara-500 text-white text-[11px] font-bold transition"
        >
          Aceitar
        </button>
        <button
          onClick={reject}
          aria-label="Recusar cookies opcionais"
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-[#6b6b8a] hover:text-[#9b9bb5]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
