// Server component — counts active stores in the FMBC network.
// Returns null when the stores table is empty (pre-launch).
import { createClient } from '@/lib/supabase'

export default async function StoreCount() {
  try {
    const supabase = createClient()
    const { count, error } = await supabase
      .from('stores')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    if (error || !count || count === 0) return null

    return (
      <span className="nav-store-count mono">
        {count} verified store{count !== 1 ? 's' : ''}
      </span>
    )
  } catch {
    return null
  }
}
