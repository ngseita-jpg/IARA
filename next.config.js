/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@anthropic-ai/sdk'],
  outputFileTracingIncludes: {
    '/api/carrossel/renderizar': ['./public/inter-bold.ttf'],
  },
}

module.exports = nextConfig
