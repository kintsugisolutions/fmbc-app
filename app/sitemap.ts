import type { MetadataRoute } from 'next'

const BASE_URL = 'https://findmybottle.club'

// Popular SKU-specific landing pages — extend as Supabase products table grows
const SEO_PAGES = [
  'glenfiddich-12',
  'johnnie-walker-black',
  'chivas-regal-12',
  'royal-stag',
  'teachers',
  'jack-daniels',
  'absolut-vodka',
  'hendricks-gin',
  'roku-gin',
  'corona',
  'hoegaarden',
  'desperados',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date('2026-06-09'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date('2026-06-09'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  const seoRoutes: MetadataRoute.Sitemap = SEO_PAGES.flatMap(slug => [
    {
      url: `${BASE_URL}/ludhiana/buy/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/ludhiana/drink/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ])

  return [...staticRoutes, ...seoRoutes]
}
