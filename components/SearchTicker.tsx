// Seeded live-activity ticker — makes the platform feel active during early launch.
// aria-hidden so screen readers skip the decorative marquee.

const TICKER_ITEMS = [
  { sku: 'Glenfiddich 12',       area: 'Model Town',     time: '3 min ago'  },
  { sku: 'Heineken 650ml',       area: 'Sarabha Nagar',  time: '7 min ago'  },
  { sku: 'Johnnie Walker Black', area: 'BRS Nagar',      time: '12 min ago' },
  { sku: 'Bira 91 White',        area: 'Civil Lines',    time: '18 min ago' },
  { sku: 'Roku Gin',             area: 'Dugri',          time: '24 min ago' },
  { sku: 'Absolut Vodka',        area: 'Pakhowal Road',  time: '31 min ago' },
  { sku: 'Old Monk 750ml',       area: 'Gurdev Nagar',   time: '38 min ago' },
  { sku: 'Jameson Irish',        area: 'Ferozepur Road', time: '45 min ago' },
]

export default function SearchTicker() {
  // Duplicate items so the marquee loops seamlessly
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]

  return (
    <div className="ticker-wrap" aria-hidden="true">
      <div className="ticker-track">
        {items.map((item, i) => (
          <span key={i} className="ticker-item mono">
            <span className="ticker-sku">{item.sku}</span>
            <span className="ticker-sep">·</span>
            <span className="ticker-area">{item.area}</span>
            <span className="ticker-sep">·</span>
            <span className="ticker-time">{item.time}</span>
            <span className="ticker-divider" aria-hidden="true">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
