import type { MetadataRoute } from 'next'
import { brand } from '../brand'

export default function robots(): MetadataRoute.Robots {
  const base = brand.url.replace(/\/$/, '')
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/account', '/api/', '/download/'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
