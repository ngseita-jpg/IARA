/**
 * Fonte única de verdade para emails com privilégio admin no Iara Hub.
 * Inclui: acesso à área /dashboard/marketing (Squad de 7 agentes),
 * painel de pagamentos de indicações, gerenciamento de cupons,
 * destinatário de emails transacionais/SAC.
 */

export const ADMIN_EMAILS = [
  'ngseita@gmail.com',       // fundador
]

/** Email padrão para notificações transacionais do site (SAC, tickets, alertas) */
export const EMAIL_NOTIFICACOES = 'ngseita@gmail.com'

export function isAdmin(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}
