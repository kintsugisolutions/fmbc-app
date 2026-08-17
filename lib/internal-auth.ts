// Auth for the /internal dashboard — a single shared passphrase (this is a
// two-person internal tool, not a multi-user system, so a full auth provider
// would be overkill). The passphrase itself is never stored in the cookie —
// only an HMAC token derived from it — so the cookie value alone is useless
// without INTERNAL_DASHBOARD_SECRET.
import { createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'fmbc_internal_session'
const SESSION_TOKEN_INPUT = 'fmbc-internal-dashboard-session-v1' // fixed string, not a secret itself

function expectedToken(): string | null {
  const secret = process.env.INTERNAL_DASHBOARD_SECRET
  if (!secret) return null
  return createHmac('sha256', secret).update(SESSION_TOKEN_INPUT).digest('hex')
}

export function checkPassphrase(input: string): boolean {
  const secret = process.env.INTERNAL_DASHBOARD_SECRET
  if (!secret) {
    console.error('INTERNAL_DASHBOARD_SECRET not configured — internal dashboard is locked out entirely')
    return false
  }
  const a = Buffer.from(input)
  const b = Buffer.from(secret)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function makeSessionCookieValue(): string | null {
  return expectedToken()
}

export function isValidSessionCookie(value: string | undefined | null): boolean {
  const expected = expectedToken()
  if (!expected || !value) return false
  const a = Buffer.from(value)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export { COOKIE_NAME }
