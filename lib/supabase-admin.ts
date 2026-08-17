// Service-role Supabase client for the WhatsApp search/notify loop
// (venues, user_searches, venue_queries — see lib/search-loop.ts).
//
// SUPABASE_SERVICE_ROLE_KEY must NOT have the NEXT_PUBLIC_ prefix. It bypasses
// Row Level Security entirely, so it must only ever be used in server-side
// code (API routes / Server Components) — never imported into a 'use client'
// component, and never logged. Get it from Supabase dashboard → Project
// Settings → API → service_role key (the "secret" one, not anon/publishable).
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
  }
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
