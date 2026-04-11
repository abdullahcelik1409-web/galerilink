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

  // 🚀 Global Fetch: Direct query bypasses city restrictions and retrieves all active listings
  const { data: cars, error } = await supabase
    .from('cars')
    .select(`
      *,
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

  if (error) {
    console.error('Performance Engine Query Error:', error.message)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('city, district')
    .eq('id', user.id)
    .single()

  const userCity = formatLocation(profile?.city || "Belirtilmemiş")
  const userDistrict = formatLocation(profile?.district || "Belirtilmemiş")

  // Map response (already nested vs RPC's flat structure)
  const mappedCars = cars?.map((car: any) => ({
    ...car,
    offer_count: 0 // Will handle if needed, or join offers
  })) || []

  return (
    <DashboardClient 
      cars={mappedCars} 
      userCity={userCity} 
      userDistrict={userDistrict} 
    />
  )
}
