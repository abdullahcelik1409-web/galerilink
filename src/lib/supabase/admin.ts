import { createClient } from '@supabase/supabase-js'

/**
 * ⚠️ DANGER: This client uses the SERVICE_ROLE_KEY.
 * It bypasses RLS and should ONLY be used in Server Components/Actions
 * with strict authorization checks.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase admin environment variables are missing.')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
