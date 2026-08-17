import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isValidSessionCookie, COOKIE_NAME } from '@/lib/internal-auth'

// ─── Nonce-based Content Security Policy ──────────────────────────────────────
// Generates a cryptographically random nonce per request and injects it into:
//   1. The CSP response header (script-src 'nonce-<value>')
//   2. The x-nonce request header (forwarded to app/layout.tsx via next/headers)
//
// This replaces the static `'unsafe-inline'` in script-src, which previously
// allowed ANY inline script to execute. With a nonce, only scripts that carry the
// matching nonce attribute are trusted — injected scripts from XSS cannot know it.
//
// 'unsafe-eval' is kept in development only (Next.js HMR requires it).
// 'unsafe-inline' is retained for style-src only — Next.js injects too many inline
// styles to remove it without a dedicated style nonce pass (future work).
// ─────────────────────────────────────────────────────────────────────────────

// ─── /internal auth gate ────────────────────────────────────────────────────
// Everything under /internal (the private usage/traffic dashboard + review
// queue) requires a valid session cookie, set only after the passphrase form
// at /internal/login succeeds. Added 2026-08-17 — see app/internal/.
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/internal') && pathname !== '/internal/login') {
    const session = request.cookies.get(COOKIE_NAME)?.value
    if (!(await isValidSessionCookie(session))) {
      const loginUrl = new URL('/internal/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  // Forward nonce to layout.tsx via a request header.
  // app/layout.tsx reads this with headers().get('x-nonce') and applies it to
  // every dangerouslySetInnerHTML <script> block.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Set the dynamic CSP — overrides any static CSP from next.config.js
  response.headers.set('Content-Security-Policy', csp)

  return response
}

// Run on all routes except static files and Next.js internals
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|json)).*)',
  ],
}
