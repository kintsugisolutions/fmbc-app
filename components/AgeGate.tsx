'use client'
import { useState, useEffect } from 'react'

// Punjab Excise Act 1914 — minimum age for alcohol access is 25 years in Punjab.
// DOB is collected solely to verify age; it is NEVER stored, logged, or transmitted.
// Acceptance is stored in sessionStorage for in-session persistence only.
//
// Gate-first rendering: the overlay is part of the server HTML (default state 'gate'),
// so unverified visitors never see a flash of content before hydration. A pre-paint
// inline script in app/layout.tsx sets `data-fmbc-verified` on <html> for returning
// visitors (CSS hides the overlay instantly) or `data-gate-open` otherwise (holds the
// hero entrance animations until the gate clears).

type State = 'gate' | 'exiting' | 'hidden' | 'blocked'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

function calculateAge(day: number, month: number, year: number): number {
  const today   = new Date()
  const bday    = new Date(year, month - 1, day)
  let   age     = today.getFullYear() - bday.getFullYear()
  const m       = today.getMonth() - bday.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) age--
  return age
}

export default function AgeGate() {
  // 'gate' by default → overlay exists in SSR HTML → no content flash for new visitors
  const [state,    setState]    = useState<State>('gate')
  const [day,      setDay]      = useState('')
  const [month,    setMonth]    = useState('')
  const [year,     setYear]     = useState('')
  const [dobError, setDobError] = useState('')

  useEffect(() => {
    // The pre-paint script in layout.tsx already decided; just sync React state.
    if (document.documentElement.hasAttribute('data-fmbc-verified')) {
      setState('hidden')
    }
  }, [])

  // Reset day if it exceeds the days in the newly selected month/year
  useEffect(() => {
    if (day && month && year) {
      const maxDays = getDaysInMonth(parseInt(month), parseInt(year))
      if (parseInt(day) > maxDays) setDay('')
    }
  }, [month, year, day])

  const currentYear = new Date().getFullYear()
  const maxYear     = currentYear - 25 // oldest birth year that yields exactly 25
  const minYear     = 1930

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i)

  const daysInMonth = month && year
    ? getDaysInMonth(parseInt(month), parseInt(year))
    : 31
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  function handleVerify() {
    setDobError('')
    if (!day || !month || !year) {
      setDobError('Please select your complete date of birth.')
      return
    }
    const d = parseInt(day)
    const m = parseInt(month)
    const y = parseInt(year)

    // Sanity-check the date is real (e.g., not 31 Feb)
    if (d > getDaysInMonth(m, y)) {
      setDobError('That date does not exist. Please check and try again.')
      return
    }

    const age = calculateAge(d, m, y)
    if (age < 25) {
      setState('blocked')
      return
    }

    try { sessionStorage.setItem('fmbc-age-verified', '1') } catch { /* ignore */ }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const html = document.documentElement

    function reveal() {
      html.removeAttribute('data-gate-open')
      html.setAttribute('data-fmbc-verified', '1')
      // Lets other components (e.g. the iOS install prompt) react to verification
      window.dispatchEvent(new CustomEvent('fmbc:verified'))
    }

    if (reduceMotion) {
      reveal()
      setState('hidden')
      return
    }

    // Exit sequence: gate card lifts + overlay parts → hero staggers in beneath it
    setState('exiting')
    setTimeout(reveal, 280)                    // start hero entrance behind the fading overlay
    setTimeout(() => setState('hidden'), 820)  // unmount after the exit animation completes
  }

  if (state === 'hidden') return null

  if (state === 'blocked') {
    return (
      <div className="age-gate-overlay">
        <div className="age-gate-box">
          <p className="age-gate-eyebrow mono">Access Restricted</p>
          <h2 className="age-gate-title">Age Restriction Applies</h2>
          <p className="age-gate-sub">
            Find My Bottle Club is an alcohol availability service accessible only to
            adults aged 25 years and above, as required under applicable Punjab excise laws.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`age-gate-overlay${state === 'exiting' ? ' age-gate-overlay--exit' : ''}`}>
      <div className="age-gate-glow" aria-hidden="true" />
      <div className="age-gate-box">
        <p className="age-gate-eyebrow mono">Age Verification Required</p>
        <h2 className="age-gate-title">Enter your<br />date of birth</h2>
        <p className="age-gate-sub">
          This service provides alcohol availability information.
          Access is restricted to adults aged 25 and above under Punjab excise laws.
          Your date of birth is not stored.
        </p>

        <div className="age-gate-dob">
          <div className="age-gate-dob-field">
            <span className="age-gate-dob-label mono">Day</span>
            <select
              value={day}
              onChange={e => setDay(e.target.value)}
              className="age-gate-select"
              aria-label="Day of birth"
            >
              <option value="" disabled>DD</option>
              {days.map(d => (
                <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
              ))}
            </select>
          </div>

          <div className="age-gate-dob-field">
            <span className="age-gate-dob-label mono">Month</span>
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="age-gate-select"
              aria-label="Month of birth"
            >
              <option value="" disabled>MM</option>
              {MONTHS.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>

          <div className="age-gate-dob-field">
            <span className="age-gate-dob-label mono">Year</span>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="age-gate-select"
              aria-label="Year of birth"
            >
              <option value="" disabled>YYYY</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {dobError && <p className="age-gate-error" role="alert" aria-live="polite">{dobError}</p>}

        <button className="age-gate-yes age-gate-verify-btn" onClick={handleVerify}>
          Verify Age
        </button>

        <p className="age-gate-legal mono">
          By proceeding you confirm you are of legal drinking age (25+) in Punjab, India
          and that it is lawful for you to access alcohol-related information in your
          jurisdiction. Your date of birth is not stored or transmitted.
        </p>
      </div>
    </div>
  )
}
