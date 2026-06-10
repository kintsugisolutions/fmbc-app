// "Trending in Ludhiana" ticker — curated popular SKUs, honestly labelled.
// Deliberately NO fake timestamps or fabricated live activity: presenting seeded
// data as real-time searches is an ASCI-misleading-advertising risk and a trust
// break if noticed. Once real search volume exists in Supabase, this list can be
// driven by actual top-searched products (see LiveSearchCounter for the pattern).
// aria-hidden so screen readers skip the decorative marquee.

const TICKER_ITEMS = [
  'Glenfiddich 12',
  'Heineken 650ml',
  'Johnnie Walker Black',
  'Bira 91 White',
  'Roku Gin',
  'Absolut Vodka',
  'Old Monk 750ml',
  'Jameson Irish',
]

export default function SearchTicker() {
  // Duplicate items so the marquee loops seamlessly
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]

  return (
    <div className="ticker-block">
      <p className="ticker-label mono">Trending in Ludhiana</p>
      <div className="ticker-wrap" aria-hidden="true">
        <div className="ticker-track">
          {items.map((sku, i) => (
            <span key={i} className="ticker-item mono">
              <span className="ticker-sku">{sku}</span>
              <span className="ticker-divider" aria-hidden="true">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
