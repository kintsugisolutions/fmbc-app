import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Cormorant_Garamond, IBM_Plex_Mono } from 'next/font/google'
import AgeGate from '@/components/AgeGate'
import BootLoader from '@/components/BootLoader'
import DepthField from '@/components/DepthField'
import SearchPin from '@/components/SearchPin'
import GateRevealSweep from '@/components/GateRevealSweep'
import IosInstallPrompt from '@/components/IosInstallPrompt'
import './globals.css'

// ── Display typeface — self-hosted via next/font (no external requests at runtime,
// CSP stays clean; Google Fonts is only contacted once at build time) ──
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

// ── Functional/mono layer — IBM Plex Mono. Replaces Courier New for the small,
// tracked-out uppercase labels used throughout; it has a larger x-height and far
// clearer letterforms at 9–12px, so the functional layer reads better while
// keeping the same monospace character. Self-hosted via next/font (CSP stays clean).
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal'],
  variable: '--font-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'Courier New', 'monospace'],
})

// ── Pre-paint gate decision ──────────────────────────────────────────────────
// Runs before anything renders: returning verified visitors skip the gate with zero
// flash; everyone else gets `data-gate-open`, which holds the hero entrance animations
// until the gate clears. Without JS, the server-rendered gate stays up (fail-closed).
// Verification is stored as a 30-day cookie (fmbc-age-verified=1) so returning
// visitors within 30 days skip the gate even after closing the browser/tab.
const gateScript = `(function(){try{if(document.cookie.split('; ').some(function(c){return c==='fmbc-age-verified=1'})){document.documentElement.setAttribute('data-fmbc-verified','1')}else{document.documentElement.setAttribute('data-gate-open','1')}}catch(e){document.documentElement.setAttribute('data-gate-open','1')}})()`

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
  // Nonce generated per-request by middleware.ts and forwarded via x-nonce header.
  // Applied to every dangerouslySetInnerHTML <script> so the nonce-based CSP
  // (no 'unsafe-inline') trusts only these specific inline scripts.
  // ⚠️  dangerouslySetInnerHTML below uses only hardcoded/static values.
  //     Never interpolate Supabase data, URL params, or user input here —
  //     doing so without sanitisation would create a stored XSS in the <head>.
  const nonce = headers().get('x-nonce') ?? ''

  return (
    <html lang="en" className={`${cormorant.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body>
        {/* Pre-paint gate decision — must be the first thing in the body.
            suppressHydrationWarning: the nonce is randomly regenerated per request
            by design (middleware.ts), so it will legitimately differ between the
            initial document and any dev-mode background re-fetch that re-invokes
            middleware — that mismatch is expected, not a bug, and doesn't affect
            this script (it already ran synchronously during HTML parse). */}
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: gateScript }} />

        {/* Brand splash on first load — fades to reveal the age gate (CSS auto-hide) */}
        <BootLoader />

        {/* Skip navigation — keyboard / screen reader users skip directly to search */}
        <a href="#search-anchor" className="sr-only">Skip to search</a>

        {/* Layered depth background — fixed, behind all content */}
        <DepthField />

        {/* Map pin that drops onto the bottle on search submit — fixed, decorative, home only */}
        <SearchPin />

        {/* Age gate renders on every page — blocks content until 25+ is confirmed */}
        <AgeGate />
        {/* One-shot gold sweep when the gate clears (listens for fmbc:verified) */}
        <GateRevealSweep />
        {children}

        {/* iOS Safari "Add to Home Screen" prompt — shows once, after age verification */}
        <IosInstallPrompt />

        {/* JSON-LD structured data — static object only, no user input */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  )
}
