"use client"

import { useState } from "react"
import { Search, SlidersHorizontal, X, ChevronDown, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface SidebarFilterProps {
  onFilterChange: (filters: any) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function SidebarFilter({ onFilterChange, isOpen, onToggle }: SidebarFilterProps) {
  const [keyword, setKeyword] = useState("")
  const [priceMin, setPriceMin] = useState("")
  const [priceMax, setPriceMax] = useState("")
  const [yearMin, setYearMin] = useState("")
  const [yearMax, setYearMax] = useState("")

  const handleApply = () => {
    onFilterChange({
      keyword,
      price: { min: priceMin, max: priceMax },
      year: { min: yearMin, max: yearMax }
    })
  }

  const handleClear = () => {
    setKeyword("")
    setPriceMin("")
    setPriceMax("")
    setYearMin("")
    setYearMax("")
    onFilterChange({})
  }

  return (
    <>
      {/* Desktop Sidebar Toggle Pin */}
      <div className={cn(
        "fixed left-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-500",
        isOpen ? "translate-x-80" : "translate-x-0"
      )}>
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={onToggle}
          className="h-12 w-8 rounded-r-2xl rounded-l-none border-l-0 shadow-xl bg-card border-primary/10 hover:bg-primary hover:text-white group"
        >
          {isOpen ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4 group-hover:scale-125 transition-transform" />}
        </Button>
      </div>

      {/* Sidebar Panel */}
      <div className={cn(
        "fixed inset-y-0 left-0 w-80 bg-card/80 backdrop-blur-3xl border-r z-50 transition-all duration-700 ease-in-out transform",
        isOpen ? "translate-x-0" : "-translate-x-full shadow-none"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-8 space-y-8 flex-1 overflow-y-auto scrollbar-none">
            
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter">İleri Filtreleme</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sahibinden Tarzı Akıllı Arama</p>
            </div>

            {/* Keyword Search */}
            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Kelime ile Ara</Label>
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Örn: değişensiz, acil..." 
                    className="h-14 pl-12 bg-primary/5 border-none rounded-2xl font-bold placeholder:font-medium focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
               </div>
               <p className="text-[9px] text-muted-foreground font-medium px-1">Bu alan ilan başlığı ve açıklamalarında arama yapar.</p>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Fiyat Aralığı (₺)</Label>
               <div className="grid grid-cols-2 gap-3">
                  <Input 
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="Min" 
                    className="h-12 bg-primary/5 border-none rounded-xl font-technical font-bold text-center" 
                  />
                  <Input 
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="Max" 
                    className="h-12 bg-primary/5 border-none rounded-xl font-technical font-bold text-center" 
                  />
               </div>
            </div>

            {/* Year Range */}
            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Model Yılı</Label>
               <div className="grid grid-cols-2 gap-3">
                  <Input 
                    value={yearMin}
                    onChange={(e) => setYearMin(e.target.value)}
                    placeholder="Min" 
                    className="h-12 bg-primary/5 border-none rounded-xl font-technical font-bold text-center" 
                  />
                  <Input 
                    value={yearMax}
                    onChange={(e) => setYearMax(e.target.value)}
                    placeholder="Max" 
                    className="h-12 bg-primary/5 border-none rounded-xl font-technical font-bold text-center" 
                  />
               </div>
            </div>

            {/* More filters can go here (Fuel, Gear, etc.) */}

          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t bg-muted/20 space-y-3">
             <Button 
               onClick={handleApply}
               className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest cta-button"
             >
                Sonuçları Göster
             </Button>
             <Button 
               onClick={handleClear}
               variant="ghost" 
               className="w-full h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
             >
                Filtreleri Temizle
             </Button>
          </div>
        </div>
      </div>
    </>
  )
}
