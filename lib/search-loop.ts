// Supabase-backed venue lookup + search/audit logging for the WhatsApp
// search/notify loop.
//
// Replaces the old Airtable-backed lib/airtable.ts (2026-08-17) — Airtable is
// no longer in the critical path for search -> WhatsApp notify. It can still
// be used manually for reporting/interfaces if useful, but nothing in the
// live app reads from or writes to it anymore.
//
// Uses the service-role client (lib/supabase-admin.ts) because venues,
// user_searches, and venue_queries hold venue/user phone numbers and have no
// public RLS policy — only server-side code with the service_role key can
// read or write them. The public `products` table (browse/autocomplete) is
// unaffected and keeps using the anon client in lib/supabase.ts.

import { createAdminClient } from './supabase-admin'

export interface Venue {
  id: string
  name: string
  whatsapp: string
}

// Normalises a stored phone value ("+91-98141-66666") down to the bare
// 10-digit form Interakt's API expects (no country code, no separators).
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  const last10 = digits.slice(-10)
  return /^[6-9]\d{9}$/.test(last10) ? last10 : null
}

// Active venues in an area (or all active venues for "Anywhere in Ludhiana").
// Capped by `limit` — notifying every venue in the city on every search is
// both a store-fatigue risk and an Interakt cost risk.
export async function getVenuesForArea(area: string, limit = 5): Promise<Venue[]> {
  try {
    const supabase = createAdminClient()
    let query = supabase
      .from('venues')
      .select('id, name, whatsapp_number')
      .eq('active', true)
      .limit(limit)

    if (area !== 'Anywhere in Ludhiana') {
      query = query.eq('area', area)
    }

    const { data, error } = await query
    if (error) {
      console.error('Supabase getVenuesForArea failed:', error)
      return []
    }

    return (data || [])
      .map((r) => {
        const phone = r.whatsapp_number ? normalisePhone(r.whatsapp_number) : null
        return phone ? { id: r.id as string, name: r.name as string, whatsapp: phone } : null
      })
      .filter((v): v is Venue => v !== null)
  } catch (e) {
    console.error('getVenuesForArea threw:', e)
    return []
  }
}

// Best-effort match against the catalogued (is_available = true) products.
// Non-blocking by design — a miss here should never stop a search from
// reaching stores. Matching only catalogued SKUs (not the 'Unreviewed'
// auto-captured ones) keeps the link meaningful rather than a search
// trivially "matching" its own just-inserted placeholder row.
export async function findMatchingProduct(productName: string): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('is_available', true)
      .ilike('name', `%${productName}%`)
      .limit(1)
      .maybeSingle()
    if (error) return null
    return (data?.id as string) ?? null
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
}): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('user_searches')
      .insert({
        user_phone: `+91${input.phone}`,
        raw_search_text: input.product,
        search_type: input.searchType,
        area: input.area,
        city: 'Ludhiana',
        status: input.status,
        matched_product_id: input.matchedProductId ?? null,
        source: 'Web',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Supabase createUserSearch failed:', error)
      return null
    }
    return (data?.id as string) ?? null
  } catch (e) {
    console.error('createUserSearch threw:', e)
    return null
  }
}

export async function createVenueQuery(input: {
  venueId: string
  userSearchId: string
  productId?: string | null
  interaktMessageId?: string | null
}): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('venue_queries').insert({
      venue_id: input.venueId,
      user_search_id: input.userSearchId,
      product_id: input.productId ?? null,
      status: 'Pending',
      interakt_message_id: input.interaktMessageId ?? null,
    })
    if (error) {
      // Non-fatal — the WhatsApp message already went out; losing the audit
      // record shouldn't surface as a failure to the end user.
      console.error('Supabase createVenueQuery failed:', error)
    }
  } catch (e) {
    console.error('createVenueQuery threw:', e)
  }
}
