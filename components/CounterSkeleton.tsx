// Suspense fallback for LiveSearchCounter — a single pill placeholder that
// holds the counter's slot while the Supabase tally resolves.
export default function CounterSkeleton() {
  return (
    <div className="counter-skeleton" aria-hidden="true">
      <div className="skeleton-pulse skeleton-pill" style={{ width: '120px', height: '20px' }} />
    </div>
  )
}
