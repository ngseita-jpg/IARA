import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Iara Hub — Assessoria com IA',
    short_name: 'Iara Hub',
    description: 'Assessoria com IA para criadores de conteúdo e marcas brasileiras. Gere roteiros, carrosseis, thumbnails e stories em segundos.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#08080f',
    theme_color: '#6366f1',
    orientation: 'portrait',
    lang: 'pt-BR',
    dir: 'ltr',
    categories: ['productivity', 'business', 'social'],

    icons: [
      { src: '/icon',                       sizes: '32x32',   type: 'image/png' },
      { src: '/apple-icon',                 sizes: '180x180', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon',                 sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],

    // Atalhos rápidos no long-press do ícone (Android) e force-touch (iOS)
    shortcuts: [
      {
        name: 'Gerar Carrossel',
        short_name: 'Carrossel',
        description: 'Cria carrossel pro Instagram em segundos',
        url: '/dashboard/carrossel',
        icons: [{ src: '/icon', sizes: '32x32' }],
      },
      {
        name: 'Gerar Roteiro',
        short_name: 'Roteiro',
        description: 'Roteiro pra Reel/Shorts/Vídeo longo',
        url: '/dashboard/roteiros',
        icons: [{ src: '/icon', sizes: '32x32' }],
      },
      {
        name: 'Gerar Thumbnail',
        short_name: 'Thumbnail',
        description: 'Thumbnail de alto CTR pro YouTube',
        url: '/dashboard/thumbnail',
        icons: [{ src: '/icon', sizes: '32x32' }],
      },
      {
        name: 'Cortes pro YouTube',
        short_name: 'Cortes',
        description: 'Vira vídeo longo em vários cortes',
        url: '/dashboard/cortes',
        icons: [{ src: '/icon', sizes: '32x32' }],
      },
    ],

    prefer_related_applications: false,
  }
}
