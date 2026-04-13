"use client"

import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { FilterHub } from "./filter-hub"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

interface OpportunityFilterBarProps {
  resultCount: React.ReactNode | number;
  variant?: 'emerald' | 'primary';
}

export function OpportunityFilterBar({ resultCount, variant = 'emerald' }: OpportunityFilterBarProps) {
  const [isHubOpen, setIsHubOpen] = useState(false)
  const isEmerald = variant === 'emerald'
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Extract initial state from URL
  const [localFilters, setLocalFilters] = useState({
    search: searchParams.get('search') || "",
    sortBy: searchParams.get('sortBy') || "newest",
    tax_path: searchParams.get('tax_path') ? searchParams.get('tax_path')?.split(',') : [],
    minKm: searchParams.get('minKm') || null,
    maxKm: searchParams.get('maxKm') || null,
    minYear: searchParams.get('minYear') || null,
    maxYear: searchParams.get('maxYear') || null,
    gearType: searchParams.get('gearType') || null,
    bodyType: searchParams.get('bodyType') || null,
    minPrice: searchParams.get('minPrice') || null,
    maxPrice: searchParams.get('maxPrice') || null,
    city: searchParams.get('city') || null,
    district: searchParams.get('district') || null
  })

  // Keep local filters in sync if URL changes outside (e.g. Back button)
  useEffect(() => {
    setLocalFilters({
      search: searchParams.get('search') || "",
      sortBy: searchParams.get('sortBy') || "newest",
      tax_path: searchParams.get('tax_path') ? searchParams.get('tax_path')?.split(',') : [],
      minKm: searchParams.get('minKm') || null,
      maxKm: searchParams.get('maxKm') || null,
      minYear: searchParams.get('minYear') || null,
      maxYear: searchParams.get('maxYear') || null,
      gearType: searchParams.get('gearType') || null,
      bodyType: searchParams.get('bodyType') || null,
      minPrice: searchParams.get('minPrice') || null,
      maxPrice: searchParams.get('maxPrice') || null,
      city: searchParams.get('city') || null,
      district: searchParams.get('district') || null
    })
  }, [searchParams])

  const pushToUrl = (filtersToPush: any) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(filtersToPush)) {
      if (value === null || value === '' || (Array.isArray(value) && value.length === 0) || value === 'null') {
        params.delete(key)
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','))
      } else {
        params.set(key, String(value))
      }
    }
    // Her filtre değişiminde sayfa 1'e dön
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Anından URL'e yansıtılacak değişiklikler (Search, Sort)
  const handleImmediateUpdate = (updates: any) => {
    setLocalFilters(prev => {
      const next = { ...prev, ...updates }
      pushToUrl(next)
      return next
    })
  }

  // Sadece Local State'i güncelleyenler (FilterHub içindeki anlık etkileşimler)
  const handleLocalUpdate = (updates: any) => {
    setLocalFilters(prev => ({ ...prev, ...updates }))
  }

  // FilterHub "Sonuçları Gör" butonuna basınca URL'i güncelle
  const applyFilters = () => {
    pushToUrl(localFilters)
    setIsHubOpen(false)
  }

  const debouncedSearchTimeout = useRef<NodeJS.Timeout | null>(null)
  
  const handleSearchChange = (val: string) => {
    setLocalFilters(prev => ({ ...prev, search: val }))
    if (debouncedSearchTimeout.current) clearTimeout(debouncedSearchTimeout.current)
    debouncedSearchTimeout.current = setTimeout(() => {
      pushToUrl({ ...localFilters, search: val })
    }, 500)
  }

  const accentClass = isEmerald ? "text-emerald-400" : "text-primary"
  const focusBorderClass = isEmerald ? "focus:border-emerald-500/40 focus:ring-emerald-500/5" : "focus:border-primary/40 focus:ring-primary/5"

  return (
    <div className="space-y-4">
      {/* Search & Main Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <div className={cn("absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors", isEmerald ? "group-focus-within:text-emerald-400" : "group-focus-within:text-primary")}>
            <Search className="w-5 h-5" />
          </div>
          <input 
            type="text"
            placeholder="Kelime, marka veya model ara..."
            value={localFilters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={cn(
              "w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl outline-none transition-all text-sm font-medium",
              focusBorderClass
            )}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group min-w-[180px]">
             <div className={cn("absolute left-4 top-1/2 -translate-y-1/2", accentClass)}>
                <ArrowUpDown className="w-4 h-4" />
             </div>
             <select 
               value={localFilters.sortBy}
               onChange={(e) => handleImmediateUpdate({ sortBy: e.target.value })}
               className={cn(
                 "w-full h-14 pl-10 pr-10 bg-white/5 border border-white/10 rounded-2xl outline-none appearance-none transition-all text-xs font-black uppercase tracking-widest cursor-pointer",
                 focusBorderClass
               )}
             >
               <option value="newest" className="bg-slate-900 text-white">En Yeni İlanlar</option>
               <option value="oldest" className="bg-slate-900 text-white">En Eski İlanlar</option>
               <option value="expensive" className="bg-slate-900 text-white">En Yüksek Fiyat</option>
               <option value="cheap" className="bg-slate-900 text-white">En Düşük Fiyat</option>
             </select>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <ChevronDown className="w-4 h-4" />
             </div>
          </div>

          <button 
            onClick={() => setIsHubOpen(true)}
            className={cn(
              "h-14 px-6 rounded-2xl flex items-center gap-3 transition-all font-black text-xs uppercase tracking-widest border",
              isEmerald 
                ? ((localFilters.tax_path as string[])?.length > 0 || localFilters.gearType || localFilters.bodyType || localFilters.city || localFilters.district
                    ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_10px_20px_-5px_rgba(16,185,129,0.4)]" 
                    : "bg-white/5 text-white border-white/10 hover:bg-white/10")
                : ((localFilters.tax_path as string[])?.length > 0 || localFilters.gearType || localFilters.bodyType || localFilters.city || localFilters.district
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_10px_20px_-5px_rgba(var(--primary),0.4)]" 
                    : "bg-white/5 text-white border-white/10 hover:bg-white/10")
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtrele</span>
            {((localFilters.tax_path as string[])?.length > 0 || localFilters.city) && (
                <span className={cn("w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-black", accentClass)}>
                  {(localFilters.tax_path as string[])?.length + (localFilters.city ? 1 : 0)}
                </span>
            )}
          </button>
        </div>
      </div>

      <FilterHub 
        isOpen={isHubOpen}
        onClose={applyFilters}
        onFilterUpdate={handleLocalUpdate}
        currentFilters={localFilters}
        resultCount={resultCount}
        variant={variant}
      />
    </div>
  )
}


