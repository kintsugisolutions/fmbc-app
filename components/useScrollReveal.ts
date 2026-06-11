'use client'
import { useEffect, useRef, useState } from 'react'

// Intersection Observer reveal. Fires once when ~15% of the element is in view.
// Under prefers-reduced-motion it resolves to shown=true immediately so nothing
// stays hidden. Generic enough to drive section fade-ups and any one-shot reveal.
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, shown }
}
