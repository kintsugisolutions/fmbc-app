import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// ─────────────────────────────────────────────────────────────────────────────
// Nightly review job. This is a LOG-ONLY job by explicit design (2026-08-17
// requirement): "No publishing until reviewed by me." It counts unreviewed
// search terms and writes ONE row to review_runs. It never updates, inserts,
// or deletes anything in `products` — no is_available flips, no new rows, no
// auto-merge. All actual publishing happens only through a human clicking
// Approve in /internal/dashboard (see app/internal/dashboard/actions.ts).
//
// Auth: Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on
// cron-triggered invocations when CRON_SECRET is set as an env var — we check
// it here so this endpoint can't be hit by anyone who finds the URL.
// https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
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
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
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

  const { error: insertErr } = await supabase.from('review_runs').insert({
    total_unreviewed: (unreviewed ?? []).length,
    new_since_last_run: newSinceLastRun,
    notes: 'log-only run — no products modified',
  })

  if (insertErr) {
    console.error('nightly-review: log insert failed', insertErr.message)
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    total_unreviewed: (unreviewed ?? []).length,
    new_since_last_run: newSinceLastRun,
  })
}
