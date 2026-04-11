"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { ChevronRight, Search, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area" // Assuming scroll-area will be added or using raw div

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
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load initial root level (kategori)
  useEffect(() => {
    loadColumn('kategori', null, 0)
  }, [])

  // Auto-scroll to right when new column added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: containerRef.current.scrollWidth,
        behavior: 'smooth'
      })
    }
  }, [columns.length])

  async function loadColumn(level: string, parentId: string | null, index: number) {
    const nextLevelIndex = index
    
    // Remove all columns after the current index if we are changing selection
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
        updated[nextLevelIndex] = { ...updated[nextLevelIndex], loading: false }
        return updated
      })
      return
    }

    setColumns(prev => {
      const updated = [...prev]
      updated[nextLevelIndex] = { level, items: data || [], loading: false }
      return updated
    })
  }

  const handleSelect = (item: TaxonomyItem, columnIndex: number) => {
    const newPath = [...path.slice(0, columnIndex), item]
    setPath(newPath)

    const nextLevel = LEVELS[columnIndex + 1]
    if (nextLevel) {
      loadColumn(nextLevel, item.id, columnIndex + 1)
    } else {
      // Leaf node selected (Package)
      onSelect(item, newPath)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground bg-muted/30 p-4 rounded-2xl overflow-x-auto no-scrollbar">
        <span>Vasıta</span>
        {path.map((item, i) => (
          <div key={item.id} className="flex items-center gap-2">
            <ChevronRight className="w-3 h-3 opacity-30" />
            <span className="text-primary">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Columns Container */}
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
            
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin overscroll-y-contain">
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
              {/* "Can't find it" button inside each column */}
              {!col.loading && (
                <button
                  onClick={() => onManualMode(col.level, path.slice(0, colIndex))}
                  className="w-full flex items-center justify-center p-4 mt-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-primary hover:bg-primary/5 border border-dashed border-primary/10 transition-all"
                >
                  Aracımı Bulamadım
                </button>
              )}

              {!col.loading && col.items.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground p-8 text-center space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest">Veri Bulunamadı</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
