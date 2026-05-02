// Sentry client-side config — captura erros no browser do user.
// Ativa só se SENTRY_DSN estiver definido (opt-in).

import * as Sentry from '@sentry/nextjs'

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',

    // 10% das transações em prod (ajusta se ficar caro). 100% em preview/dev.
    tracesSampleRate: process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? 0.1 : 1.0,

    // Replay: grava DOM nos 10s antes do erro pra debug visual
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,  // não grava sessões aleatórias (caro + privacidade)

    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,        // privacidade — esconde textos por padrão
        blockAllMedia: true,
      }),
    ],

    // Ignora erros chatos que não são bug real
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection captured',
      // Erros de extensão de browser
      /^chrome-extension:/i,
      /^moz-extension:/i,
    ],

    beforeSend(event) {
      // Não envia erros de localhost em dev mesmo se DSN tá set
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return null
      }
      return event
    },
  })
}
