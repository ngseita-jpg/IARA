import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CookieConsent } from '@/components/cookie-consent'

export const metadata: Metadata = {
  title: 'Iara — Assessoria com IA para Criadores',
  description: 'Plataforma de IA para criadores de conteúdo e marcas. Gere roteiros, estratégias e conteúdo com inteligência artificial.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-[#0a0a14] text-[#f1f1f8] antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
