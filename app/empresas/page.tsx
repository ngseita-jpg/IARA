import type { Metadata } from 'next'
import { LandingEmpresas } from '@/components/landing-empresas'

export const metadata: Metadata = {
  title: 'Iara para Empresas — Conecte sua marca aos criadores certos',
  description: 'Crie campanhas, gerencie afiliações de produtos e encontre influenciadores alinhados ao seu nicho. A plataforma que une marcas e criadores brasileiros.',
  openGraph: {
    title: 'Iara para Empresas',
    description: 'Crie campanhas, gerencie afiliações e encontre criadores. Feito para marcas brasileiras.',
  },
}

export default function EmpresasPage() {
  return <LandingEmpresas />
}
