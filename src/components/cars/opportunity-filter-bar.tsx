"use client"

import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface OpportunityFilterBarProps {
  onFilterChange: (filters: {
    minPrice: number | null
    maxPrice: number | null
    sortBy: string
  }) => void
}

export function OpportunityFilterBar({ onFilterChange }: OpportunityFilterBarProps) {
  const [minPrice, setMinPrice] = useState<string>("")
  const [maxPrice, setMaxPrice] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    onFilterChange({
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      sortBy
    })
  }, [minPrice, maxPrice, sortBy])

  const formatPriceInput = (val: string) => {
    return val.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".")
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
            placeholder="Marka veya model ara..."
            className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group min-w-[180px]">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400">
                <ArrowUpDown className="w-4 h-4" />
             </div>
             <select 
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value)}
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
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "h-14 px-6 rounded-2xl flex items-center gap-3 transition-all font-black text-xs uppercase tracking-widest border",
              isExpanded 
                ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_10px_20px_-5px_rgba(16,185,129,0.4)]" 
                : "bg-white/5 text-white border-white/10 hover:bg-white/10"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtrele</span>
          </button>
        </div>
      </div>

      {/* Expanded Price Filters */}
      {isExpanded && (
        <div className="bento-card p-6 rounded-[2rem] border-emerald-500/20 bg-emerald-500/5 animate-in slide-in-from-top-4 duration-300">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 ml-1">Minimum Fiyat (₺)</label>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-light">₺</span>
                    <input 
                      type="text"
                      value={minPrice ? Number(minPrice).toLocaleString("tr-TR") : ""}
                      onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))}
                      placeholder="Başlangıç"
                      className="w-full h-12 pl-8 pr-4 bg-white/10 border border-emerald-500/20 rounded-xl outline-none focus:border-emerald-500/50 font-technical font-black text-white"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 ml-1">Maximum Fiyat (₺)</label>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-light">₺</span>
                    <input 
                      type="text"
                      value={maxPrice ? Number(maxPrice).toLocaleString("tr-TR") : ""}
                      onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))}
                      placeholder="Bitiş"
                      className="w-full h-12 pl-8 pr-4 bg-white/10 border border-emerald-500/20 rounded-xl outline-none focus:border-emerald-500/50 font-technical font-black text-white"
                    />
                 </div>
              </div>

              <div className="flex gap-2">
                 <button 
                   onClick={() => { setMinPrice(""); setMaxPrice(""); }}
                   className="flex-1 h-12 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-colors"
                 >
                   Sıfırla
                 </button>
                 <button 
                   onClick={() => setIsExpanded(false)}
                   className="flex-1 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-colors"
                 >
                   Uygula
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
