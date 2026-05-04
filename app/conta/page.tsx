import { ContaClient } from './conta-client'

// Server wrapper: forca a Vercel a nao pre-renderizar/cachear o HTML.
// Sem isso, X-Vercel-Cache: PRERENDER servia HTML antigo apos deploy
// e usuarios viam a versao desatualizada (sem fixes recentes).
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ContaPage() {
  return <ContaClient />
}
