import { CortesPage } from '@/components/cortes-page'
import { CortesEmBreve } from '@/components/cortes-em-breve'
import { isFeatureEnabled } from '@/lib/feature-flags'

export const dynamic = 'force-dynamic'

export default function CortesMarcaPage() {
  if (!isFeatureEnabled('CORTES_YT')) {
    return <CortesEmBreve modo="marca" />
  }
  return <CortesPage modo="marca" corAcento="#a855f7" tituloDestaque="#E2C068" planosLink="/empresas#planos" />
}
