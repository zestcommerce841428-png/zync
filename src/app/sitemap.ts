import type { MetadataRoute } from 'next'
import { getAllPostMeta } from '../blog'
import { brand } from '../brand'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = brand.url.replace(/\/$/, '')

  const staticRoutes = [
    '',
    '/send',
    '/blog',
    '/about',
    '/contact',
    '/stats',
    '/privacy',
    '/terms',
    '/cookies',
    '/acceptable-use',
    '/dmca',
    '/login',
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1 : 0.7,
  }))

  const posts = getAllPostMeta().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...posts]
}
