// Suspense fallback for HeroContent (subtitle + mode toggle + form card).
// Holds the hero's vertical rhythm so the form card doesn't jump in when the
// client bundle hydrates.
export default function HeroSkeleton() {
  return (
    <div className="hero-skeleton" aria-hidden="true">
      {/* Subtitle lines */}
      <div className="skeleton-pulse skeleton-text" style={{ width: '90%', maxWidth: '380px', margin: '0 auto 10px' }} />
      <div className="skeleton-pulse skeleton-text" style={{ width: '70%', maxWidth: '300px', margin: '0 auto 32px' }} />

      {/* Mode toggle */}
      <div className="hero-skeleton-modes">
        <div className="skeleton-pulse skeleton-block" style={{ width: '120px', height: '40px' }} />
        <div className="skeleton-pulse skeleton-block" style={{ width: '120px', height: '40px' }} />
      </div>

      {/* Form card */}
      <div className="hero-skeleton-card">
        {[0, 1, 2].map(i => (
          <div key={i} className="hero-skeleton-field" style={{ '--i': i } as React.CSSProperties}>
            <div className="skeleton-pulse skeleton-text" style={{ width: '46%', height: '11px', marginBottom: '8px' }} />
            <div className="skeleton-pulse skeleton-block" style={{ width: '100%', height: '44px' }} />
          </div>
        ))}
        <div className="skeleton-pulse skeleton-block" style={{ width: '100%', height: '46px', marginTop: '14px' }} />
      </div>
    </div>
  )
}
