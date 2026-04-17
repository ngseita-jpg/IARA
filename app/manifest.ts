import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Iara — Assessoria com IA',
    short_name: 'Iara',
    description: 'Assessoria com IA para criadores de conteúdo brasileiros',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0a0a14',
    theme_color: '#6366f1',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
