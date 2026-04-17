import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/onboarding/', '/auth/'],
      },
    ],
    sitemap: 'https://iarahubapp.com.br/sitemap.xml',
  }
}
