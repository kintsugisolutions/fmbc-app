import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─── Rate limiter (Upstash Redis — persistent across Vercel cold starts) ──────
// Sliding window: 5 requests per IP per 10 minutes.
// Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
// Lazy init with a guard: if the env vars are missing, the route logs loudly and
// continues WITHOUT rate limiting instead of hard-crashing every request with a 500.
// Set the env vars in Vercel before launch — this fallback is a safety net, not a mode.
let ratelimit: Ratelimit | null = null
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '10 m'),
    analytics: false,
  })
} else {
  console.error(
    '⚠️ RATE LIMITING DISABLED: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set. ' +
    'Do not go live without these.'
  )
}

// Server-side area whitelist — must mirror AREAS in components/SearchForm.tsx.
// Prevents arbitrary strings being forwarded into the n8n → WhatsApp pipeline.
const ALLOWED_AREAS = [
  'Anywhere in Ludhiana',
  'Model Town', 'BRS Nagar', 'Civil Lines', 'Sarabha Nagar',
  'Dugri', 'Pakhowal Road', 'Ferozepur Road', 'Gurdev Nagar',
  'Haibowal', 'Raikot Road', 'Other',
]

// Strip HTML tags from any string field before forwarding to n8n
function sanitise(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim().slice(0, 200)
}

// Allowed origins — update if/when you add a custom domain
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://fmbc-app.vercel.app',
  'https://findmybottle.club',
  'https://www.findmybottle.club',
]
// ──────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Age verification ────────────────────────────────────────────────────
    // The age gate overlay is client-side only. This server-side check ensures
    // the API cannot be called directly (curl, scripts) without a verified cookie.
    // Punjab Excise Act 1914 requires reasonable effort to prevent under-25 access.
    const ageCookie = req.cookies.get('fmbc-age-verified')
    if (!ageCookie || ageCookie.value !== '1') {
      return NextResponse.json({ error: 'Age verification required' }, { status: 403 })
    }

    // ── CSRF: Origin check ──────────────────────────────────────────────────
    // Rejects cross-origin browser requests from domains that aren't FMBC.
    // Browsers always send Origin on cross-origin POST requests.
    // KNOWN GAP: headerless clients (curl, Postman, server-side scripts) do not
    // send Origin and will pass this check. That gap is intentional for dev/testing,
    // and is mitigated by the two layers above and below this comment:
    //   • Age cookie check (above) — direct callers without a browser session fail here
    //   • Rate limiter (below) — limits request volume regardless of origin
    const origin = req.headers.get('origin')
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Rate limit by IP ────────────────────────────────────────────────────
    if (ratelimit) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'
      const { success } = await ratelimit.limit(ip)
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a few minutes and try again.' },
          { status: 429 }
        )
      }
    }

    const body = await req.json()
    const { product, area, phone, searchType } = body

    // Required field check
    if (!product?.trim() || !area || !phone || !searchType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Phone validation
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    // Product length guard — reject payloads that are suspiciously long
    if (product.trim().length > 200) {
      return NextResponse.json({ error: 'Product name too long' }, { status: 400 })
    }

    // searchType whitelist
    if (!['buy', 'drink'].includes(searchType)) {
      return NextResponse.json({ error: 'Invalid search type' }, { status: 400 })
    }

    // Area whitelist — reject anything not in the known Ludhiana area list
    if (!ALLOWED_AREAS.includes(area)) {
      return NextResponse.json({ error: 'Invalid area' }, { status: 400 })
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_URL is not set')
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    // ── n8n webhook secret ────────────────────────────────────────────────────
    // X-FMBC-Secret prevents anyone who discovers the webhook URL from bypassing
    // the Next.js rate limiter and spamming n8n directly.
    // Mandatory — the route refuses to forward without it. Set N8N_WEBHOOK_SECRET
    // in .env.local and Vercel env vars, then validate this header in your n8n
    // webhook node's "Header Auth" settings.
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('N8N_WEBHOOK_SECRET is not configured — refusing to forward to n8n')
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }
    const webhookHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-FMBC-Secret': webhookSecret,
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: webhookHeaders,
      body: JSON.stringify({
        product:    sanitise(product),
        area,
        phone:      `91${phone}`,
        searchType,
        source:     'web',
        timestamp:  new Date().toISOString(),
      }),
    })

    if (!res.ok) {
      console.error('n8n webhook error:', res.status)
      return NextResponse.json({ error: 'Search could not be processed' }, { status: 502 })
    }

    // ── Increment search_count in Supabase (fire-and-forget) ─────────────────
    // Non-blocking — a Supabase failure must never break the user-facing search.
    createClient()
      .rpc('increment_product_search_count', { product_name_input: sanitise(product) })
      .then(
        () => {},
        (e: unknown) => console.warn('search_count increment failed:', e)
      )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Search API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
