// Shared normalization for grouping likely-duplicate SKU search text before manual review.
// Purpose: the SAME product searched by different people comes in as different raw strings
// ("Jack Daniels", "jack daniel's 750ml", "JACK DANIELS  no.7") — without grouping, the
// review queue would show these as unrelated rows and a real duplicate could get approved
// twice under two different catalog entries. This is presentation-only: it never writes to
// the database or changes stored product names — approval always uses the exact stored name.
const VOLUME_TOKEN = /\b\d+(\.\d+)?\s*(ml|milliliter|milliliters|l|liter|liters|litre|litres|cl|oz|ounce|ounces)\b/gi
const PUNCTUATION = /['".,()\-_/\\]/g
const WHITESPACE = /\s+/g

export function normalizeSkuKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(VOLUME_TOKEN, ' ')
    .replace(PUNCTUATION, ' ')
    .replace(WHITESPACE, ' ')
    .trim()
}

export interface UnreviewedProduct {
  id: string
  name: string
  category: string
  search_count: number
  created_at: string
  reviewed_at: string | null
  merged_into_id: string | null
}

export interface ReviewGroup {
  key: string
  items: UnreviewedProduct[]
  totalSearchCount: number
  isNew: boolean
  latestCreatedAt: string
}

// Groups unreviewed products by normalized key and flags a group as NEW if any member
// was first captured after `since` (the dashboard_checkpoints watermark).
export function groupForReview(products: UnreviewedProduct[], since: string | null): ReviewGroup[] {
  const groups = new Map<string, UnreviewedProduct[]>()

  for (const p of products) {
    const key = normalizeSkuKey(p.name) || p.name.toLowerCase().trim()
    const existing = groups.get(key)
    if (existing) {
      existing.push(p)
    } else {
      groups.set(key, [p])
    }
  }

  const sinceMs = since ? new Date(since).getTime() : 0

  const result: ReviewGroup[] = []
  Array.from(groups.entries()).forEach(([key, items]) => {
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const totalSearchCount = items.reduce((sum: number, i) => sum + (i.search_count ?? 0), 0)
    const latestCreatedAt = items[0].created_at
    const isNew = items.some((i) => new Date(i.created_at).getTime() > sinceMs)
    result.push({ key, items, totalSearchCount, isNew, latestCreatedAt })
  })

  // Highest total demand first, so the review queue surfaces what's worth catalog-ing.
  result.sort((a, b) => b.totalSearchCount - a.totalSearchCount)
  return result
}
