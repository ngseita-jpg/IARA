import { ContaTermosClient } from './aceitar-termos-client'

// Forca a rota a nao ser cacheada — texto/versao podem mudar.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Aceitar Termos — Iara Hub',
  description: 'Confirme leitura e aceite dos Termos de Uso pra continuar usando a plataforma.',
}

export default function AceitarTermosPage() {
  return <ContaTermosClient />
}
