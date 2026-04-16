import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Iara — Assessoria com IA para Criadores',
  description: 'Plataforma de IA para criadores de conteúdo e marcas. Gere roteiros, estratégias e conteúdo com inteligência artificial.',
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
      </body>
    </html>
  )
}
