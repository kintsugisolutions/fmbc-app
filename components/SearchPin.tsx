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
    const onPin = (e: Event) => {
      // Aim at the explicit landing anchor SearchMark places at the silhouette's
      // top-centre, not the full-width wrapper — keeps the tip on the cap/mouth
      // regardless of the silhouette's asymmetry or container padding.
      const aim = document.getElementById('search-mark-aim')
      if (!aim) return
      const br = aim.getBoundingClientRect()
      const targetX = br.left + br.width / 2
      const targetY = br.top - 8                 // just above the cap

      const detail = (e as CustomEvent).detail || {}
      const startX = typeof detail.x === 'number' ? detail.x : targetX
      const startY = typeof detail.y === 'number' ? detail.y : targetY - 130

      x.set(startX); y.set(startY); scale.set(0); opacity.set(1)
      // pop out
      animate(scale, [0, 1.3, 1], { duration: 0.42, ease: 'easeOut' })
      // travel to the bottle, with a small landing bounce on Y
      animate(x, targetX, { duration: 0.72, ease: [0.4, 0, 0.2, 1] })
      animate(y, [startY, targetY + 12, targetY], { duration: 0.72, ease: 'easeInOut' }).then(() => {
        setRingKey(k => k + 1)
        animate(scale, [1, 1.18, 0.94, 1], { duration: 0.4, ease: 'easeOut' })
      })
      // linger, then fade out
      animate(opacity, 0, { duration: 0.5, delay: 2 })
    }
    window.addEventListener('fmbc:search-pin', onPin as EventListener)
    return () => window.removeEventListener('fmbc:search-pin', onPin as EventListener)
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
