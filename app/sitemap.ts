import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://iarahubapp.com.br'
  const now = new Date()

  return [
    { url: base,                    lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/empresas`,      lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/register`,      lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/login`,         lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/privacidade`,   lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/termos`,        lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
