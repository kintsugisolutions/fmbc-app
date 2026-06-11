'use client'
import { useState, useEffect } from 'react'
import ModeToggle from './ModeToggle'
import SearchForm from './SearchForm'
import SearchTicker from './SearchTicker'
import SearchMark from './SearchMark'

const HERO_SUB: Record<'buy'|'drink', string> = {
  buy:   'Search for a specific bottle. We check availability across verified stores in Ludhiana and WhatsApp you when it is confirmed.',
  drink: 'Tell us what you want to drink. We check bars and restaurants in Ludhiana and WhatsApp you where it is available tonight.',
}

export default function HeroContent() {
  const [mode, setMode] = useState<'buy'|'drink'>('buy')

  // Drive the page-wide mode tint (oxblood for "Find a Bar"). Set on <html> so the
  // fixed .mode-tint wash — and any future mode-aware styling — can react globally.
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode)
    return () => document.documentElement.removeAttribute('data-mode')
  }, [mode])

  return (
    <>
      {/* Dynamic subtitle — responds to mode toggle */}
      <p className="hero-sub hero-sub--dynamic">{HERO_SUB[mode]}</p>

      {/* Live activity ticker */}
      <SearchTicker />

      {/* Mode toggle + benefit line + form */}
      <div className="form-section" id="search-form">
        <ModeToggle mode={mode} onChange={setMode} />
        <p className="members-benefit mono">
          ✦ Founding Members get wishlist access &amp; community reviews
        </p>
        <SearchForm mode={mode} />
      </div>

      {/* Destination mark the search pin lands on — bottle (buy) or beer mug (bar) */}
      <SearchMark mode={mode} />
    </>
  )
}
