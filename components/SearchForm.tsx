'use client'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import WhatsAppMark from './WhatsAppMark'

const AREAS = [
  'Anywhere in Ludhiana',
  'Model Town','BRS Nagar','Civil Lines','Sarabha Nagar',
  'Dugri','Pakhowal Road','Ferozepur Road','Gurdev Nagar',
  'Haibowal','Raikot Road','Other'
]

type Status = 'idle' | 'loading' | 'success' | 'error' | 'timeout'
type Props = { mode?: 'buy' | 'drink' }
type Suggestion = { name: string; category: string }

const SEARCH_TIMEOUT_MS = 12000
const MAX_RETRIES = 2

// Mark that fills gold bottom→top when a search registers, with a sparkle once
// full. The fill is a rising rect clipped to the silhouette: a bottle for store
// searches, a beer mug (foam + handle) for venue searches.
function BottleFill({ mode }: { mode: 'buy' | 'drink' }) {
  const reduced = useReducedMotion() ?? false
  const isMug = mode === 'drink'
  const w = isMug ? 60 : 44
  const h = isMug ? 60 : 92
  const body = isMug
    ? 'M12 18 L42 18 L40 53 Q40 56 37 56 L17 56 Q14 56 14 53 Z'
    : 'M16 5 L28 5 L28 13 L26 13 L26 24 L36 39 L36 83 Q36 88 31 88 L13 88 Q8 88 8 83 L8 39 L18 24 L18 13 L16 13 Z'
  const sparkle = isMug
    ? { d: 'M45 7l1.4 3.2 3.2 1.4-3.2 1.4-1.4 3.2-1.4-3.2-3.2-1.4 3.2-1.4z', origin: '45px 11px' }
    : { d: 'M34 12l1.4 3.2L38.6 16.6 35.4 18 34 21.2 32.6 18 29.4 16.6 32.6 15.2z', origin: '34px 16px' }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={isMug ? 'Venue found' : 'Bottle found'}>
      <defs>
        <clipPath id="fmbc-fill-clip"><path d={body} /></clipPath>
        <linearGradient id="fmbc-fill-grad" x1="0" y1={h} x2="0" y2="0">
          <stop offset="0" stopColor="#A07830" />
          <stop offset="1" stopColor="#E8C878" />
        </linearGradient>
      </defs>
      <g clipPath="url(#fmbc-fill-clip)">
        <motion.rect
          x="0" width={w} fill="url(#fmbc-fill-grad)"
          initial={reduced ? { y: 0, height: h } : { y: h, height: 0 }}
          animate={{ y: 0, height: h }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.15 }}
        />
      </g>
      <path d={body} fill="none" stroke="#D2A74F" strokeWidth="1.7" strokeLinejoin="round" />
      {isMug ? (
        <>
          <path d="M42 26 C52 26 53 31 53 36 C53 43 52 48 42 48" fill="none" stroke="#D2A74F" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M11 18 C8 9 13 4 18 7 C20 1 30 1 32 7 C38 4 43 9 41 18 Z" fill="rgba(232,200,120,0.2)" stroke="#E8C878" strokeWidth="1.5" strokeLinejoin="round" />
        </>
      ) : (
        <path d="M12 64 L32 56 L32 48 L12 56 Z" fill="none" stroke="#E8C878" strokeWidth="1.1" strokeLinejoin="round" opacity="0.7" />
      )}
      {/* Sparkle once full */}
      <motion.path
        d={sparkle.d}
        fill="#FAF6EE"
        initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
        animate={reduced ? undefined : { opacity: [0, 1, 0.85], scale: [0, 1.2, 1] }}
        transition={{ duration: 0.6, delay: 1.15, ease: 'easeOut' }}
        style={{ transformOrigin: sparkle.origin }}
      />
    </svg>
  )
}

function TimeoutOverlay({ canRetry, onRetry, onReset }: {
  canRetry: boolean; onRetry: () => void; onReset: () => void
}) {
  return (
    <div className="success-overlay" onClick={onReset}>
      <div className="success-card" onClick={e => e.stopPropagation()}>
        <div className="success-icon-wrap">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="19" stroke="#D2A74F" strokeWidth="1.5" opacity="0.5"/>
            <path d="M20 11v9l6 4" stroke="#D2A74F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="success-title">Taking longer than usual…</h2>
        <p className="success-sub">
          Our network is slow to respond right now. Your details are safe — nothing
          was submitted twice.
        </p>
        {canRetry ? (
          <button className="success-close" onClick={onRetry}>Try again</button>
        ) : (
          <p className="success-watchlist" style={{ marginBottom: 24 }}>
            Still no luck. Reset the form and try again in a few minutes.
          </p>
        )}
        <button className="overlay-ghost-btn mono" onClick={onReset}>Reset form</button>
      </div>
    </div>
  )
}

function SuccessOverlay({ product, area, mode, onClose }: {
  product: string; area: string; mode: 'buy'|'drink'; onClose: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 8000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="success-overlay" onClick={onClose}>
      <div className="success-card" onClick={e => e.stopPropagation()}>
        <div className="success-icon-wrap success-icon-wrap--bottle">
          <BottleFill mode={mode} />
        </div>
        <h2 className="success-title">Your search is live.</h2>
        <p className="success-product mono">{product}</p>
        <p className="success-sub">
          We are checking {mode === 'buy' ? 'stores' : 'venues'} in <strong>{area}</strong> right now.
          <br />Expect a WhatsApp from us — typically within the hour.
        </p>
        <p className="success-watchlist">
          If nothing is available today, you are automatically added to the watchlist. We alert you the moment it surfaces.
        </p>
        <button className="success-close" onClick={onClose}>Got it</button>
        <p className="success-hint mono">This message closes automatically</p>
      </div>
    </div>
  )
}

export default function SearchForm({ mode = 'buy' }: Props) {
  const searchParams = useSearchParams()

  const [product, setProduct] = useState('')
  const [area, setArea]       = useState('')
  const [phone, setPhone]     = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus]   = useState<Status>('idle')
  const [error, setError]     = useState('')
  const [retryCount, setRetryCount] = useState(0)

  const [allProducts, setAllProducts]   = useState<Suggestion[]>([])
  const [suggestions, setSuggestions]   = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex]   = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)

  // ── Form-card tilt ──────────────────────────────────────────────────────────
  // Subtle 3D tilt + specular highlight tracking the pointer. Only on fine-pointer,
  // motion-allowed devices, and it stays flat whenever a field is focused so typing
  // is never disorienting.
  const formRef = useRef<HTMLFormElement>(null)
  const tiltOK  = useRef(false)
  useEffect(() => {
    tiltOK.current =
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])
  function resetTilt() {
    const el = formRef.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.classList.remove('form-wrap--tilt')
  }
  function handleTiltMove(e: React.MouseEvent<HTMLFormElement>) {
    const el = formRef.current
    if (!el || !tiltOK.current) return
    // Keep flat while a field is focused (stable typing)
    if (el.contains(document.activeElement) && document.activeElement !== document.body) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty('--ry', `${(px - 0.5) * 12}deg`)
    el.style.setProperty('--rx', `${(0.5 - py) * 12}deg`)
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
    el.classList.add('form-wrap--tilt')
  }

  const productValid = product.trim().length >= 2
  const areaValid    = area !== ''
  const phoneValid   = /^[6-9]\d{9}$/.test(phone.trim())

  // Preload the full product list once — 32 items, ~1 KB, instant client-side filtering thereafter
  useEffect(() => {
    fetch('/api/products?q=all')
      .then(r => r.ok ? r.json() : [])
      .then((data: Suggestion[]) => setAllProducts(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setProduct(q)
  }, [searchParams])

  function handleProductChange(val: string) {
    setProduct(val)
    const q = val.trim().toLowerCase()
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    const matches = allProducts
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 6)
    setSuggestions(matches)
    setShowSuggestions(matches.length > 0)
    setActiveIndex(-1)
  }

  function pickSuggestion(name: string) {
    setProduct(name)
    setSuggestions([])
    setShowSuggestions(false)
    setActiveIndex(-1)
  }

  function handleProductKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      pickSuggestion(suggestions[activeIndex].name)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Runs the actual request. Aborts at 12s and routes to the timeout UI so a slow
  // network reads as "still working" rather than a hard failure. 429 handling is
  // preserved exactly. Used by both first submit and retries.
  async function runSearch() {
    setError('')
    setStatus('loading')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, area, phone: phone.trim(), searchType: mode }),
        signal: controller.signal,
      })
      clearTimeout(timer)
      if (res.status === 429) {
        setError('Too many searches. Please wait a few minutes and try again.')
        setStatus('idle'); return
      }
      if (!res.ok) throw new Error('Search failed')
      setStatus('success')
      setRetryCount(0)
    } catch (err) {
      clearTimeout(timer)
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStatus('timeout')
      } else {
        setStatus('error')
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!product.trim() || !area || !phone.trim()) return
    if (!phoneValid) { setError('Enter a valid 10-digit Indian mobile number.'); return }
    if (!consent)   { setError('Please confirm your consent to continue.'); return }
    // Fire the "finding your bottle" pin out of the submit button
    const btn = (e.currentTarget as HTMLFormElement).querySelector('.submit-btn')
    if (btn) {
      const r = btn.getBoundingClientRect()
      window.dispatchEvent(new CustomEvent('fmbc:search-pin', {
        detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
      }))
    }
    setRetryCount(0)
    runSearch()
  }

  function handleRetry() {
    setRetryCount(c => c + 1)
    runSearch()
  }

  function handleReset() {
    setProduct(''); setArea(''); setPhone(''); setConsent(false)
    setError(''); setRetryCount(0); setStatus('idle')
  }

  const placeholder = mode === 'buy'
    ? 'e.g. Glenfiddich 12, Roku Gin, Desperados'
    : 'e.g. Hendricks Gin, Johnnie Walker Black, Hoegaarden'

  return (
    <>
      {status === 'success' && (
        <SuccessOverlay product={product} area={area} mode={mode} onClose={() => setStatus('idle')} />
      )}

      {status === 'timeout' && (
        <TimeoutOverlay
          canRetry={retryCount < MAX_RETRIES}
          onRetry={handleRetry}
          onReset={handleReset}
        />
      )}

      <form
        className="form-wrap"
        onSubmit={handleSubmit}
        ref={formRef}
        onMouseMove={handleTiltMove}
        onMouseLeave={resetTilt}
        onFocusCapture={resetTilt}
      >
        <div className={`field${productValid ? ' field--valid' : ''}${showSuggestions ? ' field--open' : ''}`} ref={wrapRef}>
          <label>What are you looking for?</label>
          <input
            type="text" value={product} required maxLength={200}
            onChange={e => handleProductChange(e.target.value)}
            onKeyDown={handleProductKeyDown}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
            placeholder={placeholder}
            autoComplete="off"
            enterKeyHint="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
          />
          {productValid && <span className="field-tick">✓</span>}
          {showSuggestions && (
            <ul className="autocomplete-list" role="listbox">
              {suggestions.map((s, i) => (
                <li
                  key={s.name}
                  role="option"
                  aria-selected={i === activeIndex}
                  className={`autocomplete-item${i === activeIndex ? ' autocomplete-item--active' : ''}`}
                  onMouseDown={e => { e.preventDefault(); pickSuggestion(s.name) }}
                >
                  <span className="autocomplete-name">{s.name}</span>
                  <span className="autocomplete-cat mono">{s.category}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`field${areaValid ? ' field--valid' : ''}`}>
          <label>Your area in Ludhiana</label>
          <select value={area} onChange={e => setArea(e.target.value)} required>
            <option value="" disabled>Select area</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {areaValid && <span className="field-tick field-tick--select">✓</span>}
        </div>

        <div className={`field${phoneValid ? ' field--valid' : ''}`}>
          <label>Your WhatsApp number</label>
          <div className="phone-wrap">
            <span className="phone-prefix mono">
              <WhatsAppMark size={16} style={{ flexShrink: 0 }} />
              +91
            </span>
            <input
              type="tel" inputMode="numeric" autoComplete="tel"
              value={phone} required maxLength={10}
              onChange={e => setPhone(e.target.value.replace(/\D/g,''))}
              placeholder="98XXXXXXXX"
            />
          </div>
          {phoneValid && <span className="field-tick field-tick--phone">✓</span>}
        </div>

        <div className="field consent-field">
          <label className="consent-label">
            <input
              type="checkbox" checked={consent}
              onChange={e => setConsent(e.target.checked)} required
            />
            <span>
              I consent to Find My Bottle Club collecting and using my WhatsApp number
              solely to check availability and send me one notification per search.
              I have read the{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              {' '}and{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>.
              I confirm I am 25 years of age or older.
            </span>
          </label>
        </div>

        {error && <p className="form-error" role="alert" aria-live="polite">{error}</p>}

        <button type="submit" className="submit-btn" disabled={status === 'loading'}>
          {status === 'loading'
            ? 'Searching...'
            : mode === 'buy' ? 'Search Stores' : 'Search Venues'}
        </button>

        {/* Response time badge — keep this a target, not a fabricated average,
            until real reply-time data exists to back a specific number */}
        <p className="response-badge mono">⚡ Typically replies within the hour</p>

        {status === 'error' && (
          <p className="form-error" role="alert" aria-live="polite" style={{marginTop:'12px',textAlign:'center'}}>
            Something went wrong. Try again in a moment.
          </p>
        )}
        <p className="form-footnote">
          We check availability across our verified {mode === 'buy' ? 'store' : 'venue'} network in Ludhiana and WhatsApp you when confirmed.
          No spam. No ads. Members only.
        </p>
      </form>
    </>
  )
}
