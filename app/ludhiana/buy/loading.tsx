import Nav from '@/components/Nav'

// Route-level loading UI for the /ludhiana/buy/* SEO pages.
// Mirrors the seo-hero (city tag + h1), two info cards, and the closing CTA so
// the layout is stable before the static content streams in.
export default function Loading() {
  return (
    <>
      <Nav />
      <main>
        <div className="seo-page container" aria-busy="true">
          <div className="seo-hero">
            <div className="skeleton-pulse skeleton-text" style={{ width: '140px', height: '11px', marginBottom: '16px' }} />
            <div className="skeleton-pulse skeleton-text" style={{ width: '85%', maxWidth: '420px', height: '30px', marginBottom: '12px' }} />
            <div className="skeleton-pulse skeleton-text" style={{ width: '95%', height: '13px', marginBottom: '8px' }} />
            <div className="skeleton-pulse skeleton-text" style={{ width: '60%', height: '13px' }} />
          </div>

          {[0, 1].map(i => (
            <div key={i} className="seo-card" style={{ '--i': i } as React.CSSProperties}>
              <div className="skeleton-pulse skeleton-text" style={{ width: '55%', height: '15px', marginBottom: '10px' }} />
              <div className="skeleton-pulse skeleton-text" style={{ width: '100%', height: '12px', marginBottom: '6px' }} />
              <div className="skeleton-pulse skeleton-text" style={{ width: '80%', height: '12px' }} />
            </div>
          ))}

          <div className="seo-cta">
            <div className="skeleton-pulse skeleton-text" style={{ width: '60%', maxWidth: '240px', height: '18px', margin: '0 auto 14px' }} />
            <div className="skeleton-pulse skeleton-text" style={{ width: '90%', maxWidth: '360px', height: '12px', margin: '0 auto 20px' }} />
            <div className="skeleton-pulse skeleton-block" style={{ width: '140px', height: '42px', margin: '0 auto' }} />
          </div>
        </div>
      </main>
    </>
  )
}
