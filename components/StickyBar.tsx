'use client'
import { useState, useEffect } from 'react'

export default function StickyBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const anchor = document.getElementById('search-anchor')
    if (!anchor) return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(anchor)
    return () => observer.disconnect()
  }, [])

  function scrollToSearch() {
    document.getElementById('search-anchor')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div
      className={`sticky-bar${visible ? ' sticky-bar--visible' : ''}`}
      onClick={scrollToSearch}
      role="button"
      aria-label="Scroll back to search form"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && scrollToSearch()}
    >
      <span className="sticky-bar-text mono">Search a bottle →</span>
    </div>
  )
}
