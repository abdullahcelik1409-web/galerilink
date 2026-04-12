import { createClient } from "@/lib/supabase/server"
import { formatLocation } from "@/lib/utils"
import { getAuthUser, getProfile } from "@/lib/supabase/auth-cache"
import { DashboardClient } from "./dashboard-client"

export const metadata = {
  title: "Ağdaki Araçlar - GaleriLink",
}

export default async function DashboardPage() {
  // ⚡ Perf: Memoized — layout already resolved this, zero extra Supabase call
  const { user } = await getAuthUser()
  
  if (!user) return null

  // ⚡ Perf: Single Supabase call for cars — profile comes from cache
  const supabase = await createClient()
  
  const [carsResult, profileResult] = await Promise.all([
    supabase
      .from('cars')
      .select(`
        id, seller_id, title, brand, model, year, km, price_b2b, images,
        location_city, location_district, is_opportunity, opportunity_expires_at,
        opportunity_reason, package_id, is_active, created_at, masked_slug,
        profiles:seller_id (
          company_name,
          city,
          district,
          phone
        )
      `)
      .eq('is_active', true)
      .order('is_opportunity', { ascending: false })
      .order('created_at', { ascending: false })
      .range(0, 23), // ⚡ Perf: First 24 cars only — load more client-side
    getProfile(user.id) // ⚡ Perf: Memoized — already fetched in layout
  ])

  if (carsResult.error) {
    console.error('Performance Engine Query Error:', carsResult.error.message)
  }

  const userCity = formatLocation(profileResult.profile?.city || "Belirtilmemiş")
  const userDistrict = formatLocation(profileResult.profile?.district || "Belirtilmemiş")

  // Map response — only first image URL for card thumbnails
  const mappedCars = carsResult.data?.map((car: any) => ({
    ...car,
    offer_count: 0
  })) || []

  return (
    <DashboardClient 
      cars={mappedCars} 
      userCity={userCity} 
      userDistrict={userDistrict} 
    />
  )
}
