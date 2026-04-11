"use client"

import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { FilterHub } from "./filter-hub"

interface OpportunityFilterBarProps {
  onFilterChange: (filters: any) => void;
  resultCount: number;
}

export function OpportunityFilterBar({ onFilterChange, resultCount }: OpportunityFilterBarProps) {
  const [isHubOpen, setIsHubOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState({
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
    maxPrice: null
  })

  // Sync back to parent
  useEffect(() => {
    onFilterChange(localFilters)
  }, [localFilters])

  const handleUpdate = (updates: any) => {
    setLocalFilters(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="space-y-4">
      {/* Search & Main Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-400 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input 
            type="text"
            placeholder="Kalıp, marka veya model ara..."
            value={localFilters.search}
            onChange={(e) => handleUpdate({ search: e.target.value })}
            className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group min-w-[180px]">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400">
                <ArrowUpDown className="w-4 h-4" />
             </div>
             <select 
               value={localFilters.sortBy}
               onChange={(e) => handleUpdate({ sortBy: e.target.value })}
               className="w-full h-14 pl-10 pr-10 bg-white/5 border border-white/10 rounded-2xl outline-none appearance-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5 transition-all text-xs font-black uppercase tracking-widest cursor-pointer"
             >
               <option value="newest">En Yeni İlanlar</option>
               <option value="oldest">En Eski İlanlar</option>
               <option value="expensive">En Yüksek Fiyat</option>
               <option value="cheap">En Düşük Fiyat</option>
             </select>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <ChevronDown className="w-4 h-4" />
             </div>
          </div>

          <button 
            onClick={() => setIsHubOpen(true)}
            className={cn(
              "h-14 px-6 rounded-2xl flex items-center gap-3 transition-all font-black text-xs uppercase tracking-widest border",
              localFilters.tax_path.length > 0 || localFilters.gearType || localFilters.bodyType || localFilters.minPrice || localFilters.maxPrice
                ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_10px_20px_-5px_rgba(16,185,129,0.4)]" 
                : "bg-white/5 text-white border-white/10 hover:bg-white/10"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtrele</span>
            {localFilters.tax_path.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-emerald-600 flex items-center justify-center text-[10px] font-black">{localFilters.tax_path.length}</span>
            )}
          </button>
        </div>
      </div>

      <FilterHub 
        isOpen={isHubOpen}
        onClose={() => setIsHubOpen(false)}
        onFilterUpdate={handleUpdate}
        currentFilters={localFilters}
        resultCount={resultCount}
      />
    </div>
  )
}
