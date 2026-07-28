// Airtable REST client for the "Plan B" direct-notify path (bypasses n8n entirely).
//
// Why this exists: the n8n Cloud workspace that used to own venue-matching +
// WhatsApp notification was deleted when its free trial lapsed, with no
// workflow export on hand to restore from. This talks to the same
// "Punjab Alcohol Availability Tracker" Airtable base (appeXSJa3SdeFzGcI)
// directly from Next.js, so a repeat of that failure mode doesn't take the
// whole search loop down with it.
//
// Requires AIRTABLE_API_KEY (a Personal Access Token with read/write scope
// on this base) set in Vercel env vars. Never hardcode the token — only the
// base/table IDs below, which are not secrets.

const AIRTABLE_API_URL = 'https://api.airtable.com/v0'
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appeXSJa3SdeFzGcI'

const VENUES_TABLE = 'tblJIkI44iLarwzt9'
const USER_SEARCHES_TABLE = 'tbl3RbBeWab7tF74V'
const VENUE_QUERIES_TABLE = 'tblrAOwnc6kXv1nr2'
const PRODUCTS_TABLE = 'tblbReEGYNevB6q34'

function authHeaders(): Record<string, string> {
  const key = process.env.AIRTABLE_API_KEY
  if (!key) throw new Error('AIRTABLE_API_KEY not configured')
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

// Airtable formulas are string-interpolated — escape quotes/backslashes to
// prevent a crafted product/area string from breaking out of the formula.
function escapeFormulaString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export interface Venue {
  id: string
  name: string
  whatsapp: string
}

// Normalises Airtable's stored phone format ("+91-98141-66666") down to the
// bare 10-digit form Interakt's API expects (no country code, no separators).
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  const last10 = digits.slice(-10)
  return /^[6-9]\d{9}$/.test(last10) ? last10 : null
}

// Active venues in an area (or all active venues for "Anywhere in Ludhiana").
// Capped by `limit` — notifying every venue in the city on every search is
// both a store-fatigue risk and an Interakt cost risk.
export async function getVenuesForArea(area: string, limit = 5): Promise<Venue[]> {
  const filterByFormula =
    area === 'Anywhere in Ludhiana'
      ? '{Active} = 1'
      : `AND({Active} = 1, {Area} = "${escapeFormulaString(area)}")`

  const params = new URLSearchParams({
    filterByFormula,
    maxRecords: String(limit),
  })
  params.append('fields[]', 'Venue Name')
  params.append('fields[]', 'WhatsApp Number')

  const res = await fetch(`${AIRTABLE_API_URL}/${BASE_ID}/${VENUES_TABLE}?${params}`, {
    headers: authHeaders(),
  })
  if (!res.ok) {
    console.error('Airtable getVenuesForArea failed:', res.status, await res.text())
    return []
  }
  const data = await res.json()
  return (data.records || [])
    .map((r: any) => {
      const rawPhone = r.fields['WhatsApp Number']
      const phone = rawPhone ? normalisePhone(String(rawPhone)) : null
      return phone ? { id: r.id, name: r.fields['Venue Name'], whatsapp: phone } : null
    })
    .filter(Boolean) as Venue[]
}

// Best-effort fuzzy match against the Products table. Non-blocking by design —
// a miss here should never stop a search from reaching stores.
export async function findMatchingProduct(productName: string): Promise<string | null> {
  const filterByFormula = `SEARCH(LOWER("${escapeFormulaString(productName)}"), LOWER({Product Name})) > 0`
  const params = new URLSearchParams({ filterByFormula, maxRecords: '1' })
  try {
    const res = await fetch(`${AIRTABLE_API_URL}/${BASE_ID}/${PRODUCTS_TABLE}?${params}`, {
      headers: authHeaders(),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.records?.[0]?.id ?? null
  } catch (e) {
    console.warn('findMatchingProduct failed (non-blocking):', e)
    return null
  }
}

export async function createUserSearch(input: {
  phone: string
  product: string
  searchType: 'Buy a Bottle' | 'Drink Now'
  area: string
  status: 'Queries Sent' | 'Not Found'
  matchedProductId?: string | null
  matchedVenueIds?: string[]
}): Promise<string | null> {
  const fields: Record<string, unknown> = {
    'User Phone': `+91${input.phone}`,
    'Raw Search Text': input.product,
    'Search Type': input.searchType,
    Area: input.area,
    City: 'Ludhiana',
    Status: input.status,
    Source: 'Web',
    'Notified Timestamp': new Date().toISOString(),
  }
  if (input.matchedProductId) fields['Matched Product'] = [input.matchedProductId]
  if (input.matchedVenueIds?.length) fields['Matched Venue'] = input.matchedVenueIds

  const res = await fetch(`${AIRTABLE_API_URL}/${BASE_ID}/${USER_SEARCHES_TABLE}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) {
    console.error('Airtable createUserSearch failed:', res.status, await res.text())
    return null
  }
  const data = await res.json()
  return data.id ?? null
}

export async function createVenueQuery(input: {
  venueId: string
  userSearchId: string
  productId?: string | null
  interaktMessageId?: string | null
}): Promise<void> {
  const fields: Record<string, unknown> = {
    Venue: [input.venueId],
    'User Search': [input.userSearchId],
    Status: 'Pending',
  }
  if (input.productId) fields['Product'] = [input.productId]
  if (input.interaktMessageId) fields['Interakt Message ID'] = input.interaktMessageId

  const res = await fetch(`${AIRTABLE_API_URL}/${BASE_ID}/${VENUE_QUERIES_TABLE}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) {
    // Non-fatal — the WhatsApp message already went out; losing the audit
    // record shouldn't surface as a failure to the end user.
    console.error('Airtable createVenueQuery failed:', res.status, await res.text())
  }
}
