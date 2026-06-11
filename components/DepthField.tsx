'use client'
import { useEffect, useRef } from 'react'

// Layered depth background — gives the page dimensionality without WebGL.
// Four fixed planes (far glow / mid particles / near orbs / mouse shimmer) drift
// ambiently via CSS and shift at different rates on scroll (~15 lines of rAF JS,
// passive listener). The far plane sits on a slight rotateX inside a perspective
// wrapper. The shimmer plane tracks the pointer via --mx/--my; on touch devices
// (no pointer) it sweeps slowly on a sine path instead. Zero canvas, zero WebGL.
// Fully disabled for prefers-reduced-motion users.

export default function DepthField() {
  const fieldRef = useRef<HTMLDivElement>(null)
  const farRef   = useRef<HTMLDivElement>(null)
  const midRef   = useRef<HTMLDivElement>(null)
  const nearRef  = useRef<HTMLDivElement>(null)

  // Scroll parallax — far plane keeps its rotateX so the perspective reads correctly.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let ticking = false
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        if (farRef.current)  farRef.current.style.transform  = `translate3d(0, ${y * -0.04}px, 0) rotateX(2deg)`
        if (midRef.current)  midRef.current.style.transform  = `translate3d(0, ${y * -0.1}px, 0)`
        if (nearRef.current) nearRef.current.style.transform = `translate3d(0, ${y * -0.18}px, 0)`
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Shimmer: follow the pointer, or drift on a slow sine path when there's no pointer.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const field = fieldRef.current
    if (!field) return

    const hasPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

    if (hasPointer) {
      let ticking = false
      const onMove = (e: MouseEvent) => {
        if (ticking) return
        ticking = true
        requestAnimationFrame(() => {
          field.style.setProperty('--mx', `${(e.clientX / window.innerWidth) * 100}%`)
          field.style.setProperty('--my', `${(e.clientY / window.innerHeight) * 100}%`)
          ticking = false
        })
      }
      window.addEventListener('mousemove', onMove, { passive: true })
      return () => window.removeEventListener('mousemove', onMove)
    }

    // Touch / no pointer — animate the shimmer along a gentle Lissajous-ish loop.
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = (now - start) / 1000
      const mx = 50 + Math.sin(t * 0.35) * 30
      const my = 42 + Math.cos(t * 0.27) * 22
      field.style.setProperty('--mx', `${mx}%`)
      field.style.setProperty('--my', `${my}%`)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <div ref={fieldRef} className="depth-field" aria-hidden="true">
        <div ref={farRef}  className="depth-layer depth-layer--far" />
        <div ref={midRef}  className="depth-layer depth-layer--mid" />
        <div ref={nearRef} className="depth-layer depth-layer--near" />
        <div className="depth-layer depth-layer--shimmer" />
      </div>
    </>
  )
}
