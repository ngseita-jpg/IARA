import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getNicho, NICHOS_PRO } from '@/lib/nichos-pro'
import { LandingPro } from '@/components/landing-pro'

type Props = { params: Promise<{ nicho: string }> }

// Pré-renderiza todas as profissões (SEO + perf)
export async function generateStaticParams() {
  return NICHOS_PRO.map(n => ({ nicho: n.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nicho: slug } = await params
  const nicho = getNicho(slug)
  if (!nicho) return { title: 'Página não encontrada' }

  const url = `https://iarahubapp.com.br/p/${nicho.slug}`
  return {
    title: nicho.seo.title,
    description: nicho.seo.description,
    alternates: { canonical: url },
    openGraph: {
      title: nicho.seo.title,
      description: nicho.seo.description,
      url,
      siteName: 'Iara Hub',
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: nicho.seo.title,
      description: nicho.seo.description,
    },
  }
}

export default async function NichoPage({ params }: Props) {
  const { nicho: slug } = await params
  const nicho = getNicho(slug)
  if (!nicho) notFound()
  return <LandingPro nicho={nicho} />
}
