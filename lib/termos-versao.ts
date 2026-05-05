/**
 * Versao atual dos Termos de Uso. Bumpar quando texto material mudar.
 * Sistema de aceite versionado (creator_profiles.termos_versao_aceita) usa
 * isso pra detectar quem precisa re-aceitar.
 *
 * Usuarios CRIADOS antes de 2026-05-04 nao precisam re-aceitar — sao de
 * confianca pre-versao. Migration SQL marca todos como '2026-04-01' (versao
 * legada implicita) automaticamente.
 */

export const TERMOS_VERSAO_ATUAL = '2026-05-04'
export const TERMOS_VERSAO_LEGADA = '2026-04-01'

/** True se o usuario precisa aceitar a versao atual dos termos */
export function precisaAceitarTermos(termosVersaoAceita: string | null | undefined): boolean {
  if (!termosVersaoAceita) return true
  return termosVersaoAceita !== TERMOS_VERSAO_ATUAL
}
