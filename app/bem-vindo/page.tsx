import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { BemVindoClient } from './bem-vindo-client'

export const dynamic = 'force-dynamic'

type PlanoPago = 'plus' | 'premium' | 'profissional'

const PLANOS_VALIDOS: PlanoPago[] = ['plus', 'premium', 'profissional']

export default async function BemVindoPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string }>
}) {
  const { plano: planoQuery } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: perfil } = await admin
    .from('creator_profiles')
    .select('plano, nome_artistico, full_name, nicho, plataformas, tom_de_voz, objetivo')
    .eq('user_id', user.id)
    .maybeSingle()

  const plano = (perfil?.plano ?? planoQuery ?? 'free') as string
  if (!PLANOS_VALIDOS.includes(plano as PlanoPago)) {
    redirect('/dashboard')
  }

  const nicho = (perfil?.nicho ?? '').toString().trim()
  const plataformas = perfil?.plataformas
  const tomDeVoz = perfil?.tom_de_voz
  const plataformasOk = Array.isArray(plataformas) ? plataformas.length > 0 : !!plataformas
  const tomOk = !!tomDeVoz && tomDeVoz !== '[]'
  const personaCompleta = nicho.length > 0 && plataformasOk && tomOk

  const nome = perfil?.nome_artistico || perfil?.full_name?.split(' ')[0] || 'Criador'

  return (
    <BemVindoClient
      plano={plano as PlanoPago}
      nome={nome}
      personaCompleta={personaCompleta}
    />
  )
}
