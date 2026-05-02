// Next.js instrumentation hook — roda 1× no startup do server.
// Carrega Sentry config conforme runtime (node ou edge).
// Sem DSN setado, configs são no-op.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Hook pra capturar erros de Server Components (Next.js 15+)
import type { Instrumentation } from 'next'

export const onRequestError: Instrumentation.onRequestError = async (
  err, request, context,
) => {
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureRequestError(err, request, context)
}
