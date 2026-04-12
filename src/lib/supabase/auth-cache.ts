import { cache } from 'react'
import { createClient } from './server'

/**
 * ⚡ Request-scoped memoized auth — prevents duplicate Supabase auth calls
 * within the same server request (layout + page + components).
 * React `cache()` deduplicates within a single RSC render pass.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
})

/**
 * ⚡ Request-scoped memoized profile fetch — runs once per request
 * even if called from both layout and page.
 */
export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('company_name, city, district, phone, status, subscription_status, trial_ends_at')
    .eq('id', userId)
    .single()
  return { profile: data, error }
})
