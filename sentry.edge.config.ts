// Sentry edge-runtime — middleware + edge route handlers.

import * as Sentry from '@sentry/nextjs'

const DSN = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.VERCEL_ENV ?? 'development',
    tracesSampleRate: process.env.VERCEL_ENV === 'production' ? 0.1 : 1.0,
  })
}
