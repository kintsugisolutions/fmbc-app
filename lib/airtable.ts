// DEPRECATED 2026-08-17 — the WhatsApp search/notify loop no longer uses
// Airtable. See lib/search-loop.ts (venues/searches/queries, Supabase-backed)
// and lib/supabase.ts (public products catalog, anon client).
//
// This file is left in place only so any stray import fails loudly at build
// time instead of silently reaching Airtable. Once you've confirmed nothing
// imports from '@/lib/airtable' anymore (grep the repo), delete this file
// and drop AIRTABLE_API_KEY / AIRTABLE_BASE_ID from your env vars.
export {}
throw new Error(
  "lib/airtable.ts is deprecated and should no longer be imported — the search loop now uses lib/search-loop.ts. If you're seeing this at runtime, find the stray import and switch it."
)
