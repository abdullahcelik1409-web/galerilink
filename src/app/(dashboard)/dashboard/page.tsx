import { createClient } from "@/lib/supabase/server"
import { CarCard } from "@/components/cars/car-card"
import { formatLocation } from "@/lib/utils"

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
    console.error('Performance Engine RPC Error Detail:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
  }

  // Still fetch profile for header display (lightweight)
  const { data: profile } = await supabase
    .from('profiles')
    .select('city, district')
    .eq('id', user.id)
    .single()

  const userCity = formatLocation(profile?.city || "Belirtilmemiş")
  const userDistrict = formatLocation(profile?.district || "Belirtilmemiş")

  // Map flat RPC response to the legacy nested structure expected by CarCard
  const mappedCars = cars?.map((car: any) => ({
    ...car,
    profiles: {
      company_name: car.seller_company_name,
      city: car.seller_city,
      district: car.seller_district,
      phone: car.seller_phone
    }
  })) || []

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight border-b pb-4">Tüm Araç Vitrini</h1>
        <p className="text-muted-foreground mt-4 text-lg">Sadece bulunduğunuz <strong>{userCity}</strong> ilindeki ilanları inceliyorsunuz. İlk olarak <strong>{userDistrict}</strong> ilçesindeki araçlar önceliklendirilmiştir.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
        {mappedCars.map((car: any) => (
          <CarCard key={car.id} car={car} />
        ))}
        {mappedCars.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-card/30">
            <span className="text-lg font-medium mb-2">Bulunduğunuz şehirde yayında olan aktif araç bulunmuyor.</span>
            <span className="text-sm">Başka şehirlerdeki ilanlara erişim kapalıdır.</span>
          </div>
        )}
      </div>
    </div>
  )
}
