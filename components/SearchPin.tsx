'use client'
import { useEffect, useState } from 'react'
import { motion, useMotionValue, animate, useReducedMotion } from 'framer-motion'

// Map pin that pops out of the search button on submit and drops onto the bottle
// under the search section, landing just above its cap with a click ripple — the
// "finding your bottle" gesture, triggered by the action rather than by scrolling.
// Listens for the `fmbc:search-pin` event dispatched by SearchForm. Needs the
// static #search-mark (home only). Disabled under reduced motion.
export default function SearchPin() {
  const reduced = useReducedMotion()
  const [ringKey, setRingKey] = useState(0)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(0)
  const opacity = useMotionValue(0)

  useEffect(() => {
    if (reduced) return
    let rafId = 0

    // Reads the aim anchor's position fresh — called every frame during travel
    // rather than once at dispatch time. The pin's ~0.7s flight is long enough
    // for the page to reflow underneath it (a validation message clearing, the
    // field ticks appearing, a sticky bar toggling — all common on mobile,
    // where this drift was landing the pin off the bottle). Tracking the live
    // target instead of a stale snapshot means the pin always self-corrects
    // onto wherever the bottle actually is by the time it arrives.
    function readTarget() {
      const aim = document.getElementById('search-mark-aim')
      if (!aim) return null
      const br = aim.getBoundingClientRect()
      return { x: br.left + br.width / 2, y: br.top - 8 } // just above the cap
    }

    const onPin = (e: Event) => {
      cancelAnimationFrame(rafId)
      const readInitial = readTarget()
      if (!readInitial) return
      const initialTarget: { x: number; y: number } = readInitial

      const detail = (e as CustomEvent).detail || {}
      const startX = typeof detail.x === 'number' ? detail.x : initialTarget.x
      const startY = typeof detail.y === 'number' ? detail.y : initialTarget.y - 130

      x.set(startX); y.set(startY); scale.set(0); opacity.set(1)
      // pop out
      animate(scale, [0, 1.3, 1], { duration: 0.42, ease: 'easeOut' })

      // Travel phase: ease x/y toward the live target every frame (exponential
      // smoothing, frame-rate independent) instead of animating once to a
      // fixed value. ~0.72s total, matching the previous choreography.
      const travelStart = performance.now()
      const travelDuration = 720
      let landed = false

      function tick(now: number) {
        const elapsed = now - travelStart
        const t = Math.min(elapsed / travelDuration, 1)
        const target = readTarget() ?? initialTarget

        // Smoothing factor ramps up over the flight so it starts with real
        // travel motion (not an instant snap) and tightens onto the target
        // as it approaches, so a late layout shift still gets fully corrected.
        const smoothing = 0.06 + t * 0.22
        x.set(x.get() + (target.x - x.get()) * smoothing)
        y.set(y.get() + (target.y - y.get()) * smoothing)

        if (t < 1) {
          rafId = requestAnimationFrame(tick)
        } else if (!landed) {
          landed = true
          // Snap fully onto the final live target and play the landing bounce.
          x.set(target.x); y.set(target.y)
          setRingKey(k => k + 1)
          animate(scale, [1, 1.18, 0.94, 1], { duration: 0.4, ease: 'easeOut' })
        }
      }
      rafId = requestAnimationFrame(tick)

      // linger, then fade out
      animate(opacity, 0, { duration: 0.5, delay: 2 })
    }
    window.addEventListener('fmbc:search-pin', onPin as EventListener)
    return () => {
      window.removeEventListener('fmbc:search-pin', onPin as EventListener)
      cancelAnimationFrame(rafId)
    }
  }, [reduced, x, y, scale, opacity])

  if (reduced) return null

  return (
    <motion.div className="search-pin" aria-hidden="true" style={{ x, y, opacity }}>
      <div className="search-pin-aim">
        <motion.div className="search-pin-inner" style={{ scale }}>
          <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15 2C9 2 4 6.5 4 12.5 4 21 15 34 15 34s11-13 11-21.5C26 6.5 21 2 15 2z"
              fill="rgba(29,31,35,0.85)" stroke="#D2A74F" strokeWidth="1.6" strokeLinejoin="round"
            />
            <circle cx="15" cy="12.5" r="4" fill="none" stroke="#E8C878" strokeWidth="1.6" />
          </svg>
          <span key={ringKey} className="search-pin-ring" />
        </motion.div>
      </div>
    </motion.div>
  )
}
