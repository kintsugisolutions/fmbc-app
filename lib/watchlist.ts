import { createAdminClient } from '@/lib/supabase-admin'
import { normalizeSkuKey } from '@/lib/normalize-sku'
import { sendWhatsAppTemplate } from '@/lib/interakt'
import { normalisePhone } from '@/lib/search-loop'

// ─── Watchlist ───────────────────────────────────────────────────────────────
// "Tell me when this SKU shows up in my area."
//
// Every search creates one Active watchlist row. When a venue later confirms
// that product is in stock, everyone still waiting on that normalised SKU key
// in a matching area gets one WhatsApp — then their row flips to 'Notified' and
// is done. One notification per row, ever.
//
// Two deliberate safety limits, because store response rate and user trust are
// the fragile parts of this system:
//   • MAX_NOTIFY_PER_EVENT caps the fan-out per confirmation, so one popular
//     SKU confirming can't trigger an unbounded WhatsApp blast (cost + the
//     risk of looking like spam to Meta).
//   • Rows expire after 60 days (see the expires_at default and
//     expireStaleWatchlistEntries below) — a two-month-old intent is not live,
//     and messaging someone about it is worse than staying quiet.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_NOTIFY_PER_EVENT = 10

const WATCHLIST_TEMPLATE_NAME =
  process.env.INTERAKT_WATCHLIST_TEMPLATE_NAME || 'watchlist_available'

/**
 * Records a standing interest in a SKU. Best-effort and non-blocking by
 * design: a watchlist failure must never break the search itself, so every
 * path here swallows its error after logging.
 *
 * Duplicate Active rows for the same (phone, key, area) are prevented by a
 * partial unique index; hitting it is normal (someone re-searching) and is
 * treated as success rather than an error.
 */
export async function createWatchlistEntry(input: {
  phone: string // bare 10-digit, as passed to createUserSearch
  product: string
  area: string
  productId?: string | null
  userSearchId?: string | null
}): Promise<void> {
  const normalizedKey = normalizeSkuKey(input.product)
  if (!normalizedKey) return

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('watchlists').insert({
      user_phone: `+91${input.phone}`,
      raw_search_text: input.product,
      normalized_key: normalizedKey,
      product_id: input.productId ?? null,
      area: input.area,
      city: 'Ludhiana',
      status: 'Active',
      source_user_search_id: input.userSearchId ?? null,
    })

    // 23505 = unique_violation — they're already waiting on this. Not an error.
    if (error && error.code !== '23505') {
      console.error('createWatchlistEntry failed:', error.message)
    }
  } catch (e) {
    console.error('createWatchlistEntry threw (non-blocking):', e)
  }
}

/**
 * Marks the watchlist row belonging to the person who made THIS search as
 * resolved, so the confirmation they already received for their own search
 * isn't followed by a second "it's available!" message from the watchlist.
 */
export async function resolveWatchlistForSearch(
  userSearchId: string,
  venueId: string
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('watchlists')
      .update({
        status: 'Notified',
        notified_at: new Date().toISOString(),
        notified_venue_id: venueId,
      })
      .eq('source_user_search_id', userSearchId)
      .eq('status', 'Active')
    if (error) console.error('resolveWatchlistForSearch failed:', error.message)
  } catch (e) {
    console.error('resolveWatchlistForSearch threw:', e)
  }
}

/**
 * Notifies everyone waiting on this SKU in a matching area that a venue has
 * confirmed it, then marks them Notified.
 *
 * Area matching: a watcher hears about it if they asked for this specific area
 * or if they asked for "Anywhere in Ludhiana". A watcher who named a different
 * area is intentionally NOT notified — a confirmation in Dugri is not useful to
 * someone who asked about Model Town, and messaging them anyway is how a
 * useful alert becomes noise.
 *
 * Returns how many people were notified (for logging/dashboard).
 */
export async function notifyWatchersForConfirmation(input: {
  productId: string | null
  productName: string | null
  rawSearchText: string
  venueId: string
  venueName: string
  excludeUserSearchId?: string | null
}): Promise<number> {
  const normalizedKey = normalizeSkuKey(input.productName ?? input.rawSearchText)
  if (!normalizedKey) return 0

  try {
    const supabase = createAdminClient()

    // Which area is this venue in? Watchers who named a different area don't
    // get pinged.
    const { data: venue } = await supabase
      .from('venues')
      .select('area')
      .eq('id', input.venueId)
      .maybeSingle()
    const venueArea = (venue?.area as string) ?? null

    let query = supabase
      .from('watchlists')
      .select('id, user_phone, raw_search_text, source_user_search_id')
      .eq('status', 'Active')
      .eq('normalized_key', normalizedKey)
      .gt('expires_at', new Date().toISOString())
      .limit(MAX_NOTIFY_PER_EVENT)

    if (venueArea) {
      query = query.in('area', [venueArea, 'Anywhere in Ludhiana'])
    } else {
      query = query.eq('area', 'Anywhere in Ludhiana')
    }

    const { data: watchers, error } = await query
    if (error) {
      console.error('notifyWatchersForConfirmation lookup failed:', error.message)
      return 0
    }
    if (!watchers || watchers.length === 0) return 0

    // The person whose own search triggered this already got a confirmation
    // message from the webhook — don't message them twice.
    const targets = watchers.filter(
      (w) => !input.excludeUserSearchId || w.source_user_search_id !== input.excludeUserSearchId
    )
    if (targets.length === 0) return 0

    const displayName = input.productName ?? input.rawSearchText
    const notifiedIds: string[] = []

    for (const watcher of targets) {
      const phone = normalisePhone(watcher.user_phone as string)
      if (!phone) {
        console.error(`Watchlist: phone didn't normalise for entry ${watcher.id}`)
        continue
      }
      // Requires a Meta-approved template named WATCHLIST_TEMPLATE_NAME
      // (default "watchlist_available") with two body variables:
      // product, venue name.
      const result = await sendWhatsAppTemplate(phone, WATCHLIST_TEMPLATE_NAME, [
        displayName,
        input.venueName,
      ])
      if (result.success) {
        notifiedIds.push(watcher.id as string)
      } else {
        // Leave the row Active so a later confirmation can retry it, rather
        // than silently marking someone notified who never got a message.
        console.error(`Watchlist notify failed for entry ${watcher.id}:`, result.error)
      }
    }

    if (notifiedIds.length > 0) {
      const { error: markErr } = await supabase
        .from('watchlists')
        .update({
          status: 'Notified',
          notified_at: new Date().toISOString(),
          notified_venue_id: input.venueId,
        })
        .in('id', notifiedIds)
      if (markErr) console.error('Watchlist: failed to mark notified:', markErr.message)
    }

    return notifiedIds.length
  } catch (e) {
    console.error('notifyWatchersForConfirmation threw:', e)
    return 0
  }
}

/**
 * Signal decay. Called by the nightly cron. Flips Active rows past their
 * expires_at to 'Expired' so nobody gets messaged about a two-month-old want.
 * Returns how many were expired.
 */
export async function expireStaleWatchlistEntries(): Promise<number> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('watchlists')
      .update({ status: 'Expired' })
      .eq('status', 'Active')
      .lt('expires_at', new Date().toISOString())
      .select('id')

    if (error) {
      console.error('expireStaleWatchlistEntries failed:', error.message)
      return 0
    }
    return data?.length ?? 0
  } catch (e) {
    console.error('expireStaleWatchlistEntries threw:', e)
    return 0
  }
}
