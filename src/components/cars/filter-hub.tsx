"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  X, 
  MapPin, 
  Zap, 
  Gauge, 
  Settings2, 
  CreditCard, 
  Trash2, 
  Check, 
  SlidersHorizontal 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTaxonomyFilters, type TaxonomyNode } from "@/hooks/use-taxonomy-filters"
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { TURKEY_LOCATIONS } from "@/lib/constants/locations"

interface FilterHubProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterUpdate: (filters: any) => void;
  currentFilters: any;
  resultCount: number;
  variant?: 'emerald' | 'primary';
}

const LEVELS = ['kategori', 'marka', 'model', 'seri', 'motor', 'sanziman', 'kasa', 'paket']
const LEVEL_LABELS: Record<string, string> = {
  kategori: 'Vasıta',
  marka: 'Marka',
  model: 'Model',
  seri: 'Seri',
  motor: 'Motor',
  sanziman: 'Şanzıman Sistemi',
  kasa: 'Kasa Tipi',
  paket: 'Donanım Paketi'
}

const CITIES = Object.keys(TURKEY_LOCATIONS).sort((a, b) => a.localeCompare(b, "tr"))

export function FilterHub({ isOpen, onClose, onFilterUpdate, currentFilters, resultCount, variant = 'emerald' }: FilterHubProps) {
  const { getNodes, getAllStandalone, loading } = useTaxonomyFilters()
  
  const isEmerald = variant === 'emerald'
  const accentColor = isEmerald ? 'emerald' : 'primary'
  const accentClass = isEmerald ? 'text-emerald-400' : 'text-primary'
  const accentBorderClass = isEmerald ? 'border-emerald-500/20' : 'border-primary/20'
  const accentBgClass = isEmerald ? 'bg-emerald-500/10' : 'bg-primary/10'
  const accentGlowClass = isEmerald ? 'shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'shadow-[0_0_20px_rgba(var(--primary),0.1)]'

  // Local state for dynamic taxonomy
  const [taxonomyOptions, setTaxonomyOptions] = useState<Record<string, TaxonomyNode[]>>({})
  const [standaloneOptions, setStandaloneOptions] = useState<Record<string, TaxonomyNode[]>>({})
  
  // Independent / Standalone options (Gears, Bodies)
  useEffect(() => {
    async function fetchStandalone() {
      const gears = await getAllStandalone('sanziman')
      const bodies = await getAllStandalone('kasa')
      setStandaloneOptions({
        sanziman: gears,
        kasa: bodies
      })
    }
    fetchStandalone()
  }, [])

  // Dynamic hierarchy options
  useEffect(() => {
    async function fetchRoot() {
      const root = await getNodes('kategori')
      setTaxonomyOptions(prev => ({ ...prev, kategori: root }))
    }
    fetchRoot()
  }, [])

  // Fetch next levels based on selection
  useEffect(() => {
    async function updateNextLevels() {
      const { tax_path } = currentFilters
      const lastIndex = tax_path.length - 1
      const lastSelectedId = tax_path[lastIndex]
      const nextLevel = LEVELS[lastIndex + 1]

      if (nextLevel && lastSelectedId) {
        const nextNodes = await getNodes(nextLevel, lastSelectedId)
        setTaxonomyOptions(prev => ({ ...prev, [nextLevel]: nextNodes }))
      }
    }
    if (currentFilters.tax_path?.length > 0) {
      updateNextLevels()
    }
  }, [currentFilters.tax_path])

  const handleTaxSelect = (id: string, levelIndex: number) => {
    const newPath = [...currentFilters.tax_path.slice(0, levelIndex), id]
    onFilterUpdate({ tax_path: newPath })
  }

  const clearFilters = () => {
    onFilterUpdate({
      tax_path: [],
      minPrice: null,
      maxPrice: null,
      minKm: null,
      maxKm: null,
      minYear: null,
      maxYear: null,
      gearType: null,
      bodyType: null,
      city: null,
      district: null,
      search: ""
    })
  }

  const districts = useMemo(() => currentFilters.city ? TURKEY_LOCATIONS[currentFilters.city] || [] : [], [currentFilters.city])

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-500",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Main Panel */}
      <div 
        className={cn(
          "fixed inset-y-0 right-0 w-full max-w-[500px] bg-slate-950 z-[101] shadow-[0_0_50px_rgba(0,0,0,0.5)] border-l border-white/5 transition-transform duration-500 ease-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", accentBgClass, accentBorderClass, accentGlowClass)}>
                <SlidersHorizontal className={cn("w-6 h-6", accentClass)} />
             </div>
             <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white italic">Filtreleme Merkezi</h2>
                <div className="flex items-center gap-2">
                   <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isEmerald ? "bg-emerald-400" : "bg-primary")} />
                   <span className={cn("text-[10px] font-black uppercase tracking-widest opacity-60", accentClass)}>{resultCount} Eşleşen Araç</span>
                </div>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group"
          >
            <X className="w-5 h-5 text-white/50 group-hover:text-white" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar pb-32">
          
          {/* 1. Lokasyon Filtreleri (New) */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <MapPin className={cn("w-4 h-4", accentClass)} />
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Lokasyon Filtresi</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Şehir</label>
                <Select value={currentFilters.city || ""} onValueChange={(val) => onFilterUpdate({ city: val, district: null })}>
                  <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-2xl font-black uppercase tracking-widest text-white">
                    <SelectValue placeholder="Şehir Seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white font-black uppercase tracking-widest">
                    <SelectItem value="null">Tümü</SelectItem>
                    {CITIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">İlçe</label>
                <Select disabled={!currentFilters.city} value={currentFilters.district || ""} onValueChange={(val) => onFilterUpdate({ district: val })}>
                  <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-2xl font-black uppercase tracking-widest text-white disabled:opacity-20">
                    <SelectValue placeholder="İlçe Seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white font-black uppercase tracking-widest">
                    <SelectItem value="null">Tümü</SelectItem>
                    {districts.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
          
          {/* 2. Hiyerarşik Seçim (8 Katman) */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <Zap className={cn("w-4 h-4", accentClass)} />
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Araç Tanımı (Hiyerarşik)</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {LEVELS.map((level, i) => {
                const options = taxonomyOptions[level] || []
                const isSelected = currentFilters.tax_path[i]
                const isDisabled = i > 0 && !currentFilters.tax_path[i-1]
                const selectedNode = options.find(n => n.id === isSelected)

                if (isDisabled && i > 0) return null

                return (
                  <div key={level} className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">{LEVEL_LABELS[level]}</label>
                    <Select value={isSelected || ""} onValueChange={(val) => handleTaxSelect(val, i)}>
                       <SelectTrigger className={cn(
                          "h-14 bg-white/5 border-white/5 rounded-2xl font-black uppercase tracking-widest",
                          isSelected ? "text-white border-white/10" : "text-white/30"
                       )}>
                          <div className="flex items-center gap-3">
                             {selectedNode?.logo_url && <img src={selectedNode.logo_url} className="w-5 h-5 object-contain" alt="" />}
                             <SelectValue placeholder={`${LEVEL_LABELS[level]} Seçin`} />
                          </div>
                       </SelectTrigger>
                       <SelectContent className="bg-slate-900 border-white/10 text-white font-black uppercase tracking-widest">
                          {options.map(opt => (
                            <SelectItem key={opt.id} value={opt.id}>
                               <div className="flex items-center gap-3">
                                  {opt.logo_url && <img src={opt.logo_url} className="w-4 h-4 object-contain" alt="" />}
                                  {opt.name}
                               </div>
                            </SelectItem>
                          ))}
                       </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 3. Teknik Özellikler (Bağımsız) */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <Settings2 className={cn("w-4 h-4", accentClass)} />
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Teknik Özellikler</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {/* KM Filter */}
               <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Kilometre Aralığı</label>
                  <div className="flex gap-2">
                     <div className="relative flex-1 group">
                        <Gauge className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:", accentClass)} />
                        <input 
                          type="text" 
                          placeholder="Min"
                          value={currentFilters.minKm || ""}
                          onChange={(e) => onFilterUpdate({ minKm: e.target.value.replace(/\D/g, "") })}
                          className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 outline-none focus:border-white/20 text-[11px] font-black text-white font-technical"
                        />
                     </div>
                     <div className="relative flex-1 group">
                        <input 
                          type="text" 
                          placeholder="Max"
                          value={currentFilters.maxKm || ""}
                          onChange={(e) => onFilterUpdate({ maxKm: e.target.value.replace(/\D/g, "") })}
                          className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-4 outline-none focus:border-white/20 text-[11px] font-black text-white font-technical"
                        />
                     </div>
                  </div>
               </div>

               {/* Gear type (Independent) */}
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Şanzıman</label>
                  <Select value={currentFilters.gearType || ""} onValueChange={(val) => onFilterUpdate({ gearType: val === 'null' ? null : val })}>
                    <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-2xl font-black uppercase tracking-widest text-white">
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white font-black uppercase tracking-widest">
                      <SelectItem value="null">Tümü</SelectItem>
                      {standaloneOptions.sanziman?.map(opt => (
                        <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>

               {/* Body type (Independent) */}
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Kasa Tipi</label>
                  <Select value={currentFilters.bodyType || ""} onValueChange={(val) => onFilterUpdate({ bodyType: val === 'null' ? null : val })}>
                    <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-2xl font-black uppercase tracking-widest text-white">
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white font-black uppercase tracking-widest">
                      <SelectItem value="null">Tümü</SelectItem>
                      {standaloneOptions.kasa?.map(opt => (
                        <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>
            </div>
          </section>

          {/* 4. Fiyat & Yıl */}
          <section className="space-y-6">
             <div className="flex items-center gap-3 mb-2">
               <CreditCard className={cn("w-4 h-4", accentClass)} />
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Fiyat & Zaman</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Min. Yıl</label>
                  <input 
                    type="number" 
                    value={currentFilters.minYear || ""}
                    onChange={(e) => onFilterUpdate({ minYear: e.target.value })}
                    placeholder="2015"
                    className="w-full h-14 px-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-white/20 text-xs font-black text-white font-technical"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Max. Yıl</label>
                  <input 
                    type="number" 
                    value={currentFilters.maxYear || ""}
                    onChange={(e) => onFilterUpdate({ maxYear: e.target.value })}
                    placeholder="2024"
                    className="w-full h-14 px-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-white/20 text-xs font-black text-white font-technical"
                  />
               </div>
            </div>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-white/5 bg-slate-900/50 backdrop-blur-2xl flex items-center justify-between gap-4 shrink-0">
           <button 
             onClick={clearFilters}
             className="h-16 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
           >
              <Trash2 className="w-4 h-4" />
              Sıfırla
           </button>
           <button 
             onClick={onClose}
             className={cn(
               "flex-1 h-16 rounded-2xl text-white flex items-center justify-center font-black uppercase tracking-widest gap-3 active:scale-95 transition-all shadow-2xl",
               isEmerald ? "bg-emerald-500 shadow-emerald-500/20" : "bg-primary shadow-primary/20"
             )}
           >
              <Check className="w-5 h-5" />
              Sonuçları Gör
           </button>
        </div>
      </div>
    </>
  )
}
