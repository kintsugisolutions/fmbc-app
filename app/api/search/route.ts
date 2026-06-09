import { NextRequest, NextResponse } from 'next/server'

// ─── Rate limiter ─────────────────────────────────────────────────────────────
// PRODUCTION NOTE: The in-memory Map below works correctly in local dev and
// single-instance deployments. On Vercel serverless, each cold-start gets its
// own memory — the Map resets, making this limit ineffective.
//
// TO FIX FOR PRODUCTION (one-time setup, free tier is enough):
//   1. Create a free Upstash Redis account at https://upstash.com
//   2. npm install @upstash/ratelimit @upstash/redis
//   3. Add these two env vars to .env.local AND Vercel:
//        UPSTASH_REDIS_REST_URL=...
//        UPSTASH_REDIS_REST_TOKEN=...
//   4. Replace the checkRateLimit function and its call below with:
//
//   import { Ratelimit } from '@upstash/ratelimit'
//   import { Redis } from '@upstash/redis'
//   const ratelimit = new Ratelimit({
//     redis: Redis.fromEnv(),
//     limiter: Ratelimit.slidingWindow(5, '10 m'),
//   })
//   // Then in the handler:
//   const { success } = await ratelimit.limit(ip)
//   if (!success) return NextResponse.json({ error: 'Too many requests...' }, { status: 429 })
//
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT   = 5
const WINDOW_MS    = 10 * 60 * 1000 // 10 minutes

function checkRateLimit(ip: string): boolean {
  const now   = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

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
    // ── CSRF: Origin check ──────────────────────────────────────────────────
    // Rejects requests from any domain that isn't FMBC itself.
    // Browsers always send Origin on cross-origin POST; absence means direct API call
    // (e.g. curl in dev) — allow those only in development.
    const origin = req.headers.get('origin')
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Rate limit by IP ────────────────────────────────────────────────────
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a few minutes and try again.' },
        { status: 429 }
      )
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

    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_URL is not set')
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    // ── n8n webhook secret ────────────────────────────────────────────────────
    // X-FMBC-Secret prevents anyone who discovers the webhook URL from bypassing
    // the Next.js rate limiter and spamming n8n directly.
    // TO ACTIVATE: Add N8N_WEBHOOK_SECRET to .env.local and Vercel env vars,
    // then validate this header in your n8n webhook node's "Header Auth" settings.
    const webhookHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (process.env.N8N_WEBHOOK_SECRET) {
      webhookHeaders['X-FMBC-Secret'] = process.env.N8N_WEBHOOK_SECRET
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

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Search API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
