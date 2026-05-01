/**
 * Helpers para renderizar markdown simples vindo da IA com `dangerouslySetInnerHTML`
 * sem expor XSS. Sempre escapa &<>" ANTES de aplicar transformações markdown.
 *
 * Use em qualquer lugar onde o texto tem origem em IA ou input de usuário e
 * precisa virar HTML formatado.
 */

const ESC: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ESC[ch] ?? ch)
}

/** Escapa HTML e converte **bold** em <strong>. Sem outras tags. */
export function sanitizeBold(text: string, strongClass = 'text-[#f1f1f8]'): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, `<strong class="${strongClass}">$1</strong>`)
}

/** Escape + bold + quebra de linha → <br>. */
export function sanitizeBoldBr(text: string, strongClass = 'text-[#f1f1f8]'): string {
  return sanitizeBold(text, strongClass).replace(/\n/g, '<br>')
}
