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
    .select('ad_soyad, galeri_adi, phone, yetki_belge_no, vergi_levhasi_url, hesap_durumu, subscription_status, trial_ends_at, city, district, created_at')
    .eq('id', userId)
    .single()
  return { profile: data, error }
})

/**
 * ⚡ Request-scoped memoized listing count — checks how many active items
 * the user currently has to enforce subscription limits.
 */
export const getListingCount = cache(async (userId: string) => {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', userId)
    .eq('is_active', true)
  
  return { count: count || 0, error }
})
