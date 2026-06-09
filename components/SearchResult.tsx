type Props = { product: string; area: string; mode: 'buy'|'drink' }
export default function SearchResult({ product, area, mode }: Props) {
  return (
    <div className="result-card">
      <div className="result-icon">✦</div>
      <h2 className="result-title">Your search is live.</h2>
      <p className="result-sub">
        We are checking {mode==='buy'?'stores':'venues'} in <strong>{area}</strong> for{' '}
        <strong>{product}</strong> right now.
        <br /><br />
        Expect a WhatsApp from us — typically within the hour.
        If nothing is confirmed available, we will add you to the watchlist
        and alert you the moment it surfaces.
      </p>
    </div>
  )
}
