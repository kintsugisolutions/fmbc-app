// Server component — shows total cumulative searches as a trust signal in the hero.
// Pulls the real sum of search_count from the products table via Supabase.
// Returns null when the total is 0 (pre-launch / empty DB) so nothing shows
// until there is real data to back the claim.
import { createClient } from '@/lib/supabase'

export default async function LiveSearchCounter() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .select('search_count')

    if (error || !data) return null

    const total = data.reduce((sum, row) => sum + (row.search_count ?? 0), 0)
    if (total === 0) return null

    return (
      <p className="search-counter mono" aria-live="polite">
        <span className="counter-dot" aria-hidden="true" />
        {total.toLocaleString('en-IN')} searches and counting
      </p>
    )
  } catch {
    // Non-critical — fail silently rather than breaking the hero
    return null
  }
}
