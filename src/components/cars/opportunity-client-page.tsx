"use client"

import { useState, useMemo } from "react"
import { CarCard } from "@/components/cars/car-card"
import { Flame, Info } from "lucide-react"
import { OpportunityFilterBar } from "./opportunity-filter-bar"

interface OpportunityClientPageProps {
  initialCars: any[]
}

export function OpportunityClientPage({ initialCars }: OpportunityClientPageProps) {
  const [filters, setFilters] = useState({
    minPrice: null as number | null,
    maxPrice: null as number | null,
    sortBy: "newest",
    search: ""
  })

  const filteredCars = useMemo(() => {
    let result = [...initialCars]

    // Price Filter
    if (filters.minPrice !== null) {
      result = result.filter(car => car.price_b2b >= (filters.minPrice ?? 0))
    }
    if (filters.maxPrice !== null) {
      result = result.filter(car => car.price_b2b <= (filters.maxPrice ?? Infinity))
    }

    // Search Filter
    if (filters.search) {
      const s = filters.search.toLowerCase()
      result = result.filter(car => 
        car.brand.toLowerCase().includes(s) || 
        car.model.toLowerCase().includes(s) ||
        car.title?.toLowerCase().includes(s)
      )
    }

    // Sorting
    result.sort((a, b) => {
      if (filters.sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (filters.sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (filters.sortBy === "expensive") {
        return b.price_b2b - a.price_b2b
      }
      if (filters.sortBy === "cheap") {
        return a.price_b2b - b.price_b2b
      }
      return 0
    })

    return result
  }, [initialCars, filters])

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <div className="relative">
         <OpportunityFilterBar 
           onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} 
         />
      </div>

      {/* Info Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
         <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500/60">
            <Info className="w-3.5 h-3.5" />
            <span>Toplam {filteredCars.length} fırsat ilanı listeleniyor</span>
         </div>
      </div>

      {/* Car Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCars.map((car: any) => (
          <CarCard key={car.id} car={car} />
        ))}
        {filteredCars.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-emerald-500/20 rounded-[3rem] bg-emerald-500/5 glass-node relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            <Flame className="w-16 h-16 text-emerald-500/40 mb-6 rounded-full p-4 bg-emerald-500/10 animate-pulse relative z-10" />
            <span className="text-xl font-black uppercase tracking-tight text-white relative z-10 drop-shadow-sm">Sonuç Bulunamadı</span>
            <span className="text-xs font-bold mt-2 text-emerald-500/60 uppercase tracking-widest relative z-10">Kriterlerinize uygun fırsat ilanı statüsünde araç bulunmuyor</span>
            <button 
              onClick={() => window.location.reload()}
              className="mt-8 px-8 h-12 rounded-2xl border border-emerald-500/30 text-emerald-400 font-black text-xs uppercase tracking-widest hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.1)] relative z-10"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
