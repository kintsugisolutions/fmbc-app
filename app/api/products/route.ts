import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─── Rate limiter — same pattern as /api/search ───────────────────────────────
// Products endpoint exposes demand intelligence (search_count rankings). Without
// rate limiting, anyone can scrape the full catalog and velocity data in one call.
// 30 requests per 10 minutes per IP — generous for real users, blocks scrapers.
let ratelimit: Ratelimit | null = null
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, '10 m'),
    analytics: false,
  })
}
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // ── Rate limit by IP ──────────────────────────────────────────────────────
  if (ratelimit) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'
    const { success } = await ratelimit.limit(`products:${ip}`)
    if (!success) {
      return NextResponse.json([], { status: 429 })
    }
  }

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

  // q=all → return the full list for client-side preload (called once on mount)
  const fetchAll = q === 'all'

  if (!fetchAll && q.length < 2) return NextResponse.json([])
  if (q.length > 100) return NextResponse.json([], { status: 400 })

  try {
    let query = createClient()
      .from('products')
      .select('name, category')
      .eq('is_available', true)
      .order('search_count', { ascending: false })

    if (!fetchAll) query = query.ilike('name', `%${q}%`).limit(6)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data ?? [], {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
    })
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
