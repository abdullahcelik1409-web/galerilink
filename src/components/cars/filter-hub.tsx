"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, X, ChevronRight, SlidersHorizontal, Check, Info, Trash2, Gauge, Calendar, Zap, CreditCard, Fuel, Settings2, Wind } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTaxonomyFilters, TaxonomyNode } from "@/hooks/use-taxonomy-filters"

interface FilterHubProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterUpdate: (filters: any) => void;
  currentFilters: any;
  resultCount: number;
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

export function FilterHub({ isOpen, onClose, onFilterUpdate, currentFilters, resultCount }: FilterHubProps) {
  const { getNodes, getAllStandalone } = useTaxonomyFilters()
  
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
      const nextLevel = LEVELS[tax_path.length]

      if (nextLevel && lastSelectedId) {
        const nextNodes = await getNodes(nextLevel, lastSelectedId)
        setTaxonomyOptions(prev => ({ ...prev, [nextLevel]: nextNodes }))
      }
    }
    updateNextLevels()
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
      search: ""
    })
  }

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
             <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <SlidersHorizontal className="w-6 h-6 text-emerald-400" />
             </div>
             <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white italic">Filtreleme Merkezi</h2>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60">{resultCount} Eşleşen Araç</span>
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
          
          {/* 1. Hiyerarşik Seçim (8 Katman) */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <Zap className="w-4 h-4 text-emerald-400" />
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
                    <div className="relative group">
                       <select 
                         value={isSelected || ""}
                         onChange={(e) => handleTaxSelect(e.target.value, i)}
                         className={cn(
                           "w-full h-14 pl-12 pr-10 bg-white/5 border border-white/5 rounded-2xl outline-none appearance-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5 transition-all text-xs font-black uppercase tracking-widest cursor-pointer",
                           isSelected ? "text-white border-emerald-500/20" : "text-white/30"
                         )}
                       >
                         <option value="">{LEVEL_LABELS[level]} Seçin</option>
                         {options.map(opt => (
                           <option key={opt.id} value={opt.id}>{opt.name}</option>
                         ))}
                       </select>
                       <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400">
                          {selectedNode?.logo_url ? (
                            <img src={selectedNode.logo_url} className="w-5 h-5 object-contain" alt="" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                       </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 2. Teknik Özellikler (Bağımsız) */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <Settings2 className="w-4 h-4 text-emerald-400" />
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Teknik Özellikler</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {/* KM Filter */}
               <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Kilometre Aralığı</label>
                  <div className="flex gap-2">
                     <div className="relative flex-1 group">
                        <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-400" />
                        <input 
                          type="text" 
                          placeholder="Min"
                          value={currentFilters.minKm || ""}
                          onChange={(e) => onFilterUpdate({ minKm: e.target.value.replace(/\D/g, "") })}
                          className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 outline-none focus:border-emerald-500/40 text-[11px] font-black text-white font-technical"
                        />
                     </div>
                     <div className="relative flex-1 group">
                        <input 
                          type="text" 
                          placeholder="Max"
                          value={currentFilters.maxKm || ""}
                          onChange={(e) => onFilterUpdate({ maxKm: e.target.value.replace(/\D/g, "") })}
                          className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-4 outline-none focus:border-emerald-500/40 text-[11px] font-black text-white font-technical"
                        />
                     </div>
                  </div>
               </div>

               {/* Gear type (Independent) */}
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Şanzıman</label>
                  <select 
                    value={currentFilters.gearType || ""}
                    onChange={(e) => onFilterUpdate({ gearType: e.target.value })}
                    className="w-full h-14 px-4 bg-white/5 border border-white/5 rounded-2xl outline-none appearance-none focus:border-emerald-500/40 text-xs font-black uppercase tracking-widest text-white"
                  >
                    <option value="">Tümü</option>
                    {standaloneOptions.sanziman?.map(opt => (
                      <option key={opt.id} value={opt.name}>{opt.name}</option>
                    ))}
                  </select>
               </div>

               {/* Body type (Independent) */}
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Kasa Tipi</label>
                  <select 
                    value={currentFilters.bodyType || ""}
                    onChange={(e) => onFilterUpdate({ bodyType: e.target.value })}
                    className="w-full h-14 px-4 bg-white/5 border border-white/5 rounded-2xl outline-none appearance-none focus:border-emerald-500/40 text-xs font-black uppercase tracking-widest text-white"
                  >
                    <option value="">Tümü</option>
                    {standaloneOptions.kasa?.map(opt => (
                      <option key={opt.id} value={opt.name}>{opt.name}</option>
                    ))}
                  </select>
               </div>
            </div>
          </section>

          {/* 3. Fiyat & Yıl */}
          <section className="space-y-6">
             <div className="flex items-center gap-3 mb-2">
               <CreditCard className="w-4 h-4 text-emerald-400" />
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
                    className="w-full h-14 px-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-emerald-500/40 text-xs font-black text-white font-technical"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Max. Yıl</label>
                  <input 
                    type="number" 
                    value={currentFilters.maxYear || ""}
                    onChange={(e) => onFilterUpdate({ maxYear: e.target.value })}
                    placeholder="2024"
                    className="w-full h-14 px-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-emerald-500/40 text-xs font-black text-white font-technical"
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
             className="flex-1 h-16 rounded-2xl bg-emerald-500 text-white shadow-[0_15px_30px_-10px_rgba(16,185,129,0.5)] flex items-center justify-center font-black uppercase tracking-widest gap-3 active:scale-95 transition-all"
           >
              <Check className="w-5 h-5" />
              Sonuçları Gör
           </button>
        </div>
      </div>
    </>
  )
}
