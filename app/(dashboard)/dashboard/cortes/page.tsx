import { CortesPage } from '@/components/cortes-page'
import { CortesEmBreve } from '@/components/cortes-em-breve'
import { isFeatureEnabled } from '@/lib/feature-flags'

export const dynamic = 'force-dynamic'

export default function CortesCriadorPage() {
  if (!isFeatureEnabled('CORTES_YT')) {
    return <CortesEmBreve modo="criador" />
  }
  return <CortesPage modo="criador" corAcento="#ec4899" tituloDestaque="#E2C068" planosLink="/#planos" />
}
