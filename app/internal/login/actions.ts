'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import {
  checkPassphrase,
  makeSessionCookieValue,
  COOKIE_NAME,
  SESSION_TTL_MS,
} from '@/lib/internal-auth'

// ─── Brute-force protection (security fix, 2026-08-17) ───────────────────────
// /internal/login is deliberately excluded from the middleware gate, so it is
// fully public — and behind it sits every searcher's phone number, every
// partner's WhatsApp number, and the Approve button that publishes to the
// catalog. Without a limit, an attacker can grind the shared passphrase at
// whatever rate Vercel allows.
//
// 5 attempts per IP per 15 minutes. Unlike the search route's limiter, this one
// FAILS CLOSED when Upstash isn't configured: a login endpoint with no
// brute-force protection is worse than a login endpoint that's temporarily
// unavailable, and the misconfiguration is something we want surfaced loudly
// rather than silently tolerated. (A transient Upstash *outage* — as opposed to
// missing config — is allowed through, so a Redis blip doesn't lock the
// operators out of their own dashboard.)
// ─────────────────────────────────────────────────────────────────────────────
let loginLimiter: Ratelimit | null = null
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  loginLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: false,
    prefix: 'fmbc:internal-login',
  })
}

export async function loginAction(formData: FormData) {
  const passphrase = String(formData.get('passphrase') ?? '')

  // Missing rate-limiter config → refuse to authenticate at all.
  if (!loginLimiter) {
    console.error(
      'Internal login blocked: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set, ' +
      'so brute-force protection is unavailable. Set them in Vercel to restore dashboard access.'
    )
    redirect('/internal/login?error=config')
  }

  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'

  let withinLimit = true
  try {
    const { success } = await loginLimiter.limit(ip)
    withinLimit = success
  } catch (e) {
    // Upstash unreachable (outage, not misconfiguration) — don't lock the
    // operators out over a transient dependency failure, but make it visible.
    console.error('Internal login rate limiter threw, allowing this attempt:', e)
  }

  if (!withinLimit) {
    console.warn(`Internal login rate-limited for ${ip}`)
    redirect('/internal/login?error=rate')
  }

  if (!(await checkPassphrase(passphrase))) {
    redirect('/internal/login?error=1')
  }

  const token = await makeSessionCookieValue(SESSION_TTL_MS)
  if (!token) {
    // INTERNAL_DASHBOARD_SECRET missing — fail closed rather than let anyone in.
    redirect('/internal/login?error=config')
  }

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // Mirrors the expiry that is *signed into* the token itself, so trimming
    // this cookie client-side doesn't extend the session — see lib/internal-auth.ts.
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  })

  redirect('/internal/dashboard')
}

export async function logoutAction() {
  cookies().delete(COOKIE_NAME)
  redirect('/internal/login')
}
