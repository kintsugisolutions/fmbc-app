'use client'
import { useEffect, useState, useCallback } from 'react'

// "Search Now" affordance that appears once the hero entrance + title shimmer have
// settled, then smooth-scrolls to the search form. It's the post-animation signal
// that the form is further down the page. Home only (mounted from HeroContent).
//
// Timing is coordinated with the gate: while the age gate is open the hero
// animations are held paused (html[data-gate-open]), so we wait for the
// `fmbc:verified` event before arming the reveal timer. Returning verified
// visitors (no gate) arm on mount. Once shown it stays until the user engages —
// clicks it, or scrolls the page themselves — so it's always actually seen.
export default function ScrollCue({ targetId = 'search-form' }: { targetId?: string }) {
  const [show, setShow] = useState(false)

  // Reveal after the animations settle.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let timer: number
    const arm = () => { timer = window.setTimeout(() => setShow(true), reduced ? 600 : 2200) }

    if (document.documentElement.hasAttribute('data-gate-open')) {
      const onVerified = () => arm()
      window.addEventListener('fmbc:verified', onVerified, { once: true })
      return () => {
        window.removeEventListener('fmbc:verified', onVerified)
        window.clearTimeout(timer)
      }
    }
    arm()
    return () => window.clearTimeout(timer)
  }, [])

  // Dismiss once the user has scrolled themselves (they got the signal).
  useEffect(() => {
    if (!show) return
    const onScroll = () => { if (window.scrollY > 120) setShow(false) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [show])

  const handleClick = useCallback(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(targetId)?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'center',
    })
    setShow(false)
  }, [targetId])

  if (!show) return null

  return (
    <button type="button" className="scroll-cue" onClick={handleClick} aria-label="Scroll to the search form">
      <span className="scroll-cue-text mono">Search a bottle</span>
      <svg className="scroll-cue-chevron" width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
