'use client'
import { useEffect } from 'react'

// Toggles `.nav--scrolled` on the nav once the page is scrolled past 20px, which
// swaps in the frosted-glass background. Renders nothing — it's a side effect only,
// so Nav can stay a server component.
export default function NavScrollEffect() {
  useEffect(() => {
    const nav = document.querySelector('nav.nav')
    if (!nav) return
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        nav.classList.toggle('nav--scrolled', window.scrollY > 20)
        ticking = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return null
}
