// Skeleton shown while BrowseSection loads from Supabase.
// Mirrors the browse-toggle button height so there is no layout shift.
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
    </section>
  )
}
