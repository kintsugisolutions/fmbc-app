import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getVenuesForArea, findMatchingProduct, createUserSearch, createVenueQuery } from '@/lib/search-loop'
import { sendWhatsAppTemplate } from '@/lib/interakt'
import { createWatchlistEntry } from '@/lib/watchlist'

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
// Prevents arbitrary strings being forwarded into the venue-matching pipeline.
const ALLOWED_AREAS = [
  'Anywhere in Ludhiana',
  'Model Town', 'BRS Nagar', 'Civil Lines', 'Sarabha Nagar',
  'Dugri', 'Pakhowal Road', 'Ferozepur Road', 'Gurdev Nagar',
  'Haibowal', 'Raikot Road', 'Other',
]

// Strip HTML tags from any string field before it reaches Supabase/Interakt.
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
    // Two different failure modes, deliberately handled differently:
    //
    //   Missing config in production -> FAIL CLOSED (503). This endpoint spends
    //   real money on every call (a WhatsApp template send to up to 5 venues)
    //   and pings partner stores. Serving it with no rate limiting at all
    //   because someone forgot an env var is not an acceptable silent default.
    //
    //   Limiter throws at request time -> FAIL OPEN, logged loudly. That means
    //   Upstash is having a moment; the other guards (age cookie, origin check,
    //   MAX_VENUES_TO_NOTIFY) still bound the damage per request, and taking
    //   the core product offline over a transient Redis blip is worse.
    if (!ratelimit) {
      if (process.env.NODE_ENV === 'production') {
        console.error('Refusing to serve /api/search: rate limiting is not configured')
        return NextResponse.json(
          { error: 'Service temporarily unavailable. Please try again shortly.' },
          { status: 503 }
        )
      }
    } else {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'
      try {
        const { success } = await ratelimit.limit(ip)
        if (!success) {
          return NextResponse.json(
            { error: 'Too many requests. Please wait a few minutes and try again.' },
            { status: 429 }
          )
        }
      } catch (e) {
        console.error('search rate limiter unavailable, allowing this request:', e)
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

    const cleanProduct = sanitise(product)

    const result = await notifyVenues({ product: cleanProduct, area, phone, searchType })
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    // ── Increment search_count in Supabase (fire-and-forget) ─────────────────
    // Non-blocking — a Supabase failure must never break the user-facing search.
    createClient()
      .rpc('increment_product_search_count', { product_name_input: cleanProduct })
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

// Maps the UI's compact searchType values to the storage-layer labels.
const SEARCH_TYPE_LABEL: Record<string, 'Buy a Bottle' | 'Drink Now'> = {
  buy: 'Buy a Bottle',
  drink: 'Drink Now',
}

// Max venues notified per search — a ceiling on both Interakt cost and
// store-message-fatigue, independent of how many Supabase returns.
const MAX_VENUES_TO_NOTIFY = 5

const INTERAKT_TEMPLATE_NAME = process.env.INTERAKT_TEMPLATE_NAME || 'search_received'

// The entire outbound half of the search -> WhatsApp loop: Supabase venue
// lookup + product matching + Interakt send + Supabase audit trail.
//
// n8n was fully retired 2026-08-17 (it used to own this whole function, then
// venue/product lookup moved to Airtable->Supabase on this date, and this is
// the point where the Interakt send itself moved in-house too — there is no
// external workflow engine anywhere in this path anymore, by design: fewer
// hops between "user searched" and "store got pinged" means fewer places for
// the loop to silently break, which matters because store response rate is
// FMBC's north-star metric). The other half — receiving a store's reply —
// lives in app/api/interakt-webhook/route.ts.
async function notifyVenues(input: {
  product: string
  area: string
  phone: string
  searchType: string
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const searchTypeLabel = SEARCH_TYPE_LABEL[input.searchType]
  if (!searchTypeLabel) {
    // Should be unreachable — the earlier whitelist check already rejects
    // anything outside ['buy', 'drink'] — but fail closed rather than send
    // an unmapped value into Supabase's status column.
    return { ok: false, error: 'Invalid search type', status: 400 }
  }

  let venues
  try {
    venues = await getVenuesForArea(input.area, MAX_VENUES_TO_NOTIFY)
  } catch (e) {
    console.error('notifyVenues: Supabase venue lookup failed:', e)
    return { ok: false, error: 'Service unavailable', status: 503 }
  }

  // Best-effort — a miss must never block the search from reaching stores.
  const matchedProductId = await findMatchingProduct(input.product)

  if (venues.length === 0) {
    // No matching stores right now — still log the search (Status: "Not Found")
    // so it shows up in demand-intelligence reporting as unmet demand, per
    // FMBC's core thesis that the search data itself is the asset.
    const notFoundSearchId = await createUserSearch({
      phone: input.phone,
      product: input.product,
      searchType: searchTypeLabel,
      area: input.area,
      status: 'Not Found',
      matchedProductId,
    })
    // No store to ask right now, so this search can only ever be answered
    // later - which is exactly what the watchlist is for.
    await createWatchlistEntry({
      phone: input.phone,
      product: input.product,
      area: input.area,
      productId: matchedProductId,
      userSearchId: notFoundSearchId,
    })
    // Still a success from the user's point of view — the search was received,
    // it just didn't match an active venue in that area right now.
    return { ok: true }
  }

  const userSearchId = await createUserSearch({
    phone: input.phone,
    product: input.product,
    searchType: searchTypeLabel,
    area: input.area,
    status: 'Queries Sent',
    matchedProductId,
  })

  // Standing interest, in case no venue confirms today. If one does, the
  // webhook resolves this row rather than double-messaging the same person
  // (see resolveWatchlistForSearch in lib/watchlist.ts).
  await createWatchlistEntry({
    phone: input.phone,
    product: input.product,
    area: input.area,
    productId: matchedProductId,
    userSearchId,
  })

  // Send to each matched venue. Failures are logged per-venue and don't abort
  // the batch — one bad number shouldn't stop the rest of the network from
  // being notified.
  await Promise.all(
    venues.map(async (venue) => {
      const result = await sendWhatsAppTemplate(venue.whatsapp, INTERAKT_TEMPLATE_NAME, [
        input.product,
        input.area,
      ])
      if (!result.success) {
        console.error(`notifyVenues: Interakt send failed for venue ${venue.id}:`, result.error)
      }
      if (userSearchId) {
        await createVenueQuery({
          venueId: venue.id,
          userSearchId,
          productId: matchedProductId,
          interaktMessageId: result.id ?? null,
        })
      }
    })
  )

  return { ok: true }
}
