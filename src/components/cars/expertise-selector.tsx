"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Check, X, Info } from "lucide-react"

export type ExpertiseState = "original" | "painted" | "local_painted" | "changed"

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
  original: "#9ca3af", // Gray-400 (Orijinal)
  local_painted: "#f97316", // Orange-500 (Lokal Boyalı)
  painted: "#60a5fa", // Blue-400 (Boyalı)
  changed: "#ef4444", // Red-500 (Değişen)
}

const STATE_INITIALS: Record<ExpertiseState, string> = {
  original: "",
  local_painted: "L",
  painted: "B",
  changed: "D",
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

export function ExpertiseSelector({ value = {}, onChange, readOnly = false }: ExpertiseSelectorProps) {
  const currentData = { ...value }
  const [selectedPart, setSelectedPart] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setSelectedPart(null)
      }
    }
    if (selectedPart) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [selectedPart])

  const handleStateSelect = (state: ExpertiseState) => {
    if (!selectedPart || readOnly || !onChange) return
    
    onChange({
      ...currentData,
      [selectedPart]: state,
    })
    setSelectedPart(null)
  }

  const renderPart = (id: string, pathData: string, labelX: number, labelY: number, transform?: string) => {
    const state = currentData[id] || "original"
    const isActive = selectedPart === id
    const initial = STATE_INITIALS[state]

    return (
      <g 
        key={id} 
        className={cn("transition-all duration-200", readOnly ? "cursor-default" : "cursor-pointer group")}
        onClick={() => !readOnly && setSelectedPart(id === selectedPart ? null : id)}
        transform={transform}
      >
        <path
          d={pathData}
          fill={STATE_COLORS[state]}
          stroke={isActive ? "white" : "rgba(0,0,0,0.2)"}
          strokeWidth={isActive ? "2" : "0.5"}
          className={cn("transition-colors", !readOnly && "group-hover:opacity-90")}
        />
        {initial && (
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="12"
            fontWeight="900"
            className="pointer-events-none select-none"
            transform={transform ? `translate(${labelX}, ${labelY}) scale(1) translate(-${labelX}, -${labelY})` : ""}
          >
            {initial}
          </text>
        )}
      </g>
    )
  }

  return (
    <div className="relative w-full flex flex-col items-center bg-[#0a0a0a] p-6 lg:p-10 rounded-3xl border border-white/5 shadow-2xl">
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mb-10">
        {(Object.keys(STATE_LABELS) as ExpertiseState[]).map((key) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: STATE_COLORS[key] }} />
            <span className="text-xs font-bold text-gray-400">{STATE_LABELS[key]}</span>
          </div>
        ))}
      </div>

      <div className="relative w-full flex justify-center items-center overflow-visible select-none">
        {/* Expertise SVG - Original Professional Paths */}
        <svg
          viewBox="0 0 227 303"
          className="w-full max-w-[400px] h-auto filter drop-shadow-xl"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="translate(1.0, 1.0)">
            {/* MIDDLE COLUMN */}
            {renderPart("on_tampon", "M98,60.08 C101.01,61.32 104.19,62 107.45,62 L120.16,62 C122.78,62 124.95,59.8 125.07,57.0 L125.63,43.99 C126,30.41 126,16.4 126,16.31 C126,16.23 126,16.11 126,16 C126,1.78 125.67,-11.91 125.07,-25.0 C124.95,-27.8 122.78,-30 120.16,-30 L107.45,-30 C104.19,-30 101.01,-29.36 98,-28.08 L98,60.08 Z", 112, 16, "translate(112, 16) rotate(-90) translate(-112, -16)")}
            
            {renderPart("on_kaput", "M83,55 C83,55 94.89,86.4 83,122 L125.9,122 C125.9,122 142.31,115.72 140.91,88.88 C139.51,62.04 125.9,55 125.9,55 L83,55 Z", 112, 88.5, "translate(112, 88.5) rotate(-90) translate(-112, -88.5)")}
            
            {renderPart("tavan", "M87.1,151 C87.1,151 78.51,172.53 86.18,200 L136.89,200 C136.89,200 143.88,175.1 136.89,151 L87.1,151 Z", 111.5, 175.5, "translate(111.5, 175.5) rotate(-90) translate(-111.5, -175.5)")}
            
            {renderPart("arka_bagaj", "M126,205.02 L106.68,205.02 C106.68,205.02 98,204.01 98,215.13 C98,226.26 98,266.16 98,266.16 C98,266.16 99.37,273 104.85,273 C110.33,273 126,273 126,273 C126,273 119.1,243.66 126,205.02 Z", 112, 239, "translate(112, 239) rotate(-90) translate(-112, -239)")}
            
            {renderPart("arka_tampon", "M126,241.91 C122.98,240.67 119.8,240 116.54,240 L103.83,240 C101.21,240 99.04,242.19 98.92,244.99 C98.36,258.00 98,271.58 98,285.68 C98,285.76 98,285.88 98,286 C98,300.21 98.32,313.91 98.92,327.00 C99.04,329.80 101.21,332 103.83,332 L116.54,332 C119.8,332 122.98,331.36 126,330.08 L126,241.91 Z", 112, 286, "translate(112, 286) rotate(-90) translate(-112, -286)")}

            {/* LEFT WING */}
            {renderPart("on_sol", "M14.5,52 L57.19,45.05 C57.19,45.05 69.23,41.61 70.49,38.37 C71.74,35.12 72.39,32.97 71.74,30.59 C71.1,28.21 69.46,22.51 69.46,22.51 C69.46,22.51 72.12,17.75 68.97,17.75 C65.81,17.75 56.17,17 56.17,17 C56.17,17 58.03,41.98 35.69,42.31 C15.18,42.62 15.71,20.28 15.71,20.28 L11,20.28 C11,20.28 15.59,38.14 11,52 L14.5,52 Z", 41.5, 34.5, "translate(31.52, 155.5) scale(-1, 1) translate(-31.52, -155.5) translate(0.02, 52) translate(41.5, 34.5) scale(-1, 1) rotate(-90) translate(-41.5, -34.5)")}
            
            {renderPart("on_sol_kapi", "M6.98,98.12 L6.98,118 L52.62,118 C53.3,118 53.9,117.5 54.01,116.82 L54.24,115.5 C55.67,106.43 55.06,97.02 52.51,88.21 C51.61,85.15 49.61,82.55 46.91,80.88 C34.31,73.25 19.95,68.86 5.33,68.11 L3,68 L5.4,80.84 C6.45,86.51 6.98,92.33 6.98,98.12 Z", 29, 93, "translate(31.52, 155.5) scale(-1, 1) translate(-31.52, -155.5) translate(0.02, 52) translate(29, 93) rotate(-90) translate(-29, -93)")}
            
            {renderPart("arka_sol_kapi", "M13.05,141.69 L13.08,141.77 C14.88,144.79 17.18,147.47 19.88,149.69 C21.27,150.83 22.47,152.11 23.45,153.47 C24.42,154.79 24.95,155.88 25.51,157.01 C26,157.96 26.49,158.98 27.28,160.22 C28.06,161.43 28.93,162.6 29.87,163.69 C31.07,165.09 32.61,165.92 34.07,165.96 C36.02,166 38.73,166 42.14,166 C46.57,166 51.08,165.96 53,165.96 L53,146.11 C53,140.45 52.47,134.79 51.42,129.24 L48.94,116 L38.28,116 C29.72,116 21.19,118.11 13.61,122.07 L9.93,124 C8.13,124.94 6.81,126.49 6.14,128.41 C5.87,129.16 5.99,130 6.4,130.71 L13.05,141.69 Z", 29.5, 141, "translate(31.52, 155.5) scale(-1, 1) translate(-31.52, -155.5) translate(0.02, 52) translate(29.5, 141) rotate(-90) translate(-29.5, -141)")}
            
            {renderPart("arka_sol", "M13.91,168.01 C13.91,168.01 19.05,166.4 26.95,167.20 L31.46,166.96 C31.46,166.96 39.21,160.76 41.58,161.00 C43.95,161.28 48.06,167.97 48.06,167.97 L57,184.07 C56.88,183.87 44.23,181.25 38.38,185.23 C33.32,188.70 29.40,194.17 28.73,199.97 L28.06,203.99 C28.06,203.99 20.23,204.31 17.70,198.56 C15.17,192.80 12.21,190.75 12.21,190.75 C12.21,190.75 11.42,181.97 12.88,179.80 C14.3,177.67 13.91,168.01 13.91,168.01 Z", 34.5, 182.5, "translate(31.52, 155.5) scale(-1, 1) translate(-31.52, -155.5) translate(0.02, 52) translate(34.5, 182.5) rotate(-90) translate(-34.5, -182.5)")}

            {/* RIGHT WING */}
            {renderPart("on_sag", "M14.5,52 L57.19,45.05 C57.19,45.05 69.23,41.61 70.49,38.37 C71.74,35.12 72.39,32.97 71.74,30.59 C71.1,28.21 69.46,22.51 69.46,22.51 C69.46,22.51 72.12,17.75 68.97,17.75 C65.81,17.75 56.17,17 56.17,17 C56.17,17 58.03,41.98 35.69,42.31 C15.18,42.62 15.71,20.28 15.71,20.28 L11,20.28 C11,20.28 15.59,38.14 11,52 L14.5,52 Z", 41.5, 34.5, "translate(162, 52) translate(41.5, 34.5) scale(-1, 1) rotate(-90) translate(-41.5, -34.5)")}
            
            {renderPart("on_sag_kapi", "M6.98,98.12 L6.98,118 L52.62,118 C53.3,118 53.9,117.5 54.01,116.82 L54.24,115.5 C55.67,106.43 55.06,97.02 52.51,88.21 C51.61,85.15 49.61,82.55 46.91,80.88 C34.31,73.25 19.95,68.86 5.33,68.11 L3,68 L5.4,80.84 C6.45,86.51 6.98,92.33 6.98,98.12 Z", 29, 93, "translate(162, 52) translate(29, 93) rotate(-90) translate(-29, -93)")}
            
            {renderPart("arka_sag_kapi", "M13.05,141.69 L13.08,141.77 C14.88,144.79 17.18,147.47 19.88,149.69 C21.27,150.83 22.47,152.11 23.45,153.47 C24.42,154.79 24.95,155.88 25.51,157.01 C26,157.96 26.49,158.98 27.28,160.22 C28.06,161.43 28.93,162.6 29.87,163.69 C31.07,165.09 32.61,165.92 34.07,165.96 C36.02,166 38.73,166 42.14,166 C46.57,166 51.08,165.96 53,165.96 L53,146.11 C53,140.45 52.47,134.79 51.42,129.24 L48.94,116 L38.28,116 C29.72,116 21.19,118.11 13.61,122.07 L9.93,124 C8.13,124.94 6.81,126.49 6.14,128.41 C5.87,129.16 5.99,130 6.4,130.71 L13.05,141.69 Z", 29.5, 141, "translate(162, 52) translate(29.5, 141) rotate(-90) translate(-29.5, -141)")}
            
            {renderPart("arka_sag", "M13.91,168.01 C13.91,168.01 19.05,166.4 26.95,167.20 L31.46,166.96 C31.46,166.96 39.21,160.76 41.58,161.00 C43.95,161.28 48.06,167.97 48.06,167.97 L57,184.07 C56.88,183.87 44.23,181.25 38.38,185.23 C33.32,188.70 29.40,194.17 28.73,199.97 L28.06,203.99 C28.06,203.99 20.23,204.31 17.70,198.56 C15.17,192.80 12.21,190.75 12.21,190.75 C12.21,190.75 11.42,181.97 12.88,179.80 C14.3,177.67 13.91,168.01 13.91,168.01 Z", 34.5, 182.5, "translate(162, 52) translate(34.5, 182.5) rotate(-90) translate(-34.5, -182.5)")}

            {/* Aesthetics (Windows, Wheels) */}
            <g fill="#222" opacity="0.6">
               <circle cx="21" cy="95" r="14" /> <circle cx="206" cy="95" r="14" />
               <circle cx="21" cy="225" r="14" /> <circle cx="206" cy="225" r="14" />
            </g>
          </g>
        </svg>

        {/* Float Menu */}
        {selectedPart && !readOnly && (
          <div 
            ref={menuRef}
            className="absolute z-50 bg-[#121212] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,1)] rounded-2xl p-2 min-w-[180px] animate-in zoom-in-95 duration-200"
            style={{ 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="text-[11px] font-black uppercase text-primary/80 tracking-widest px-4 py-2 border-b border-white/5 mb-1 text-center">
               {PART_LABELS[selectedPart]}
            </div>
            <div className="grid grid-cols-1 gap-1">
              {(Object.keys(STATE_LABELS) as ExpertiseState[]).map((state) => (
                <button
                  key={state}
                  onClick={() => handleStateSelect(state)}
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                    currentData[selectedPart] === state ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-gray-400"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: STATE_COLORS[state] }} />
                    {STATE_LABELS[state]}
                  </div>
                  {currentData[selectedPart] === state && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
            <button 
                onClick={() => setSelectedPart(null)}
                className="mt-2 w-full flex items-center justify-center py-2 text-gray-500 hover:text-white transition-colors border-t border-white/5"
            >
                <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="mt-8 flex items-center gap-3 bg-white/5 px-5 py-2 rounded-full border border-white/5">
           <Info className="w-4 h-4 text-gray-500" />
           <p className="text-[10px] font-bold uppercase text-gray-500 tracking-[0.2em]">
              Seçim İçin Parçaya Tıklayın
           </p>
        </div>
      )}
    </div>
  )
}
