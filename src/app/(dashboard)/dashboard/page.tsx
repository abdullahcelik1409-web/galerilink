import { createClient } from "@/lib/supabase/server"
import { formatLocation } from "@/lib/utils"
import { DashboardClient } from "./dashboard-client"

export const metadata = {
  title: "Ağdaki Araçlar - GaleriLink",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // 🚀 Optimized Fetch: Single RPC call handles multi-table join, city filtering, and district-priority sorting.
  const { data: cars, error } = await supabase.rpc('fetch_cars_optimized', { 
    p_user_id: user.id 
  })

  if (error) {
    console.error('Performance Engine RPC Error Detail:', error.message)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('city, district')
    .eq('id', user.id)
    .single()

  const userCity = formatLocation(profile?.city || "Belirtilmemiş")
  const userDistrict = formatLocation(profile?.district || "Belirtilmemiş")

  // Map flat RPC response
  const mappedCars = cars?.map((car: any) => ({
    id: car.res_id,
    created_at: car.res_created_at,
    title: car.res_title,
    brand: car.res_brand,
    model: car.res_model,
    year: car.res_year,
    km: car.res_km,
    price_b2b: car.res_price_b2b,
    images: car.res_images,
    damage_report: car.res_damage_report,
    expertise: car.res_expertise,
    location_city: car.res_location_city,
    location_district: car.res_location_district,
    is_active: car.res_is_active,
    seller_id: car.res_seller_id,
    is_opportunity: car.res_is_opportunity,
    opportunity_reason: car.res_opportunity_reason,
    opportunity_expires_at: car.res_opportunity_expires_at,
    is_trade_closed: car.res_is_trade_closed,
    masked_slug: car.res_masked_slug,
    profiles: {
      company_name: car.res_seller_company_name,
      city: car.res_seller_city,
      district: car.res_seller_district,
      phone: car.res_seller_phone
    }
  })) || []

  return (
    <DashboardClient 
      cars={mappedCars} 
      userCity={userCity} 
      userDistrict={userDistrict} 
    />
  )
}
