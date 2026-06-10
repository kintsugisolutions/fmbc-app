'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const AREAS = [
  'Anywhere in Ludhiana',
  'Model Town','BRS Nagar','Civil Lines','Sarabha Nagar',
  'Dugri','Pakhowal Road','Ferozepur Road','Gurdev Nagar',
  'Haibowal','Raikot Road','Other'
]

type Status = 'idle' | 'loading' | 'success' | 'error'
type Props = { mode?: 'buy' | 'drink' }

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
        <div className="success-icon-wrap">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="19" stroke="#D2A74F" strokeWidth="1.5"/>
            <path d="M12 20l6 6 10-12" stroke="#D2A74F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
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

  const productValid = product.trim().length >= 2
  const areaValid    = area !== ''
  const phoneValid   = /^[6-9]\d{9}$/.test(phone.trim())

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setProduct(q)
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!product.trim() || !area || !phone.trim()) return
    if (!phoneValid) { setError('Enter a valid 10-digit Indian mobile number.'); return }
    if (!consent)   { setError('Please confirm your consent to continue.'); return }
    setError('')
    setStatus('loading')
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, area, phone: phone.trim(), searchType: mode }),
      })
      if (res.status === 429) {
        setError('Too many searches. Please wait a few minutes and try again.')
        setStatus('idle'); return
      }
      if (!res.ok) throw new Error('Search failed')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const placeholder = mode === 'buy'
    ? 'e.g. Glenfiddich 12, Roku Gin, Desperados'
    : 'e.g. Hendricks Gin, Johnnie Walker Black, Hoegaarden'

  return (
    <>
      {status === 'success' && (
        <SuccessOverlay product={product} area={area} mode={mode} onClose={() => setStatus('idle')} />
      )}

      <form className="form-wrap" onSubmit={handleSubmit}>
        <div className={`field${productValid ? ' field--valid' : ''}`}>
          <label>What are you looking for?</label>
          <input
            type="text" value={product} required maxLength={200}
            onChange={e => setProduct(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            enterKeyHint="search"
          />
          {productValid && <span className="field-tick">✓</span>}
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
                <path d="M12 3C7.03 3 3 7.03 3 12c0 1.77.49 3.42 1.34 4.84L3 21l4.3-1.31A9 9 0 1012 3z" fill="#25D366"/>
                <path d="M9.2 7.8c-.2-.5-.7-.5-.9 0l-.6 1.4c-.1.3 0 .6.2.8.5.6 1.1 1.1 1.7 1.6.8.6 1.6 1.1 2.5 1.4.3.1.7 0 .9-.3l.8-1c.2-.3.5-.3.8-.1l1.8 1.1c.3.2.4.5.3.8-.3.9-1.1 1.8-2 1.8-2.5 0-6.2-3.5-6.2-6 0-.9.8-1.7 1.7-2z" fill="white"/>
              </svg>
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
