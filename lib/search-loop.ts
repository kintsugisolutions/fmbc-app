// Supabase-backed venue lookup, search/audit logging, and reply-handling for
// the WhatsApp search/notify loop. This is the entire loop now — no Airtable,
// no n8n. Outbound (search -> venue notify) is used by app/api/search;
// inbound (store reply -> availability + searcher confirmation) is used by
// app/api/interakt-webhook.
//
// Uses the service-role client (lib/supabase-admin.ts) because venues,
// user_searches, venue_queries, and availability hold venue/user phone
// numbers and have no public RLS policy — only server-side code with the
// service_role key can read or write them. The public `products` table
// (browse/autocomplete) is unaffected and keeps using the anon client in
// lib/supabase.ts.

import { createAdminClient } from './supabase-admin'

export interface Venue {
  id: string
  name: string
  whatsapp: string
}

// Normalises a stored phone value ("+91-98141-66666" or "917003705584") down
// to the bare 10-digit form both Interakt's send API and our own matching
// logic expect (no country code, no separators).
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  const last10 = digits.slice(-10)
  return /^[6-9]\d{9}$/.test(last10) ? last10 : null
}

// ─── Outbound: search -> venue notify ──────────────────────────────────────

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

// ─── Inbound: store reply -> availability + searcher confirmation ─────────

export interface VenueQueryContext {
  venueQueryId: string
  venueId: string
  venueName: string
  productId: string | null
  productName: string | null
  userSearchId: string
  userPhone: string
  rawSearchText: string
}

// Finds the most recent still-open ('Pending') venue_queries row for whichever
// venue owns the phone number an inbound Interakt webhook reported.
//
// KNOWN LIMITATION: matches by "most recent Pending query for this venue",
// not by a per-message thread ID (Interakt's inbound payload doesn't include
// one that maps back to our template send). At current pilot volume (a
// handful of venues, low concurrent query volume) this is safe. If a venue
// ever has two genuinely concurrent open queries and replies ambiguously
// (e.g. just "1"), the reply could attach to the wrong one. Revisit if/when
// query volume per venue grows — the fix would be embedding a short
// reference code in the outbound template text and having stores reply with
// it, or tracking Interakt's message ID through to the reply if their API
// exposes a reply-to reference (not confirmed either way — check when
// Interakt access is live).
export async function findPendingQueryByVenuePhone(rawPhone: string): Promise<VenueQueryContext | null> {
  const phone = normalisePhone(rawPhone)
  if (!phone) return null

  try {
    const supabase = createAdminClient()

    // Small table at this stage (single/low-double-digit venue count) —
    // fetching active venues and matching phone format in JS avoids fragile
    // phone-format string matching in SQL.
    const { data: venues, error: venueErr } = await supabase
      .from('venues')
      .select('id, name, whatsapp_number')
      .eq('active', true)
    if (venueErr || !venues) return null

    const venue = venues.find((v) => normalisePhone(v.whatsapp_number as string) === phone)
    if (!venue) return null

    const { data: vq, error: vqErr } = await supabase
      .from('venue_queries')
      .select('id, product_id, user_search_id')
      .eq('venue_id', venue.id)
      .eq('status', 'Pending')
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (vqErr || !vq) return null

    const { data: userSearch, error: usErr } = await supabase
      .from('user_searches')
      .select('id, user_phone, raw_search_text')
      .eq('id', vq.user_search_id as string)
      .maybeSingle()
    if (usErr || !userSearch) return null

    let productName: string | null = null
    if (vq.product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', vq.product_id as string)
        .maybeSingle()
      productName = (product?.name as string) ?? null
    }

    return {
      venueQueryId: vq.id as string,
      venueId: venue.id as string,
      venueName: venue.name as string,
      productId: (vq.product_id as string) ?? null,
      productName,
      userSearchId: userSearch.id as string,
      userPhone: userSearch.user_phone as string,
      rawSearchText: userSearch.raw_search_text as string,
    }
  } catch (e) {
    console.error('findPendingQueryByVenuePhone threw:', e)
    return null
  }
}

export async function recordVenueReply(input: {
  venueQueryId: string
  status: 'Available' | 'Not Available' | 'Replied'
  rawReplyText: string
  repliedAt: string
}): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('venue_queries')
      .update({
        status: input.status,
        raw_reply_text: input.rawReplyText,
        replied_at: input.repliedAt,
      })
      .eq('id', input.venueQueryId)
    if (error) console.error('recordVenueReply failed:', error)
  } catch (e) {
    console.error('recordVenueReply threw:', e)
  }
}

// Upserts the confirmed-availability signal for a venue+product pair —
// distinct from venue_queries, which just tracks that a query was sent and
// what came back. This is the actual demand-intelligence asset: a real
// confirmation, timestamped, with a running count.
export async function upsertAvailability(input: { venueId: string; productId: string }): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { data: existing } = await supabase
      .from('availability')
      .select('id, confirmed_count')
      .eq('venue_id', input.venueId)
      .eq('product_id', input.productId)
      .maybeSingle()

    const nowIso = new Date().toISOString()

    if (existing) {
      await supabase
        .from('availability')
        .update({
          availability_type: 'Available',
          last_confirmed: nowIso,
          confirmed_count: ((existing.confirmed_count as number) ?? 0) + 1,
        })
        .eq('id', existing.id as string)
    } else {
      await supabase.from('availability').insert({
        venue_id: input.venueId,
        product_id: input.productId,
        availability_type: 'Available',
        last_confirmed: nowIso,
        confirmed_count: 1,
      })
    }
  } catch (e) {
    console.error('upsertAvailability threw:', e)
  }
}

// Atomically claims the "notify the searcher" right for a user_search — the
// first venue reply confirming availability wins; later confirmations from
// other venues still get logged via recordVenueReply/upsertAvailability but
// won't trigger a second WhatsApp message to the same searcher. The `neq`
// guard makes this a single conditional UPDATE rather than a read-then-write,
// so two near-simultaneous confirmations can't both "win".
export async function claimUserSearchConfirmation(userSearchId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('user_searches')
      .update({ status: 'Confirmed' })
      .eq('id', userSearchId)
      .neq('status', 'Confirmed')
      .select('id')
      .maybeSingle()
    if (error) {
      console.error('claimUserSearchConfirmation failed:', error)
      return false
    }
    return !!data
  } catch (e) {
    console.error('claimUserSearchConfirmation threw:', e)
    return false
  }
}
