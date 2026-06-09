import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// NEXT_PUBLIC_ prefix: the anon key is safe to expose (Supabase RLS is the access control layer).
// Both server components and client components can import this.
const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
