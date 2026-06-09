// Server Component — fetches product data from Supabase at request time.
// No client-side JS; data is passed to BrowseClient for interactivity.
import { createClient } from '@/lib/supabase'
import BrowseClient from './BrowseClient'

export type Product = {
  id:           string
  name:         string
  category:     string
  slug:         string | null
  search_count: number
}

// Controls category display order in the browse UI
export const CATEGORY_ORDER = ['Whisky', 'Beer', 'Gin', 'Vodka', 'Rum', 'Tequila & Others']

export default async function BrowseSection() {
  let products: Product[] = []

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .select('id, name, category, slug, search_count')
      .eq('is_available', true)
      .order('search_count', { ascending: false })

    if (error) throw error
    if (data) products = data as Product[]
  } catch {
    // Browse is non-critical — if Supabase is unreachable, the section simply doesn't render.
    return null
  }

  if (products.length === 0) return null

  // Group products by category
  const grouped: Record<string, Product[]> = {}
  for (const p of products) {
    if (!grouped[p.category]) grouped[p.category] = []
    grouped[p.category].push(p)
  }

  const categories = CATEGORY_ORDER.filter(c => grouped[c])

  return <BrowseClient grouped={grouped} categories={categories} />
}
