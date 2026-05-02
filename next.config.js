const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@anthropic-ai/sdk'],
}

// Wrap com Sentry SÓ se DSN estiver configurado.
// Sem isso, build local não exige token do Sentry.
const sentryEnabled = !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)

module.exports = sentryEnabled
  ? withSentryConfig(nextConfig, {
      // Org/project só são necessários pra source maps upload em produção.
      // Se não tiver SENTRY_AUTH_TOKEN, source maps são pulados (sem erro).
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,

      silent: !process.env.CI,           // logs no CI, silencioso no dev
      widenClientFileUpload: true,
      tunnelRoute: '/monitoring',         // proxy pra evitar adblockers
      hideSourceMaps: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : nextConfig
