import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { expireStaleWatchlistEntries } from '@/lib/watchlist'

// ─────────────────────────────────────────────────────────────────────────────
// Nightly maintenance job.
//
// The review half is LOG-ONLY by explicit design (2026-08-17 requirement:
// "No publishing until reviewed by me"). It counts unreviewed search terms and
// writes ONE row to review_runs. It never updates, inserts, or deletes anything
// in `products` — no is_available flips, no new rows, no auto-merge. All actual
// publishing happens only through a human clicking Approve in
// /internal/dashboard (see app/internal/dashboard/actions.ts).
//
// The one thing this job DOES mutate is watchlist signal decay: Active
// watchlist rows past their 60-day expiry flip to 'Expired'. That is
// deliberately not the same category of write — it only ever stops a
// notification from being sent, never publishes anything or makes a claim about
// stock, so it cannot violate the review constraint.
//
// Auth: Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on
// cron-triggered invocations when CRON_SECRET is set as an env var. This check
// FAILS CLOSED — a missing secret returns 500 rather than leaving the endpoint
// open, so a misconfigured env var surfaces loudly instead of silently
// disabling auth.
// https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('CRON_SECRET is not set — refusing to run the nightly job unauthenticated')
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 })
  }

  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: unreviewed, error: fetchErr } = await supabase
    .from('products')
    .select('id, created_at')
    .eq('category', 'Unreviewed')
    .is('reviewed_at', null)
    .is('merged_into_id', null)

  if (fetchErr) {
    console.error('nightly-review: fetch failed', fetchErr.message)
    return NextResponse.json({ error: 'query failed' }, { status: 500 })
  }

  const { data: checkpoint } = await supabase
    .from('dashboard_checkpoints')
    .select('last_reviewed_queue_view_at')
    .eq('id', 1)
    .maybeSingle()

  const since = checkpoint?.last_reviewed_queue_view_at
  const sinceMs = since ? new Date(since).getTime() : 0
  const newSinceLastRun = (unreviewed ?? []).filter(
    (p) => new Date(p.created_at).getTime() > sinceMs
  ).length

  // Signal decay — see lib/watchlist.ts.
  const expiredWatchlistCount = await expireStaleWatchlistEntries()

  const { error: insertErr } = await supabase.from('review_runs').insert({
    total_unreviewed: (unreviewed ?? []).length,
    new_since_last_run: newSinceLastRun,
    notes: `log-only review; expired ${expiredWatchlistCount} stale watchlist entries`,
  })

  if (insertErr) {
    console.error('nightly-review: log insert failed', insertErr.message)
    return NextResponse.json({ error: 'log write failed' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    total_unreviewed: (unreviewed ?? []).length,
    new_since_last_run: newSinceLastRun,
    watchlist_expired: expiredWatchlistCount,
  })
}
