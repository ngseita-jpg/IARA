import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/onboarding/',
          '/auth/',
          '/marca/dashboard/',
          '/marca/onboarding/',
          '/conta',
          '/redefinir-senha',
          '/r/',
          '/preview',
          '/dev-office/',
        ],
      },
    ],
    sitemap: 'https://iarahubapp.com.br/sitemap.xml',
    host: 'https://iarahubapp.com.br',
  }
}
