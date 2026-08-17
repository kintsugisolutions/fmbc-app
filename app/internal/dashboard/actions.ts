'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireInternalSession } from '@/lib/internal-session'
import { CATEGORY_OPTIONS } from './constants'

// ─────────────────────────────────────────────────────────────────────────────
// Hard constraint (explicit user requirement, 2026-08-17): the products table is
// NEVER mutated except through these human-triggered actions. There is no
// automatic promotion path anywhere else in the codebase — the nightly cron job
// (app/api/cron/nightly-review/route.ts) only writes to review_runs, a log
// table, and never touches `products`. Every is_available flip below happens
// because a person clicked Approve in the dashboard.
//
// SECURITY (2026-08-17): every action below starts with requireInternalSession().
// Do not remove it and do not rely on middleware.ts alone — Server Actions are
// reachable by POSTing an action ID to ANY route, including public ones, so the
// pathname-based middleware gate does not cover them. See lib/internal-session.ts.
//
// Note: CATEGORY_OPTIONS lives in ./constants.ts, not here — a 'use server' file
// can only export async functions, so a plain array export breaks the build.
// ─────────────────────────────────────────────────────────────────────────────

// Supabase ids are uuids; reject anything else before it reaches a query.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const MAX_NAME_LENGTH = 200

export async function approveProduct(formData: FormData) {
  await requireInternalSession()

  const id = String(formData.get('id') ?? '')
  const category = String(formData.get('category') ?? '')
  const correctedName = String(formData.get('name') ?? '').trim()
  const mergeIdsRaw = String(formData.get('mergeIds') ?? '') // comma-separated sibling ids to fold in

  if (!UUID_RE.test(id)) {
    console.error('approveProduct: rejected malformed id')
    return
  }

  // Category must be one of the known options — this column has no DB-level
  // enum, so this is the only thing stopping arbitrary text landing in the
  // public catalog's category field.
  if (!(CATEGORY_OPTIONS as readonly string[]).includes(category)) {
    console.error(`approveProduct: rejected unknown category ${JSON.stringify(category)}`)
    return
  }

  if (correctedName.length > MAX_NAME_LENGTH) {
    console.error('approveProduct: rejected over-long name')
    return
  }

  const supabase = createAdminClient()

  const update: Record<string, unknown> = {
    is_available: true,
    category,
    reviewed_at: new Date().toISOString(),
  }
  if (correctedName) update.name = correctedName

  const { error: approveErr } = await supabase.from('products').update(update).eq('id', id)
  if (approveErr) {
    console.error('approveProduct: failed to update target', approveErr.message)
    return
  }

  const mergeIds = mergeIdsRaw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s !== id && UUID_RE.test(s))

  if (mergeIds.length > 0) {
    const { error: mergeErr } = await supabase
      .from('products')
      .update({ merged_into_id: id, reviewed_at: new Date().toISOString() })
      .in('id', mergeIds)
    if (mergeErr) {
      console.error('approveProduct: failed to fold siblings', mergeErr.message)
    }
  }

  revalidatePath('/internal/dashboard')
}

export async function rejectProduct(formData: FormData) {
  await requireInternalSession()

  const id = String(formData.get('id') ?? '')
  if (!UUID_RE.test(id)) {
    console.error('rejectProduct: rejected malformed id')
    return
  }

  const supabase = createAdminClient()
  // is_available stays false — this just marks it reviewed-and-dismissed so it
  // stops cluttering the queue. Row is kept (not deleted) so if the same term
  // gets searched again, search_count still increments on it rather than
  // spawning a fresh "new" row every time.
  const { error } = await supabase
    .from('products')
    .update({ reviewed_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('rejectProduct: failed', error.message)
  }

  revalidatePath('/internal/dashboard')
}

// Marks the review queue as "seen" so NEW badges reset — call when the user has
// looked over the current queue. Does not touch products at all, only the
// dashboard_checkpoints watermark.
export async function markQueueSeen() {
  await requireInternalSession()

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('dashboard_checkpoints')
    .update({ last_reviewed_queue_view_at: new Date().toISOString() })
    .eq('id', 1)

  if (error) {
    console.error('markQueueSeen: failed', error.message)
  }

  revalidatePath('/internal/dashboard')
}
