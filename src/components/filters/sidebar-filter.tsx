"use client"

import { useState, useEffect } from "react"
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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleApply = () => {
    onFilterChange({
      keyword,
      price: { min: priceMin, max: priceMax },
      year: { min: yearMin, max: yearMax }
    })
    if (isMobile) onToggle()
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
      {/* 💻 DESKTOP Sidebar Toggle Pin (HIDDEN ON MOBILE) */}
      <div className={cn(
        "fixed left-0 top-1/2 -translate-y-1/2 z-[40] hidden md:block transition-all duration-500",
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

      {/* 🌑 MOBILE Overlay/Backdrop (ONLY ON MOBILE) */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" 
          onClick={onToggle} 
        />
      )}

      {/* 🛡️ SIDEBAR / MOBILE MODAL PANEL */}
      <div className={cn(
        "fixed transition-all duration-700 ease-in-out transform z-[110]",
        // Desktop Styles
        "md:inset-y-0 md:left-0 md:w-80 md:bg-card/80 md:backdrop-blur-3xl md:border-r",
        isOpen ? "md:translate-x-0" : "md:-translate-x-full md:shadow-none",
        // Mobile Styles
        "inset-x-0 bottom-0 top-[8dvh] w-full bg-slate-900 border-t border-white/10 rounded-t-[3rem] shadow-2xl md:top-0 md:rounded-none h-[92dvh] md:h-auto",
        isMobile && (isOpen ? "translate-y-0" : "translate-y-full")
      )}>
        <div className="flex flex-col h-full relative">
          
          {/* Mobile Handle Bar */}
          <div className="md:hidden flex justify-center py-4 shrink-0">
            <div className="w-12 h-1 bg-white/10 rounded-full" />
          </div>

          <div className="flex-1 overflow-y-auto p-8 pt-2 md:pt-8 custom-scrollbar space-y-10 pb-40">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">FİLTRELEYİN</h2>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Kriterlerinizi Belirleyin</p>
              </div>
              <button 
                onClick={onToggle}
                className="md:hidden w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl text-white/40 active:bg-red-500/20 active:text-red-500 transition-colors"
                title="Kapat"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Keyword Search */}
            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Kendi Kelimelerinizle Ara</Label>
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                  <Input 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Değişensiz, acil, nakit..." 
                    className="h-16 pl-12 bg-white/5 border-2 border-white/5 rounded-[1.25rem] font-black text-white placeholder:text-white/10 focus-visible:border-primary/50 focus-visible:ring-0 transition-all"
                  />
               </div>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Fiyat Aralığı (₺)</Label>
               <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Input 
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      placeholder="Minimum" 
                      className="h-14 bg-white/5 border-2 border-white/5 rounded-2xl font-technical font-black text-center text-white focus-visible:border-primary/50" 
                    />
                  </div>
                  <div className="relative">
                    <Input 
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      placeholder="Maksimum" 
                      className="h-14 bg-white/5 border-2 border-white/5 rounded-2xl font-technical font-black text-center text-white focus-visible:border-primary/50" 
                    />
                  </div>
               </div>
            </div>

            {/* Year Range */}
            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Model Yılı</Label>
               <div className="grid grid-cols-2 gap-4">
                  <Input 
                    value={yearMin}
                    onChange={(e) => setYearMin(e.target.value)}
                    placeholder="En Eski" 
                    className="h-14 bg-white/5 border-2 border-white/5 rounded-2xl font-technical font-black text-center text-white focus-visible:border-primary/50" 
                  />
                  <Input 
                    value={yearMax}
                    onChange={(e) => setYearMax(e.target.value)}
                    placeholder="En Yeni" 
                    className="h-14 bg-white/5 border-2 border-white/5 rounded-2xl font-technical font-black text-center text-white focus-visible:border-primary/50" 
                  />
               </div>
            </div>
          </div>

          {/* 🏁 ACTION AREA (Stick to bottom on mobile) */}
          <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-12 md:static md:p-6 md:border-t md:bg-muted/20 md:from-transparent">
             <div className="flex flex-col gap-3">
               <Button 
                 onClick={handleApply}
                 className="w-full h-20 md:h-14 rounded-3xl text-lg font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/40 group relative overflow-hidden active:scale-95 transition-all"
               >
                  <span className="relative z-10">SONUÇLARI GÖR</span>
               </Button>
               <Button 
                 onClick={handleClear}
                 variant="ghost" 
                 className="w-full h-10 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors"
               >
                  AYARLARI SIFIRLA
               </Button>
             </div>
          </div>

        </div>
      </div>
    </>
  )
}
