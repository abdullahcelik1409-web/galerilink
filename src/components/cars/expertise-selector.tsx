import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"

export type ExpertiseState = "original" | "local_painted" | "painted" | "changed"

export interface ExpertiseData {
  [key: string]: ExpertiseState
}

const PART_LABELS: Record<string, string> = {
  on_tampon: "Ön Tampon",
  on_kaput: "Motor Kaputu",
  tavan: "Tavan",
  arka_bagaj: "Bagaj Kapağı",
  arka_tampon: "Arka Tampon",
  on_sol: "Sol Ön Çamurluk",
  on_sol_kapi: "Sol Ön Kapı",
  arka_sol_kapi: "Sol Arka Kapı",
  arka_sol: "Sol Arka Çamurluk",
  on_sag: "Sağ Ön Çamurluk",
  on_sag_kapi: "Sağ Ön Kapı",
  arka_sag_kapi: "Sağ Arka Kapı",
  arka_sag: "Sağ Arka Çamurluk",
}

const STATE_COLORS: Record<ExpertiseState, string> = {
  original: "#334155", // Slate-700
  local_painted: "#f97316", // Orange-500
  painted: "#3b82f6", // Blue-500
  changed: "#ef4444", // Red-500
}

const STATE_LABELS: Record<ExpertiseState, string> = {
  original: "Orijinal",
  local_painted: "Lokal Boyalı",
  painted: "Boyalı",
  changed: "Değişen",
}

interface ExpertiseSelectorProps {
  value?: ExpertiseData
  onChange?: (value: ExpertiseData) => void
  readOnly?: boolean
}

// Alt Bileşen: Araç Şeması
function CarDiagram({
  data,
  onPartClick,
  readOnly
}: {
  data: ExpertiseData
  onPartClick: (id: string, event: React.MouseEvent) => void
  readOnly: boolean
}) {
  const renderPart = (id: string, pathData: string, transform?: string) => {
    const state = data[id] || "original"
    const color = STATE_COLORS[state]

    return (
      <g
        key={id}
        className={cn("transition-all duration-300", readOnly ? "cursor-default" : "cursor-pointer hover:brightness-125")}
        onClick={(e) => !readOnly && onPartClick(id, e)}
        transform={transform}
      >
        <path
          d={pathData}
          fill={color}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="0.8"
          className="transition-all duration-300"
        />
      </g>
    )
  }

  return (
    <div className="flex flex-col items-center bg-primary/5 dark:bg-slate-950/20 backdrop-blur-md p-8 rounded-[2.5rem] w-full border border-primary/10 dark:border-white/5 relative overflow-visible transition-colors duration-500">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
        {(Object.entries(STATE_LABELS) as [ExpertiseState, string][]).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2.5">
            <div className={cn(
               "w-3 h-3 rounded-full shadow-lg shadow-white/5",
               key === "original" && "bg-slate-700",
               key === "local_painted" && "bg-orange-500",
               key === "painted" && "bg-blue-500",
               key === "changed" && "bg-red-500"
            )} />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      <div className="relative w-full max-w-[320px] flex justify-center items-center overflow-visible select-none py-4">
        <svg viewBox="0 0 227 303" className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)]" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(1.0, 1.0)">
             {renderPart("on_tampon", "M98,60.08 C101.01,61.32 104.19,62 107.45,62 L120.16,62 C122.78,62 124.95,59.8 125.07,57.0 L125.63,43.99 C126,30.41 126,16.4 126,16.31 C126,16.23 126,16.11 126,16 C126,1.78 125.67,-11.91 125.07,-25.0 C124.95,-27.8 122.78,-30 120.16,-30 L107.45,-30 C104.19,-30 101.01,-29.36 98,-28.08 L98,60.08 Z", "translate(112, 16) rotate(-90) translate(-112, -16)")}
             {renderPart("on_kaput", "M83,55 C83,55 94.89,86.4 83,122 L125.9,122 C125.9,122 142.31,115.72 140.91,88.88 C139.51,62.04 125.9,55 125.9,55 L83,55 Z", "translate(112, 88.5) rotate(-90) translate(-112, -88.5)")}
             {renderPart("tavan", "M87.1,151 C87.1,151 78.51,172.53 86.18,200 L136.89,200 C136.89,200 143.88,175.1 136.89,151 L87.1,151 Z", "translate(111.5, 175.5) rotate(-90) translate(-111.5, -175.5)")}
             {renderPart("arka_bagaj", "M126,205.02 L106.68,205.02 C106.68,205.02 98,204.01 98,215.13 C98,226.26 98,266.16 98,266.16 C98,266.16 99.37,273 104.85,273 C110.33,273 126,273 126,273 C126,273 119.1,243.66 126,205.02 Z", "translate(112, 239) rotate(-90) translate(-112, -239)")}
             {renderPart("arka_tampon", "M126,241.91 C122.98,240.67 119.8,240 116.54,240 L103.83,240 C101.21,240 99.04,242.19 98.92,244.99 C98.36,258.00 98,271.58 98,285.68 C98,285.76 98,285.88 98,286 C98,300.21 98.32,313.91 98.92,327.00 C99.04,329.80 101.21,332 103.83,332 L116.54,332 C119.8,332 122.98,331.36 126,330.08 L126,241.91 Z", "translate(112, 286) rotate(-90) translate(-112, -286)")}

             <g transform="translate(16, 0)">
               {renderPart("on_sol", "M14.5,52 L57.19,45.05 C57.19,45.05 69.23,41.61 70.49,38.37 C71.74,35.12 72.39,32.97 71.74,30.59 C71.1,28.21 69.46,22.51 69.46,22.51 C69.46,22.51 72.12,17.75 68.97,17.75 C65.81,17.75 56.17,17 56.17,17 C56.17,17 58.03,41.98 35.69,42.31 C15.18,42.62 15.71,20.28 15.71,20.28 L11,20.28 C11,20.28 15.59,38.14 11,52 L14.5,52 Z", "translate(31.52, 155.5) scale(-1, 1) translate(-31.52, -155.5) translate(0.02, 52) translate(41.5, 34.5) scale(-1, 1) rotate(-90) translate(-41.5, -34.5)")}
               {renderPart("on_sol_kapi", "M6.98,98.12 L6.98,118 L52.62,118 C53.3,118 53.9,117.5 54.01,116.82 L54.24,115.5 C55.67,106.43 55.06,97.02 52.51,88.21 C51.61,85.15 49.61,82.55 46.91,80.88 C34.31,73.25 19.95,68.86 5.33,68.11 L3,68 L5.4,80.84 C6.45,86.51 6.98,92.33 6.98,98.12 Z", "translate(31.52, 155.5) scale(-1, 1) translate(-31.52, -155.5) translate(0.02, 52) translate(29, 93) rotate(-90) translate(-29, -93)")}
               {renderPart("arka_sol_kapi", "M13.05,141.69 L13.08,141.77 C14.88,144.79 17.18,147.47 19.88,149.69 C21.27,150.83 22.47,152.11 23.45,153.47 C24.42,154.79 24.95,155.88 25.51,157.01 C26,157.96 26.49,158.98 27.28,160.22 C28.06,161.43 28.93,162.6 29.87,163.69 C31.07,165.09 32.61,165.92 34.07,165.96 C36.02,166 38.73,166 42.14,166 C46.57,166 51.08,165.96 53,165.96 L53,146.11 C53,140.45 52.47,134.79 51.42,129.24 L48.94,116 L38.28,116 C29.72,116 21.19,118.11 13.61,122.07 L9.93,124 C8.13,124.94 6.81,126.49 6.14,128.41 C5.87,129.16 5.99,130 6.4,130.71 L13.05,141.69 Z", "translate(31.52, 155.5) scale(-1, 1) translate(-31.52, -155.5) translate(0.02, 52) translate(29.5, 141) rotate(-90) translate(-29.5, -141)")}
               {renderPart("arka_sol", "M13.91,168.01 C13.91,168.01 19.05,166.4 26.95,167.20 L31.46,166.96 C31.46,166.96 39.21,160.76 41.58,161.00 C43.95,161.28 48.06,167.97 48.06,167.97 L57,184.07 C56.88,183.87 44.23,181.25 38.38,185.23 C33.32,188.70 29.40,194.17 28.73,199.97 L28.06,203.99 C28.06,203.99 20.23,204.31 17.70,198.56 C15.17,192.80 12.21,190.75 12.21,190.75 C12.21,190.75 11.42,181.97 12.88,179.80 C14.3,177.67 13.91,168.01 13.91,168.01 Z", "translate(31.52, 155.5) scale(-1, 1) translate(-31.52, -155.5) translate(0.02, 52) translate(34.5, 182.5) rotate(-90) translate(-34.5, -182.5)")}
             </g>

             <g transform="translate(-16, 0)">
               {renderPart("on_sag", "M14.5,52 L57.19,45.05 C57.19,45.05 69.23,41.61 70.49,38.37 C71.74,35.12 72.39,32.97 71.74,30.59 C71.1,28.21 69.46,22.51 69.46,22.51 C69.46,22.51 72.12,17.75 68.97,17.75 C65.81,17.75 56.17,17 56.17,17 C56.17,17 58.03,41.98 35.69,42.31 C15.18,42.62 15.71,20.28 15.71,20.28 L11,20.28 C11,20.28 15.59,38.14 11,52 L14.5,52 Z", "translate(162, 52) translate(41.5, 34.5) scale(-1, 1) rotate(-90) translate(-41.5, -34.5)")}
               {renderPart("on_sag_kapi", "M6.98,98.12 L6.98,118 L52.62,118 C53.3,118 53.9,117.5 54.01,116.82 L54.24,115.5 C55.67,106.43 55.06,97.02 52.51,88.21 C51.61,85.15 49.61,82.55 46.91,80.88 C34.31,73.25 19.95,68.86 5.33,68.11 L3,68 L5.4,80.84 C6.45,86.51 6.98,92.33 6.98,98.12 Z", "translate(162, 52) translate(29, 93) rotate(-90) translate(-29, -93)")}
               {renderPart("arka_sag_kapi", "M13.05,141.69 L13.08,141.77 C14.88,144.79 17.18,147.47 19.88,149.69 C21.27,150.83 22.47,152.11 23.45,153.47 C24.42,154.79 24.95,155.88 25.51,157.01 C26,157.96 26.49,158.98 27.28,160.22 C28.06,161.43 28.93,162.6 29.87,163.69 C31.07,165.09 32.61,165.92 34.07,165.96 C36.02,166 38.73,166 42.14,166 C46.57,166 51.08,165.96 53,165.96 L53,146.11 C53,140.45 52.47,134.79 51.42,129.24 L48.94,116 L38.28,116 C29.72,116 21.19,118.11 13.61,122.07 L9.93,124 C8.13,124.94 6.81,126.49 6.14,128.41 C5.87,129.16 5.99,130 6.4,130.71 L13.05,141.69 Z", "translate(162, 52) translate(29.5, 141) rotate(-90) translate(-29.5, -141)")}
               {renderPart("arka_sag", "M13.91,168.01 C13.91,168.01 19.05,166.4 26.95,167.20 L31.46,166.96 C31.46,166.96 39.21,160.76 41.58,161.00 C43.95,161.28 48.06,167.97 48.06,167.97 L57,184.07 C56.88,183.87 44.23,181.25 38.38,185.23 C33.32,188.70 29.40,194.17 28.73,199.97 L28.06,203.99 C28.06,203.99 20.23,204.31 17.70,198.56 C15.17,192.80 12.21,190.75 12.21,190.75 C12.21,190.75 11.42,181.97 12.88,179.80 C14.3,177.67 13.91,168.01 13.91,168.01 Z", "translate(162, 52) translate(34.5, 182.5) rotate(-90) translate(-34.5, -182.5)")}
             </g>

             {/* Wheels for design */}
             <g fill="currentColor" className="text-primary/20 dark:text-[#222] dark:opacity-60">
                <circle cx="37" cy="95" r="14" /> <circle cx="190" cy="95" r="14" />
                <circle cx="37" cy="225" r="14" /> <circle cx="190" cy="225" r="14" />
             </g>
          </g>
        </svg>
      </div>
    </div>
  )
}

// Ana Sayfa/Merkez Bileşen
export function ExpertiseSelector({ value = {}, onChange, readOnly = false }: ExpertiseSelectorProps) {
  const currentData = { ...value }
  const [activePart, setActivePart] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number, y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handlePartClick = (id: string, event: React.MouseEvent) => {
    if (readOnly || !onChange) return
    
    // Calculate click position relative to the container
    if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMenuPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        })
        setActivePart(id)
    }
  }

  const handleSelectState = (state: ExpertiseState) => {
    if (!activePart || readOnly || !onChange) return
    onChange({ ...currentData, [activePart]: state })
    setActivePart(null)
    setMenuPos(null)
  }

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (activePart && containerRef.current && !containerRef.current.contains(e.target as Node)) {
            setActivePart(null)
            setMenuPos(null)
        }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [activePart])

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 relative">
      
      {/* 1. ÜST: ŞEMA */}
      <CarDiagram 
        data={currentData} 
        onPartClick={handlePartClick} 
        readOnly={readOnly} 
      />

      {/* Floating Menu */}
      {activePart && menuPos && !readOnly && (
        <div 
          className="absolute z-[100] w-40 bg-white/80 dark:bg-slate-900/40 backdrop-blur-2xl border border-primary/10 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200"
          style={{ 
            left: `${menuPos.x}px`, 
            top: `${menuPos.y}px`,
            transform: 'translate(-50%, -10px)'
          }}
        >
          <div className="p-2 border-b border-white/5 bg-white/5">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground dark:text-white/40 text-center">
                {PART_LABELS[activePart] || "Paröa Seçimi"}
            </p>
          </div>
          <div className="p-1.5 space-y-1">
             {(Object.entries(STATE_LABELS) as [ExpertiseState, string][]).map(([state, label]) => (
                <button
                   key={state}
                   onClick={() => handleSelectState(state)}
                   className={cn(
                     "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                     currentData[activePart] === state 
                       ? "bg-primary/20 text-primary" 
                       : "text-muted-foreground dark:text-white/60 hover:bg-primary/5 dark:hover:bg-white/5 hover:text-foreground dark:hover:text-white"
                   )}
                >
                   <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        state === "original" && "bg-slate-500",
                        state === "local_painted" && "bg-orange-500",
                        state === "painted" && "bg-blue-500",
                        state === "changed" && "bg-red-500"
                      )} />
                      {label}
                   </div>
                   {currentData[activePart] === state && <Check className="w-3 h-3" />}
                </button>
             ))}
             <div className="pt-1 mt-1 border-t border-white/5">
                <button 
                   onClick={() => setActivePart(null)}
                   className="w-full flex items-center justify-center gap-2 py-2 text-[8px] font-black uppercase text-muted-foreground/50 dark:text-white/30 hover:text-foreground dark:hover:text-white/60 transition-colors"
                >
                   <X className="w-3 h-3" />
                   Vazgeç
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
