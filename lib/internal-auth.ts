// Auth for the /internal dashboard — a single shared passphrase (this is a
// two-person internal tool, not a multi-user system, so a full auth provider
// would be overkill). The passphrase itself is never stored in the cookie —
// only an HMAC token derived from it — so the cookie value alone is useless
// without INTERNAL_DASHBOARD_SECRET.
//
// Uses the Web Crypto API (globalThis.crypto.subtle) rather than Node's
// `crypto` module: this file is imported by middleware.ts, which runs on
// Vercel's Edge Runtime — Edge does not support Node built-ins like
// `node:crypto`, only Web Crypto. Web Crypto is available in both the Edge
// Runtime and modern Node.js, so the same code works in middleware.ts and in
// the Node-runtime server action (app/internal/login/actions.ts).

const COOKIE_NAME = 'fmbc_internal_session'
const SESSION_TOKEN_INPUT = 'fmbc-internal-dashboard-session-v1' // fixed string, not a secret itself

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Constant-time string comparison (Web Crypto has no timingSafeEqual helper).
// Always walks the full length of the longer string so comparison time doesn't
// leak how many leading characters matched.
function timingSafeEqualStr(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length)
  let diff = a.length === b.length ? 0 : 1
  for (let i = 0; i < len; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0
    const cb = i < b.length ? b.charCodeAt(i) : 0
    diff |= ca ^ cb
  }
  return diff === 0
}

async function expectedToken(): Promise<string | null> {
  const secret = process.env.INTERNAL_DASHBOARD_SECRET
  if (!secret) return null
  return hmacHex(secret, SESSION_TOKEN_INPUT)
}

export async function checkPassphrase(input: string): Promise<boolean> {
  const secret = process.env.INTERNAL_DASHBOARD_SECRET
  if (!secret) {
    console.error('INTERNAL_DASHBOARD_SECRET not configured — internal dashboard is locked out entirely')
    return false
  }
  return timingSafeEqualStr(input, secret)
}

export async function makeSessionCookieValue(): Promise<string | null> {
  return expectedToken()
}

export async function isValidSessionCookie(value: string | undefined | null): Promise<boolean> {
  if (!value) return false
  const expected = await expectedToken()
  if (!expected) return false
  return timingSafeEqualStr(value, expected)
}

export { COOKIE_NAME }
