"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { ChevronRight, Search, Check, Loader2, ArrowLeft, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  level: string;
  logo_url?: string;
}

interface TaxonomyColumnSelectorProps {
  onSelect: (item: TaxonomyItem, path: TaxonomyItem[]) => void;
  onManualMode: (level: string, currentPath: TaxonomyItem[]) => void;
  initialPath?: TaxonomyItem[];
}

const LEVELS = [
  'kategori', 'marka', 'model', 'seri', 'motor', 'sanziman', 'kasa', 'paket'
]

const LEVEL_LABELS: Record<string, string> = {
  kategori: 'Kategori',
  marka: 'Marka',
  model: 'Model',
  seri: 'Seri',
  motor: 'Motor Tipi',
  sanziman: 'Şanzıman',
  kasa: 'Kasa Tipi',
  paket: 'Paket'
}

export function TaxonomyColumnSelector({ onSelect, onManualMode, initialPath = [] }: TaxonomyColumnSelectorProps) {
  const [path, setPath] = useState<TaxonomyItem[]>(initialPath)
  const [columns, setColumns] = useState<{ level: string; items: TaxonomyItem[]; loading: boolean }[]>([])
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const containerRef = useRef<HTMLDivElement>(null)
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load initial root level (kategori)
  useEffect(() => {
    loadColumn('kategori', null, 0)
  }, [])

  // Auto-scroll to right when new column added (Desktop)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: containerRef.current.scrollWidth,
        behavior: 'smooth'
      })
    }
  }, [columns.length])

  // Reset mobile scroll on level change
  useEffect(() => {
    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo(0, 0)
    }
    // Aggressive window scroll to top on mobile step change
    const scrollTimeout = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' })
      // Some mobile browsers need body/html scroll
      document.documentElement.scrollTo(0, 0)
      document.body.scrollTo(0, 0)
    }, 50)
    
    return () => clearTimeout(scrollTimeout)
  }, [mobileActiveIndex])

  async function loadColumn(level: string, parentId: string | null, index: number) {
    const nextLevelIndex = index
    
    // Remove all columns after the current index
    setColumns(prev => prev.slice(0, nextLevelIndex))
    setColumns(prev => [...prev, { level, items: [], loading: true }])

    let query = supabase
      .from('car_taxonomy')
      .select('*')
      .eq('level', level)
      .order('name', { ascending: true })

    if (parentId === null) {
      query = query.is('parent_id', null)
    } else {
      query = query.eq('parent_id', parentId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to load taxonomy:', error.message)
      setColumns(prev => {
        const updated = [...prev]
        if (updated[nextLevelIndex]) updated[nextLevelIndex].loading = false
        return updated
      })
      return
    }

    setColumns(prev => {
      const updated = [...prev]
      if (updated[nextLevelIndex]) {
        updated[nextLevelIndex] = { level, items: data || [], loading: false }
      }
      return updated
    })
  }

  const handleSelect = (item: TaxonomyItem, columnIndex: number) => {
    const newPath = [...path.slice(0, columnIndex), item]
    setPath(newPath)

    const nextLevelIndex = columnIndex + 1
    const nextLevel = LEVELS[nextLevelIndex]

    if (nextLevel) {
      setDirection('forward')
      setMobileActiveIndex(nextLevelIndex)
      loadColumn(nextLevel, item.id, nextLevelIndex)
    } else {
      // Leaf node selected (Package)
      onSelect(item, newPath)
    }
  }

  const handleGoBack = () => {
    if (mobileActiveIndex > 0) {
      setDirection('backward')
      setMobileActiveIndex(prev => prev - 1)
      setPath(prev => prev.slice(0, mobileActiveIndex - 1))
      mobileScrollRef.current?.scrollTo(0, 0)
    }
  }

  const activeCol = columns[mobileActiveIndex]

  return (
    <div className="space-y-6">
      {/* 💻 DESKTOP VERSION (Sticky Columns) */}
      <div className="hidden md:block space-y-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground bg-muted/30 p-4 rounded-2xl overflow-x-auto no-scrollbar">
          <span>Vasıta</span>
          {path.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 opacity-30" />
              <span className="text-primary">{item.name}</span>
            </div>
          ))}
        </div>

        <div 
          ref={containerRef}
          className="flex gap-4 overflow-x-auto pb-6 no-scrollbar min-h-[400px]"
        >
          {columns.map((col, colIndex) => (
            <div 
              key={`${col.level}-${colIndex}`}
              className="w-72 shrink-0 bento-card rounded-3xl overflow-hidden flex flex-col border-primary/5 animate-in slide-in-from-left-4 fade-in duration-500 h-[400px]"
            >
              <div className="p-4 border-b bg-muted/10 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {LEVEL_LABELS[col.level] || col.level} Seçin
                </span>
                {col.loading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {col.items.map((item) => {
                  const isSelected = path[colIndex]?.id === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item, colIndex)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all group",
                        isSelected 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                          : "hover:bg-primary/5 text-foreground/70"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {item.logo_url && (
                          <img src={item.logo_url} alt={item.name} className="w-6 h-6 object-contain rounded bg-white p-0.5" />
                        )}
                        <span>{item.name}</span>
                      </div>
                      {isSelected ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </button>
                  )
                })}
                {!col.loading && (
                  <button
                    onClick={() => onManualMode(col.level, path.slice(0, colIndex))}
                    className="w-full flex items-center justify-center p-4 mt-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-primary hover:bg-primary/5 border border-dashed border-primary/10 transition-all"
                  >
                    Aracımı Bulamadım
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 📱 MOBILE VERSION (Drill-down) */}
      <div className="md:hidden space-y-4">
        {/* Mobile Header with Breadcrumb & Back */}
        <div className="bg-slate-900 border border-white/5 p-4 rounded-3xl space-y-3 shadow-xl">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {mobileActiveIndex > 0 && (
                  <button 
                    onClick={handleGoBack}
                    className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-white active:scale-90 transition-transform"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{LEVEL_LABELS[activeCol?.level] || 'Kategori'} SEÇİN</span>
                  <h3 className="text-sm font-black text-white uppercase italic tracking-tight">
                    {mobileActiveIndex === 0 ? 'Vasıta Türü' : path[mobileActiveIndex - 1]?.name}
                  </h3>
                </div>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-xl">
                 <Building2 className="w-5 h-5 text-primary opacity-50" />
              </div>
           </div>

           {/* Mobile Breadcrumb Inline */}
           <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap py-1">
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Vasıta</span>
              {path.map((item, i) => (
                <div key={item.id} className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                  <ChevronRight className="w-2.5 h-2.5 text-white/10" />
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">{item.name}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Active Column Content */}
        <div 
          ref={mobileScrollRef}
          className="relative overflow-hidden min-h-[350px] overflow-y-auto max-h-[70vh] custom-scrollbar"
        >
           <div 
             key={mobileActiveIndex}
             className={cn(
               "space-y-2 animate-in duration-300",
               direction === 'forward' ? "slide-in-from-right-full" : "slide-in-from-left-full"
             )}
           >
              {activeCol?.loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4 opacity-50">
                   <Loader2 className="w-10 h-10 animate-spin text-primary" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Yükleniyor...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-2">
                    {activeCol?.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item, mobileActiveIndex)}
                        className="w-full flex items-center justify-between p-5 bg-slate-900 border border-white/5 rounded-2xl active:bg-primary/20 active:border-primary/30 transition-all text-left group"
                      >
                        <div className="flex items-center gap-4">
                          {item.logo_url ? (
                            <div className="w-12 h-12 bg-white rounded-xl p-2 flex items-center justify-center shadow-lg">
                              <img src={item.logo_url} alt={item.name} className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                              <span className="text-[10px] font-black text-white/20 italic">{item.name.charAt(0)}</span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-white uppercase tracking-tight italic group-active:text-primary transition-colors">{item.name}</span>
                            <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{LEVEL_LABELS[item.level]} Bilgisi</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/20 group-active:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>

                  {/* Mobile Search/Manual Section */}
                  {activeCol && (
                    <div className="pt-4">
                      <button
                        onClick={() => onManualMode(activeCol.level, path.slice(0, mobileActiveIndex))}
                        className="w-full h-16 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/5 active:scale-95 transition-all bg-primary/5 shadow-lg shadow-primary/5"
                      >
                        Aradığım {LEVEL_LABELS[activeCol.level] || activeCol.level} Yok
                      </button>
                    </div>
                  )}
                </>
              )}
           </div>
        </div>
      </div>
    </div>
  )
}
