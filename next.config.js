/** @type {import('next').NextConfig} */

// ─── Security Headers ──────────────────────────────────────────────────────────
// NOTE: Content-Security-Policy is intentionally absent here.
// It is set dynamically per-request by middleware.ts with a per-request nonce,
// which allows 'unsafe-inline' to be removed from script-src entirely.
// All other headers below are static and safe to set at the config level.
// ──────────────────────────────────────────────────────────────────────────────

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
  // HSTS — tells browsers to always use HTTPS for the next 2 years.
  // Prevents SSL stripping attacks on first-time visitors on public WiFi.
  // includeSubDomains covers www. preload allows submission to the browser HSTS preload list.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
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
