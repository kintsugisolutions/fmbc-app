type Props = { product: string; area: string; mode: 'buy'|'drink' }
export default function SearchResult({ product, area, mode }: Props) {
  return (
    <div className="result-card">
      <div className="result-icon">
        <svg width="22" height="22" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M5 0 L6.1 3.9 L10 5 L6.1 6.1 L5 10 L3.9 6.1 L0 5 L3.9 3.9 Z" fill="currentColor" />
        </svg>
      </div>
      <h2 className="result-title">Your search is live.</h2>
      <p className="result-sub">
        We are checking {mode==='buy'?'stores':'venues'} in <strong>{area}</strong> for{' '}
        <strong>{product}</strong> right now.
        <br /><br />
        Expect a WhatsApp from us, typically within the hour.
        If nothing is confirmed today, we keep watching for 60 days and send
        you one WhatsApp the moment a store confirms it.
      </p>
    </div>
  )
}
