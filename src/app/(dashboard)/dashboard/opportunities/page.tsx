import { createClient } from "@/lib/supabase/server"
import { OpportunityClientPage } from "@/components/cars/opportunity-client-page"
import { Flame, Star, Zap, Info } from "lucide-react"

export const metadata = {
  title: "Fırsat Havuzu - GaleriLink",
}

export default async function OpportunitiesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: cars, error } = await supabase.rpc('fetch_opportunities')

  if (error) {
    console.error('Opportunity RPC Error:', error)
  }

  // Map flat RPC response (with res_ prefixes) to nested structure expected by CarCard
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
    offer_count: car.res_offer_count,
    profiles: {
      company_name: car.res_seller_company_name,
      city: car.res_seller_city,
      district: car.res_seller_district,
      phone: car.res_seller_phone
    }
  })) || []

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 py-8 pb-24">
      {/* Premium Header */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-5">
             <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.15)] border border-emerald-500/20 relative group">
                <div className="absolute inset-0 bg-emerald-500/10 animate-pulse rounded-[2rem]" />
                <Flame className="w-8 h-8 text-emerald-400 relative z-10" strokeWidth={2.5} />
             </div>
             <div>
               <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">Fırsat <span className="text-emerald-400">Havuzu</span></h1>
               <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-inner">
                     <Zap className="w-3 h-3 fill-current" />
                     Premium Fırsat Ağı
                  </div>
                  <p className="text-emerald-600/60 text-xs font-bold uppercase tracking-widest hidden sm:block">• Sadece Bayilere Özel</p>
               </div>
             </div>
           </div>

           {/* Stats Summary */}
           <div className="flex items-center gap-4 bg-black/40 border border-emerald-500/20 rounded-[2rem] p-5 shadow-[0_0_30px_rgba(16,185,129,0.05)] glass-node relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
             <div className="flex flex-col relative z-10">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Aktif İlan</span>
               <span className="font-technical text-3xl font-black text-white tabular-nums tracking-tighter drop-shadow-sm">{mappedCars.length}</span>
             </div>
             <div className="h-10 w-px bg-emerald-500/20" />
             <div className="flex flex-col relative z-10">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Toplam Teklif</span>
               <span className="font-technical text-3xl font-black text-white tabular-nums tracking-tighter drop-shadow-sm">
                  {mappedCars.reduce((acc: number, car: any) => acc + (Number(car.offer_count) || 0), 0)}
               </span>
             </div>
           </div>
        </div>

        {/* Global pool info banner */}
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
           <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Info className="w-3 h-3" />
           </div>
           <p className="text-[9px] font-black uppercase tracking-[0.1em] text-emerald-400/80">Fırsat havuzundaki araçlara en iyi teklifi verip hızlıca kârlı portföyünüzü genişletin.</p>
        </div>
      </div>

      {/* Main Interactive Track */}
      <OpportunityClientPage initialCars={mappedCars} />
    </div>
  )
}
