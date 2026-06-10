/** @type {import('next').NextConfig} */

// ─── Content Security Policy ──────────────────────────────────────────────────
// Restricts which scripts, styles, and connections the browser trusts.
// 'unsafe-inline' on script/style is required while Next.js inlines runtime code.
// Tighten to nonce-based CSP in v2 when you move to a custom server or Vercel edge middleware.
// connect-src is a strict allowlist: self + Supabase only. The n8n webhook is
// called server-side (never from the browser), so it does NOT belong here.
// 'unsafe-eval' is required by Next.js dev tooling only — never shipped to prod.
const isDev = process.env.NODE_ENV === 'development'

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",                                    // next/font self-hosts — no external font origins needed
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",                             // stronger than X-Frame-Options
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Prevents clickjacking — stops this page being embedded in iframes on other domains
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Stops browsers guessing content type (MIME sniffing protection)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Only send origin in Referer header, never full URL
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable camera, mic, geolocation — FMBC doesn't use any of these
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Content Security Policy — restricts resource loading to trusted sources
  { key: 'Content-Security-Policy', value: cspDirectives },
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
