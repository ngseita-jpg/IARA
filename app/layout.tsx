import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CookieConsent } from '@/components/cookie-consent'

export const metadata: Metadata = {
  title: {
    default: 'Iara — Assessoria com IA para Criadores',
    template: '%s | Iara',
  },
  description: 'Sua assessora de comunicação com IA. 10 módulos integrados: roteiros, carrosseis, thumbnails, oratória, mídia kit e muito mais. Feito para criadores brasileiros.',
  keywords: ['criador de conteúdo', 'inteligência artificial', 'roteiro', 'carrossel', 'thumbnail', 'oratória', 'criadores', 'brasil'],
  authors: [{ name: 'Iara' }],
  creator: 'Iara',
  metadataBase: new URL('https://iarahubapp.com.br'),
  openGraph: {
    type: 'website',
    url: 'https://iarahubapp.com.br',
    locale: 'pt_BR',
    siteName: 'Iara',
    title: 'Iara — Assessoria com IA para Criadores',
    description: 'Sua assessora de comunicação com IA. 10 módulos integrados para criadores brasileiros crescerem mais rápido.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Iara — Assessoria com IA para Criadores' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Iara — Assessoria com IA para Criadores',
    description: 'Sua assessora de comunicação com IA. 10 módulos integrados para criadores brasileiros crescerem mais rápido.',
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
