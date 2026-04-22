import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CookieConsent } from '@/components/cookie-consent'

export const metadata: Metadata = {
  title: {
    default: 'Iara Hub — Assessoria com IA para vender mais nas redes',
    template: '%s | Iara Hub',
  },
  description: 'Sua assessora digital com IA. Conteúdo é a melhor forma de vender seu trabalho — a Iara cria roteiros, carrosseis, thumbnails e mídia kit na sua voz. Para profissionais e criadores que querem escalar no digital.',
  keywords: [
    'assessoria com ia', 'marketing de conteúdo', 'criar conteúdo para instagram',
    'conteúdo para profissionais', 'como vender mais nas redes sociais', 'presença digital',
    'ia para criar conteúdo', 'roteiro de vídeo', 'carrossel para instagram', 'thumbnail',
    'oratória', 'mídia kit', 'criador de conteúdo', 'dentista instagram', 'advogado instagram',
    'nutricionista instagram', 'coach conteúdo', 'marketing pessoal', 'marca pessoal',
    'inteligência artificial', 'saas brasileiro', 'iara hub', 'faísca criativa',
  ],
  authors: [{ name: 'Iara Hub' }],
  creator: 'Iara Hub',
  publisher: 'Iara Hub',
  metadataBase: new URL('https://iarahubapp.com.br'),
  alternates: {
    canonical: 'https://iarahubapp.com.br',
  },
  openGraph: {
    type: 'website',
    url: 'https://iarahubapp.com.br',
    locale: 'pt_BR',
    siteName: 'Iara Hub',
    title: 'Iara Hub — Assessoria com IA para vender mais nas redes',
    description: 'Conteúdo é a melhor forma de vender seu trabalho. A Iara cria roteiros, carrosseis e thumbnails na sua voz — para profissionais e criadores escalarem no digital.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Iara Hub — Assessoria com IA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Iara Hub — Assessoria com IA para vender mais nas redes',
    description: 'Conteúdo é a melhor forma de vender seu trabalho. A Iara cria na sua voz — roteiros, carrosseis, thumbnails e mais.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  category: 'technology',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a14',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://iarahubapp.com.br/#organization',
      name: 'Iara Hub',
      url: 'https://iarahubapp.com.br',
      logo: 'https://iarahubapp.com.br/opengraph-image',
      description: 'Assessoria de comunicação com IA para profissionais e criadores brasileiros.',
      areaServed: 'BR',
      foundingDate: '2025',
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://iarahubapp.com.br/#website',
      url: 'https://iarahubapp.com.br',
      name: 'Iara Hub',
      inLanguage: 'pt-BR',
      publisher: { '@id': 'https://iarahubapp.com.br/#organization' },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Iara Hub',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://iarahubapp.com.br',
      description: 'Plataforma SaaS de assessoria com IA: gera roteiros, carrosseis, thumbnails, stories, mídia kit e analisa oratória na voz do criador ou profissional.',
      offers: [
        { '@type': 'Offer', name: 'Free',         price: '0',      priceCurrency: 'BRL' },
        { '@type': 'Offer', name: 'Plus',         price: '49.90',  priceCurrency: 'BRL' },
        { '@type': 'Offer', name: 'Premium',      price: '89.00',  priceCurrency: 'BRL' },
        { '@type': 'Offer', name: 'Profissional', price: '179.90', priceCurrency: 'BRL' },
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#0a0a14] text-[#f1f1f8] antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
