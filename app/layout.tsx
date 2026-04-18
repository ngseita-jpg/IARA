import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CookieConsent } from '@/components/cookie-consent'

export const metadata: Metadata = {
  title: {
    default: 'Iara Hub — Assessoria com IA para Criadores',
    template: '%s | Iara Hub',
  },
  description: 'Sua assessora de comunicação com IA. 11 módulos integrados: roteiros, carrosseis, thumbnails, Faísca Criativa, oratória, mídia kit e muito mais. Feito para criadores brasileiros.',
  keywords: ['criador de conteúdo', 'inteligência artificial', 'roteiro', 'carrossel', 'thumbnail', 'oratória', 'criadores', 'brasil', 'ideias de conteúdo', 'faísca criativa'],
  authors: [{ name: 'Iara Hub' }],
  creator: 'Iara Hub',
  metadataBase: new URL('https://iarahubapp.com.br'),
  openGraph: {
    type: 'website',
    url: 'https://iarahubapp.com.br',
    locale: 'pt_BR',
    siteName: 'Iara Hub',
    title: 'Iara Hub — Assessoria com IA para Criadores',
    description: 'Sua assessora de comunicação com IA. 11 módulos integrados para criadores brasileiros crescerem mais rápido.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Iara Hub — Assessoria com IA para Criadores' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Iara Hub — Assessoria com IA para Criadores',
    description: 'Sua assessora de comunicação com IA. 11 módulos integrados para criadores brasileiros crescerem mais rápido.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a14',
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
