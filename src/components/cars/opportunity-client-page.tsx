"use client"

import { useState, useMemo, useEffect } from "react"
import { CarCard } from "@/components/cars/car-card"
import { Flame, Info } from "lucide-react"
import { OpportunityFilterBar } from "./opportunity-filter-bar"
import { createClient } from "@/lib/supabase/client"

interface OpportunityClientPageProps {
  initialCars: any[]
}

export function OpportunityClientPage({ initialCars }: OpportunityClientPageProps) {
  const [filters, setFilters] = useState<any>({
    minPrice: null,
    maxPrice: null,
    sortBy: "newest",
    search: "",
    tax_path: [],
    minKm: null,
    maxKm: null,
    minYear: null,
    maxYear: null,
    gearType: null,
    bodyType: null,
    city: null,
    district: null
  })

  // Full taxonomy cache for path matching
  const [taxonomyMap, setTaxonomyMap] = useState<Map<string, any>>(new Map())
  const supabase = createClient()

  useEffect(() => {
    async function loadTaxonomy() {
      const { data } = await supabase.from('car_taxonomy').select('id, parent_id, name, level')
      const map = new Map()
      data?.forEach(node => map.set(node.id, node))
      setTaxonomyMap(map)
    }
    loadTaxonomy()
  }, [])

  // Helper to get full ancestry of a package
  const getPackageAncestry = (packageId: string) => {
    const path: any[] = []
    let currentId = packageId
    while (currentId && taxonomyMap.has(currentId)) {
      const node = taxonomyMap.get(currentId)
      path.unshift(node)
      currentId = node.parent_id
    }
    return path
  }

  const filteredCars = useMemo(() => {
    let result = [...initialCars]

    // Mapping taxonomy details for independent checks
    const enrichedResults = result.map(car => {
        if (!car.package_id) return { ...car, ancestry: [] }
        return { ...car, ancestry: getPackageAncestry(car.package_id) }
    })

    let filtered = enrichedResults.filter(car => {
      // 1. Price
      if (filters.minPrice && car.price_b2b < filters.minPrice) return false
      if (filters.maxPrice && car.price_b2b > filters.maxPrice) return false

      // 2. KM & Year
      if (filters.minKm && car.km < filters.minKm) return false
      if (filters.maxKm && car.km > filters.maxKm) return false
      if (filters.minYear && car.year < filters.minYear) return false
      if (filters.maxYear && car.year > filters.maxYear) return false

      // 3. Independent Gear & Body
      if (filters.gearType) {
          const hasGear = car.ancestry.some((n: any) => n.level === 'sanziman' && n.name === filters.gearType)
          if (!hasGear) return false
      }
      if (filters.bodyType) {
          const hasBody = car.ancestry.some((n: any) => n.level === 'kasa' && n.name === filters.bodyType)
          if (!hasBody) return false
      }

      // 4. Hierarchical Path
      if (filters.tax_path.length > 0) {
          const carPathIds = car.ancestry.map((n: any) => n.id)
          // Every ID in selected tax_path must be in car's ancestry
          const match = filters.tax_path.every((id: string) => carPathIds.includes(id))
          if (!match) return false
      }

      // 5. Search
      if (filters.search) {
        const s = filters.search.toLowerCase()
        const searchable = `${car.brand} ${car.model} ${car.title} ${car.location_city}`.toLowerCase()
        if (!searchable.includes(s)) return false
      }

      // 6. Location Filter (New Global Search)
      if (filters.city && filters.city !== 'null') {
        if (car.location_city !== filters.city) return false
      }
      if (filters.district && filters.district !== 'null') {
        if (car.location_district !== filters.district) return false
      }

      return true
    })

    // Sorting
    filtered.sort((a, b) => {
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

    return filtered
  }, [initialCars, filters, taxonomyMap])

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <div className="relative">
         <OpportunityFilterBar 
           resultCount={filteredCars.length}
           onFilterChange={(newFilters) => setFilters(newFilters)} 
           currentFilters={filters}
           onSearch={(val) => setFilters((f: any) => ({ ...f, search: val }))}
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
