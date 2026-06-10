'use client'
import { useEffect, useRef } from 'react'

// Layered depth background — gives the page dimensionality without WebGL.
// Three fixed planes (far glow / mid particles / near orbs) drift ambiently via CSS
// and shift at different rates on scroll (~15 lines of rAF JS, passive listener).
// Zero canvas, zero libraries — runs at 60fps on budget Android.
// Fully disabled for prefers-reduced-motion users.

export default function DepthField() {
  const farRef  = useRef<HTMLDivElement>(null)
  const midRef  = useRef<HTMLDivElement>(null)
  const nearRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let ticking = false
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        if (farRef.current)  farRef.current.style.transform  = `translate3d(0, ${y * -0.04}px, 0)`
        if (midRef.current)  midRef.current.style.transform  = `translate3d(0, ${y * -0.1}px, 0)`
        if (nearRef.current) nearRef.current.style.transform = `translate3d(0, ${y * -0.18}px, 0)`
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="depth-field" aria-hidden="true">
      <div ref={farRef}  className="depth-layer depth-layer--far" />
      <div ref={midRef}  className="depth-layer depth-layer--mid" />
      <div ref={nearRef} className="depth-layer depth-layer--near" />
    </div>
  )
}
