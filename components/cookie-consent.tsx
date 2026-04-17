'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

const STORAGE_KEY = 'iara_cookie_consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-[#0d0d1a] border border-iara-900/50 rounded-2xl p-5 shadow-2xl shadow-black/50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#f1f1f8] mb-1">🍪 Cookies e privacidade</p>
          <p className="text-xs text-[#6b6b8a] leading-relaxed">
            Usamos cookies essenciais para autenticação e funcionamento da plataforma.
            Ao continuar, você concorda com nossa{' '}
            <Link href="/privacidade" className="text-iara-400 underline hover:text-iara-300">
              Política de Privacidade
            </Link>{' '}
            e com os{' '}
            <Link href="/termos" className="text-iara-400 underline hover:text-iara-300">
              Termos de Uso
            </Link>
            , em conformidade com a LGPD.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 rounded-lg bg-[#1a1a2e] border border-[#2a2a4a] text-[#9b9bb5] hover:text-[#f1f1f8] text-xs font-medium transition-all"
          >
            Apenas essenciais
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 rounded-lg bg-iara-600 hover:bg-iara-500 text-white text-xs font-medium transition-all"
          >
            Aceitar todos
          </button>
          <button onClick={reject} className="text-[#4a4a6a] hover:text-[#9b9bb5] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
