import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// Lightweight pageview beacon endpoint — called by components/PageViewTracker.tsx via
// navigator.sendBeacon() on every client-side route change. No cookies, no fingerprinting,
// no raw IP stored — only the coarse geo Vercel already resolves at the edge for every
// request (see https://vercel.com/docs/headers/request-headers). Fire-and-forget by design:
// this must never block or fail the page render, so we always return 204 quickly and log
// insert errors server-side only.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const path = typeof body?.path === 'string' ? body.path.slice(0, 512) : '/'

    // Never track the internal dashboard itself — it's just us, and including it would
    // pollute the traffic numbers we're trying to measure (the public site).
    if (path.startsWith('/internal')) {
      return new NextResponse(null, { status: 204 })
    }

    const headers = request.headers
    const country = headers.get('x-vercel-ip-country')
    const region = headers.get('x-vercel-ip-country-region')
    const city = headers.get('x-vercel-ip-city')
    const referrer = typeof body?.referrer === 'string' ? body.referrer.slice(0, 512) : null

    const supabase = createAdminClient()
    const { error } = await supabase.from('page_views').insert({
      path,
      country,
      region,
      city: city ? decodeURIComponent(city) : null,
      referrer,
    })

    if (error) {
      console.error('page_views insert failed:', error.message)
    }

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('track route error:', err)
    // Still 204 — tracking failures must never surface to the visitor.
    return new NextResponse(null, { status: 204 })
  }
}
