'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'

// ─────────────────────────────────────────────────────────────────────────────
// Hard constraint (explicit user requirement, 2026-08-17): the products table is
// NEVER mutated except through these human-triggered actions. There is no
// automatic promotion path anywhere else in the codebase — the nightly cron job
// (app/api/cron/nightly-review/route.ts) only writes to review_runs, a log
// table, and never touches `products`. Every is_available flip below happens
// because a person clicked Approve in the dashboard.
//
// Note: CATEGORY_OPTIONS lives in ./constants.ts, not here — a 'use server' file
// can only export async functions, so a plain array export breaks the build.
// ─────────────────────────────────────────────────────────────────────────────

export async function approveProduct(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const category = String(formData.get('category') ?? '')
  const correctedName = String(formData.get('name') ?? '').trim()
  const mergeIdsRaw = String(formData.get('mergeIds') ?? '') // comma-separated sibling ids to fold in

  if (!id || !category) return

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

  const mergeIds = mergeIdsRaw.split(',').map((s) => s.trim()).filter((s) => s && s !== id)
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
  const id = String(formData.get('id') ?? '')
  if (!id) return

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
