// Server component — sums search_count across all products.
// Rendered fresh each request; returns null if total is 0 (early launch, no data yet).
import { createClient } from '@/lib/supabase'

export default async function LiveSearchCounter() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .select('search_count')

    if (error || !data) return null

    const total = data.reduce((sum, p) => sum + (p.search_count ?? 0), 0)
    if (total === 0) return null

    return (
      <p className="search-counter mono" aria-live="polite">
        <span className="counter-dot" aria-hidden="true" />
        {total.toLocaleString('en-IN')} searches placed
      </p>
    )
  } catch {
    return null
  }
}
