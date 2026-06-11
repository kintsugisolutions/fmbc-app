'use client'
import { useEffect, useState } from 'react'

// A single gold sweep across the viewport the moment age is verified. Hooks into
// the existing `fmbc:verified` event AgeGate already dispatches — no change to the
// gate's functional code, and it fires only on real verification (not on returning
// visits where the gate is skipped pre-paint).
export default function GateRevealSweep() {
  const [sweeping, setSweeping] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const onVerified = () => {
      setSweeping(true)
      window.setTimeout(() => setSweeping(false), 1000)
    }
    window.addEventListener('fmbc:verified', onVerified)
    return () => window.removeEventListener('fmbc:verified', onVerified)
  }, [])

  if (!sweeping) return null
  return <div className="gate-reveal-sweep" aria-hidden="true" />
}
