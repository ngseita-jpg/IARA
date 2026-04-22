import { Metadata } from 'next'
import { AjudaClient } from './ajuda-client'

export const metadata: Metadata = {
  title: 'Central de Ajuda',
  description: 'Tire suas dúvidas sobre o Iara Hub. FAQ, chat com a Iara ou abra um ticket com nossa equipe.',
}

export default function AjudaPage() {
  return <AjudaClient />
}
