/**
 * Wrapper sobre sonner — todo o app importa daqui.
 * Garante estilo consistente com a paleta da Iara.
 *
 * Uso:
 *   import { toast } from '@/lib/toast'
 *   toast.success('Salvo!')
 *   toast.error('Falhou — tenta de novo')
 *   toast.info('5 carrosseis usados de 7')
 *   toast.loading('Gerando...') // retorna id pra dismissar
 */

import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (msg: string, opts?: { description?: string; duration?: number }) =>
    sonnerToast.success(msg, opts),

  error: (msg: string, opts?: { description?: string; duration?: number }) =>
    sonnerToast.error(msg, { duration: 5000, ...opts }),

  info: (msg: string, opts?: { description?: string; duration?: number }) =>
    sonnerToast.info(msg, opts),

  warning: (msg: string, opts?: { description?: string; duration?: number }) =>
    sonnerToast.warning(msg, opts),

  loading: (msg: string) => sonnerToast.loading(msg),

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),

  /** Promise-based toast: mostra loading, troca pra success/error automaticamente */
  promise: <T,>(
    promise: Promise<T>,
    msgs: { loading: string; success: string | ((data: T) => string); error: string | ((err: unknown) => string) },
  ) => sonnerToast.promise(promise, msgs),
}
