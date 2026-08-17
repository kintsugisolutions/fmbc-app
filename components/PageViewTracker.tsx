'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Fires a non-blocking pageview beacon on mount and on every client-side route change.
// Uses sendBeacon so it never delays navigation or the page's own work; falls back to
// fetch(keepalive) for older browsers that lack sendBeacon.
export default function PageViewTracker() {
  const pathname = usePathname()
  const lastSent = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || pathname.startsWith('/internal')) return
    if (lastSent.current === pathname) return
    lastSent.current = pathname

    const payload = JSON.stringify({
      path: pathname,
      referrer: typeof document !== 'undefined' ? document.referrer : null,
    })

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon('/api/track', blob)
      } else {
        fetch('/api/track', {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      // Tracking must never throw into the render path.
    }
  }, [pathname])

  return null
}
