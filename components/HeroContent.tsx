'use client'
import { useState } from 'react'
import ModeToggle from './ModeToggle'
import SearchForm from './SearchForm'
import SearchTicker from './SearchTicker'

const HERO_SUB: Record<'buy'|'drink', string> = {
  buy:   'Search for a specific bottle. We check availability across verified stores in Ludhiana and WhatsApp you when it is confirmed.',
  drink: 'Tell us what you want to drink. We check bars and restaurants in Ludhiana and WhatsApp you where it is available tonight.',
}

export default function HeroContent() {
  const [mode, setMode] = useState<'buy'|'drink'>('buy')

  return (
    <>
      {/* Dynamic subtitle — responds to mode toggle */}
      <p className="hero-sub hero-sub--dynamic">{HERO_SUB[mode]}</p>

      {/* Live activity ticker */}
      <SearchTicker />

      {/* Mode toggle + benefit line + form */}
      <div className="form-section">
        <ModeToggle mode={mode} onChange={setMode} />
        <p className="members-benefit mono">
          ✦ Founding Members get wishlist access &amp; community reviews
        </p>
        <SearchForm mode={mode} />
      </div>
    </>
  )
}
