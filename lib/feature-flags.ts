/**
 * Feature flags do Iara Hub.
 *
 * Pra ativar uma feature: trocar pra `true` aqui (ou ler de env var no futuro).
 * O backend e o frontend leem daqui — fonte única de verdade.
 */

// Mapa de flags. Use boolean direto (não const literal) pra TypeScript não
// reclamar quando isFeatureEnabled comparar.
export const FEATURE_FLAGS: Record<string, boolean> = {
  /**
   * Cortes do YouTube — desativado em 2026-05-03.
   *
   * Por quê: pipeline depende de scraping do YouTube (youtube-transcript lib,
   * InnerTube, HTML scrape, Whisper sobre áudio baixado). Cada um falha em uma
   * fração crescente de vídeos por causa de bot detection (PoToken, SABR,
   * region-lock, age-gate). Resultado: experiência inconsistente — alguns
   * vídeos funcionam, outros não, e o user não tem como saber qual.
   *
   * Pra reativar de verdade:
   *  1. Contratar Supadata (https://supadata.ai, ~$10/mês unlimited) ou similar
   *  2. Adicionar SUPADATA_API_KEY como env var
   *  3. Modificar lib/youtube-transcricao.ts pra usar Supadata como fonte primária
   *     (mantendo os 5 fallbacks atuais como backup)
   *  4. Trocar essa flag pra true
   *
   * Custo estimado: ~$10-50/mês dependendo do volume.
   * Tempo de implementação: ~2-3h depois de ter a key.
   */
  CORTES_YT: false,
}

export function isFeatureEnabled(flag: string): boolean {
  return FEATURE_FLAGS[flag] === true
}
