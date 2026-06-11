// Skeleton shown while BrowseSection loads from Supabase.
// Mirrors the open browse panel — toggle row, category pills, bottle list, hint —
// so there is no layout shift when the real list resolves. Each pulse element
// carries an --i index so the shimmer ripples across the group (wave stagger).
export default function BrowseSkeleton() {
  return (
    <section
      className="browse-section"
      aria-label="Loading available bottles"
      aria-busy="true"
    >
      <div className="browse-toggle browse-toggle--skeleton">
        <div className="skeleton-pulse skeleton-text" style={{ width: '240px' }} />
        <div className="skeleton-pulse skeleton-icon" />
      </div>

      <div className="browse-body">
        {/* Category pills */}
        <div className="browse-cats">
          {[88, 64, 60, 96].map((w, i) => (
            <div
              key={i}
              className="skeleton-pulse skeleton-pill"
              style={{ width: `${w}px`, '--i': i } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Bottle list */}
        <ul className="browse-list">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <div
                className="skeleton-pulse skeleton-block browse-item--skeleton"
                style={{ '--i': i } as React.CSSProperties}
              />
            </li>
          ))}
        </ul>

        <div
          className="skeleton-pulse skeleton-text"
          style={{ width: '70%', maxWidth: '320px', margin: '0 auto', height: '11px' }}
        />
      </div>
    </section>
  )
}
