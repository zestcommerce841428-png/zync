import type { MetadataRoute } from 'next'
import { brand } from '../brand'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.name,
    description: brand.shortDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#0b1120',
    theme_color: brand.themeColor,
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
}
