"use client"

import { useState, useMemo, useEffect } from "react"
import { CarCard } from "@/components/cars/car-card"
import { OpportunityFilterBar } from "@/components/cars/opportunity-filter-bar"
import { Flame, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getTaxonomyMap } from "@/lib/taxonomy-cache"

interface DashboardClientProps {
  cars: any[];
  userCity: string;
  userDistrict: string;
}

export function DashboardClient({ cars, userCity, userDistrict }: DashboardClientProps) {
  const [filters, setFilters] = useState<any>({
    search: "",
    sortBy: "newest",
    tax_path: [],
    minKm: null,
    maxKm: null,
    minYear: null,
    maxYear: null,
    gearType: null,
    bodyType: null,
    minPrice: null,
    maxPrice: null,
    city: null,
    district: null
  })

  // ⚡ Perf: Singleton taxonomy cache — not re-fetched on every navigation
  const [taxonomyMap, setTaxonomyMap] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    getTaxonomyMap().then(setTaxonomyMap)
  }, [])

  // Helper to get full ancestry
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
    // Mapping taxonomy for deep checks
    const enrichedResults = cars.map(car => {
        if (!car.package_id) return { ...car, ancestry: [] }
        return { ...car, ancestry: getPackageAncestry(car.package_id) }
    })

    let result = enrichedResults.filter(car => {
      // 1. Keyword Search
      if (filters.search) {
        const s = filters.search.toLowerCase()
        const searchable = `${car.brand} ${car.model} ${car.title} ${car.location_city} ${car.damage_report || ''}`.toLowerCase()
        if (!searchable.includes(s)) return false
      }

      // 2. Price Filter
      if (filters.minPrice && car.price_b2b < Number(filters.minPrice)) return false
      if (filters.maxPrice && car.price_b2b > Number(filters.maxPrice)) return false

      // 3. Year & KM Filter
      if (filters.minYear && car.year < Number(filters.minYear)) return false
      if (filters.maxYear && car.year > Number(filters.maxYear)) return false
      if (filters.minKm && car.km < Number(filters.minKm)) return false
      if (filters.maxKm && car.km > Number(filters.maxKm)) return false

      // 4. Independent Gear & Body
      if (filters.gearType) {
          const hasGear = car.ancestry.some((n: any) => n.level === 'sanziman' && n.name === filters.gearType)
          if (!hasGear) return false
      }
      if (filters.bodyType) {
          const hasBody = car.ancestry.some((n: any) => n.level === 'kasa' && n.name === filters.bodyType)
          if (!hasBody) return false
      }

      // 5. Hierarchical Path (8 Levels)
      if (filters.tax_path.length > 0) {
          const carPathIds = car.ancestry.map((n: any) => n.id)
          const match = filters.tax_path.every((id: string) => carPathIds.includes(id))
          if (!match) return false
      }

      // 6. Location Filter (Manual Global Search)
      if (filters.city && filters.city !== 'null') {
        if (car.location_city !== filters.city) return false
      }
      if (filters.district && filters.district !== 'null') {
        if (car.location_district !== filters.district) return false
      }

      return true
    })

    // Sorting
    result.sort((a, b) => {
      if (filters.sortBy === 'expensive') return Number(b.price_b2b) - Number(a.price_b2b)
      if (filters.sortBy === 'cheap') return Number(a.price_b2b) - Number(b.price_b2b)
      if (filters.sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return result
  }, [cars, filters, taxonomyMap])

  const opportunityCars = filteredCars.filter((c: any) => c.is_opportunity && c.opportunity_expires_at)
  const regularCars = filteredCars.filter((c: any) => !c.is_opportunity || !c.opportunity_expires_at)

  return (
    <div className="flex min-h-screen bg-background transition-all duration-500">
      
      {/* Main Content Area */}
      <main className="flex-1 transition-all duration-700 ease-in-out px-4 sm:px-6 lg:px-8 py-8 md:px-12">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Dashboard Header & Advanced Filter Bar */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter uppercase italic">Vitrin İlanlar</h1>
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                  Türkiye genelinden <span className="text-primary">{cars.length}</span> aktif ticari ilan listeleniyor.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {filteredCars.length !== cars.length && (
                  <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20 animate-pulse">
                    {filteredCars.length} Sonuç Bulundu
                  </div>
                )}
              </div>
            </div>

            <div className="relative z-20">
              <OpportunityFilterBar 
                variant="primary"
                resultCount={filteredCars.length}
                onFilterChange={(newFilters) => setFilters(newFilters)}
                currentFilters={filters}
                onSearch={(val) => setFilters((f: any) => ({ ...f, search: val }))}
              />
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
