"use client"

import { useState } from "react"
import { CarCard } from "@/components/cars/car-card"
import { SidebarFilter } from "@/components/filters/sidebar-filter"
import { Flame, ArrowRight, Menu, X, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DashboardClientProps {
  cars: any[];
  userCity: string;
  userDistrict: string;
}

export function DashboardClient({ cars, userCity, userDistrict }: DashboardClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [filters, setFilters] = useState<any>({})

  // Client-side filtering logic for immediate feedback, 
  // though ideally this should hit the server again via SearchParams or RPC
  const filteredCars = cars.filter(car => {
    // 1. Keyword Search (Title & Damage Report/Description)
    if (filters.keyword) {
      const searchStr = `${car.title} ${car.damage_report || ''}`.toLowerCase()
      if (!searchStr.includes(filters.keyword.toLowerCase())) return false
    }

    // 2. Price Filter
    if (filters.price?.min && car.price_b2b < Number(filters.price.min)) return false
    if (filters.price?.max && car.price_b2b > Number(filters.price.max)) return false

    // 3. Year Filter
    if (filters.year?.min && car.year < Number(filters.year.min)) return false
    if (filters.year?.max && car.year > Number(filters.year.max)) return false

    return true
  })

  const opportunityCars = filteredCars.filter((c: any) => c.is_opportunity && c.opportunity_expires_at)
  const regularCars = filteredCars.filter((c: any) => !c.is_opportunity || !c.opportunity_expires_at)

  return (
    <div className="flex min-h-screen bg-background transition-all duration-500">
      
      {/* Advanced Sidebar Filter */}
      <SidebarFilter 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        onFilterChange={setFilters}
      />

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 transition-all duration-700 ease-in-out px-4 sm:px-6 lg:px-8 py-8",
        isSidebarOpen ? "md:pl-[340px]" : "md:pl-8"
      )}>
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic">Ağdaki Araçlar</h1>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">
                Şu anda <span className="text-primary">{userCity}</span> içi • <span className="text-primary">{userDistrict}</span> öncelikli araçları görüyorsunuz.
              </p>
            </div>
            
            {/* Mobile Filter Trigger & Quick Stats */}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden h-12 rounded-2xl border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtrele
              </Button>

              {filteredCars.length !== cars.length && (
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20 animate-pulse">
                  {filteredCars.length} Sonuç
                </div>
              )}
            </div>
          </div>

          {/* Opportunity Highlight Section */}
          {opportunityCars.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-500/5">
                    <Flame className="w-6 h-6 text-amber-500" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter italic">Fırsat Havuzu</h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hızlı Satış • B2B Özel Fiyatlar</p>
                  </div>
                </div>
                <Link 
                  href="/dashboard/opportunities" 
                  className="flex items-center gap-2 text-amber-600 hover:text-amber-700 text-xs font-black uppercase tracking-widest transition-all hover:translate-x-1"
                >
                  Tümünü Gör <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {opportunityCars.slice(0, 4).map((car: any) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            </div>
          )}

          {/* Regular Cars Grid */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-2 h-8 bg-primary rounded-full" />
              <h2 className="text-xl font-black uppercase tracking-tighter italic">Vitrin İlanlar</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {regularCars.map((car: any) => (
                <CarCard key={car.id} car={car} />
              ))}
              
              {filteredCars.length === 0 && (
                <div className="col-span-full py-40 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-[3rem] bg-card/10 border-primary/5">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                    <X className="w-8 h-8 opacity-20" />
                  </div>
                  <span className="text-xl font-black uppercase tracking-tighter mb-2 italic">Sonuç Bulunamadı</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Filtrelerinizi temizleyerek tekrar deneyin.</span>
                  <Button variant="ghost" className="mt-8 text-[10px] font-black uppercase tracking-widest" onClick={() => setFilters({})}>Tüm Filtreleri Kaldır</Button>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
