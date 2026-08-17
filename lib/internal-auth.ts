// Auth for the /internal dashboard — a single shared passphrase (this is a
// two-person internal tool, not a multi-user system, so a full auth provider
// would be overkill). The passphrase itself is never stored in the cookie —
// only a signed token — so the cookie value alone is useless without
// INTERNAL_DASHBOARD_SECRET.
//
// Uses the Web Crypto API (globalThis.crypto.subtle) rather than Node's
// `crypto` module: this file is imported by middleware.ts, which runs on
// Vercel's Edge Runtime — Edge does not support Node built-ins like
// `node:crypto`, only Web Crypto. Web Crypto is available in both the Edge
// Runtime and modern Node.js, so the same code works in middleware.ts and in
// the Node-runtime server actions.
//
// IMPORTANT: this module must stay free of `next/headers` (and any other
// Node/server-only import) so it remains Edge-safe. The cookie-reading helper
// for Server Actions lives in lib/internal-session.ts instead.
//
// ─── Token format (v2, 2026-08-17) ───────────────────────────────────────────
// Previously the cookie was a bare HMAC over a fixed string — the same value
// forever, with no expiry inside it and no way to invalidate it short of
// rotating the secret. The 30-day cookie maxAge was only a client-side hint
// that an attacker holding the value could simply ignore.
//
// v2 tokens are `v2.<expiresAtMs>.<hmacHex>` where the HMAC covers both the
// expiry and a rotatable epoch. This means:
//   • The expiry is signed, so it can't be extended by editing the cookie.
//   • Bumping INTERNAL_SESSION_EPOCH invalidates every outstanding session
//     without changing the passphrase everyone has to re-learn.
// v1 tokens no longer validate — everyone is logged out once on deploy, which
// is the intended behaviour.
// ─────────────────────────────────────────────────────────────────────────────

const COOKIE_NAME = 'fmbc_internal_session'
const TOKEN_VERSION = 'v2'

// Bump this env var (any new value) to force-log-out every session — useful
// if a laptop is lost or a cookie value is accidentally shared/screenshotted.
function sessionEpoch(): string {
  return process.env.INTERNAL_SESSION_EPOCH || '1'
}

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

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

function signedPayload(expiresAtMs: number): string {
  return `${TOKEN_VERSION}|${expiresAtMs}|${sessionEpoch()}`
}

export async function checkPassphrase(input: string): Promise<boolean> {
  const secret = process.env.INTERNAL_DASHBOARD_SECRET
  if (!secret) {
    console.error('INTERNAL_DASHBOARD_SECRET not configured — internal dashboard is locked out entirely')
    return false
  }
  if (secret.length < 16) {
    // Not fatal, but this is the only thing standing between the public
    // internet and every searcher's phone number. Loud is correct here.
    console.warn(
      'INTERNAL_DASHBOARD_SECRET is shorter than 16 characters — use a long random string, not a memorable passphrase'
    )
  }
  return timingSafeEqualStr(input, secret)
}

/** Mints a fresh session token. Returns null if the secret isn't configured. */
export async function makeSessionCookieValue(ttlMs: number = SESSION_TTL_MS): Promise<string | null> {
  const secret = process.env.INTERNAL_DASHBOARD_SECRET
  if (!secret) return null
  const expiresAtMs = Date.now() + ttlMs
  const sig = await hmacHex(secret, signedPayload(expiresAtMs))
  return `${TOKEN_VERSION}.${expiresAtMs}.${sig}`
}

/**
 * Validates a session cookie: correct format, not expired, signature matches
 * the current secret AND the current epoch. Fails closed on anything unusual.
 */
export async function isValidSessionCookie(value: string | undefined | null): Promise<boolean> {
  if (!value) return false

  const secret = process.env.INTERNAL_DASHBOARD_SECRET
  if (!secret) return false

  const parts = value.split('.')
  if (parts.length !== 3) return false // rejects v1 tokens, which had no dots

  const [version, expiryRaw, sig] = parts
  if (version !== TOKEN_VERSION) return false

  const expiresAtMs = Number(expiryRaw)
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) return false

  const expected = await hmacHex(secret, signedPayload(expiresAtMs))
  return timingSafeEqualStr(sig, expected)
}

export { COOKIE_NAME }
