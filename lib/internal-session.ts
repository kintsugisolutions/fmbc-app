import { cookies } from 'next/headers'
import { isValidSessionCookie, COOKIE_NAME } from './internal-auth'

// ─────────────────────────────────────────────────────────────────────────────
// Session check for Server Actions and server components under /internal.
//
// WHY THIS EXISTS (security fix, 2026-08-17): middleware.ts gates /internal by
// pathname, but Next.js Server Actions are POST endpoints addressed by an
// action ID in the `Next-Action` header — they execute regardless of which
// route path the POST targets. A POST to `/` (public, unauthenticated)
// carrying a valid action ID would have run approveProduct and flipped
// products.is_available = true, bypassing the login screen entirely and
// breaking this system's one hard constraint (nothing publishes without a
// human clicking Approve).
//
// Next.js documentation is explicit that middleware must not be the sole
// authorization layer for Server Actions. Every mutating action under
// /internal calls requireInternalSession() as its first statement; the
// middleware gate stays as defence in depth, not as the control.
//
// This lives in its own module rather than in lib/internal-auth.ts because
// `next/headers` is not available in the Edge Runtime, and internal-auth.ts is
// imported by middleware.ts.
// ─────────────────────────────────────────────────────────────────────────────

export async function hasValidInternalSession(): Promise<boolean> {
  const token = cookies().get(COOKIE_NAME)?.value
  return isValidSessionCookie(token)
}

/**
 * Throws unless the caller presents a valid internal session cookie.
 * Call this at the top of every mutating Server Action under /internal.
 */
export async function requireInternalSession(): Promise<void> {
  if (!(await hasValidInternalSession())) {
    console.error('Blocked an unauthenticated call to an /internal server action')
    throw new Error('Unauthorized')
  }
}
