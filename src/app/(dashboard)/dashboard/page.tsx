import { createClient } from "@/lib/supabase/server"
import { CarCard } from "@/components/cars/car-card"
import { formatLocation } from "@/lib/utils"
import { Flame, ArrowRight } from "lucide-react"
import Link from "next/link"

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

  // Map flat RPC response (with res_ prefixes) to the legacy nested structure expected by CarCard
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

  // Separate opportunity and regular cars
  const opportunityCars = mappedCars.filter((c: any) => c.is_opportunity && c.opportunity_expires_at)
  const regularCars = mappedCars.filter((c: any) => !c.is_opportunity || !c.opportunity_expires_at)

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 py-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight border-b pb-4">Tüm Araç Vitrini</h1>
        <p className="text-muted-foreground mt-4 text-lg">Sadece bulunduğunuz <strong>{userCity}</strong> ilindeki ilanları inceliyorsunuz. İlk olarak <strong>{userDistrict}</strong> ilçesindeki araçlar önceliklendirilmiştir.</p>
      </div>

      {/* Opportunity Highlight Section */}
      {opportunityCars.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">Fırsat Havuzu</h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Acil satılık • Nakit teklif açık</p>
              </div>
            </div>
            <Link 
              href="/dashboard/opportunities" 
              className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 text-xs font-black uppercase tracking-widest transition-colors"
            >
              Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {opportunityCars.slice(0, 4).map((car: any) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Cars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
        {regularCars.map((car: any) => (
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
