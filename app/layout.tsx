import type { Metadata, Viewport } from 'next'
import AgeGate from '@/components/AgeGate'
import './globals.css'

// ── SEO & Social Metadata ────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Find My Bottle Club — Ludhiana',
  description: 'Search for a specific bottle. We check availability across verified stores in Ludhiana and WhatsApp you when it is confirmed.',
  keywords: 'buy whisky ludhiana, find scotch ludhiana, where to buy whisky ludhiana, bottle finder ludhiana',
  openGraph: {
    title: 'Find My Bottle Club — Ludhiana',
    description: 'Search for a specific bottle. We check availability across verified stores in Ludhiana and WhatsApp you when confirmed.',
    url: 'https://findmybottle.club',
    siteName: 'Find My Bottle Club',
    images: [
      {
        url: 'https://findmybottle.club/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Find My Bottle Club — Ludhiana bottle availability search',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find My Bottle Club — Ludhiana',
    description: 'Search for a specific bottle. We check availability and WhatsApp you when confirmed.',
    images: ['https://findmybottle.club/og-image.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Find My Bottle Club',
  },
}

// ── Viewport / Theme ─────────────────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor: '#1D1F23',
  width: 'device-width',
  initialScale: 1,
}

// ── JSON-LD Structured Data ──────────────────────────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Find My Bottle Club',
  alternateName: 'FMBC',
  description: 'Alcohol availability discovery service for Ludhiana, Punjab. Search for a specific bottle and receive WhatsApp availability notifications from verified stores.',
  url: 'https://findmybottle.club',
  areaServed: {
    '@type': 'City',
    name: 'Ludhiana',
    addressRegion: 'Punjab',
    addressCountry: 'IN',
  },
  provider: {
    '@type': 'Organization',
    name: 'Find My Bottle Club',
    url: 'https://findmybottle.club',
    sameAs: ['https://www.instagram.com/findmybottleclub'],
  },
  serviceType: 'Alcohol Availability Information',
  audience: {
    '@type': 'Audience',
    audienceType: 'Adults aged 25 and above in Ludhiana, Punjab',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Skip navigation — keyboard / screen reader users skip directly to search */}
        <a href="#search-anchor" className="sr-only">Skip to search</a>

        {/* Age gate renders on every page — blocks content until 25+ is confirmed */}
        <AgeGate />
        {children}

        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  )
}
