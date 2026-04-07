"use client"

import { useState, useEffect } from "react"
import { Flame, Clock } from "lucide-react"

interface OpportunityBadgeProps {
  expiresAt: string
  reason?: string
  variant?: "card" | "detail"
}

function getTimeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return null

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days}g ${remainingHours}s`
  }

  if (hours > 0) return `${hours}s ${minutes}dk`
  if (minutes > 0) return `${minutes}dk ${seconds}sn`
  return `${seconds}sn`
}

export function OpportunityBadge({ expiresAt, reason, variant = "card" }: OpportunityBadgeProps) {
  const [timeLeft, setTimeLeft] = useState<string | null>(() => getTimeLeft(expiresAt))

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeLeft(expiresAt)
      setTimeLeft(remaining)
      if (!remaining) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  if (!timeLeft) return null

  if (variant === "detail") {
    return (
      <div className="w-full bg-gradient-to-r from-[#D4AF37]/15 via-[#D4AF37]/5 to-transparent border border-[#D4AF37]/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 glass-node relative overflow-hidden">
        <div className="absolute inset-0 subtle-scanline opacity-30 pointer-events-none" />
        <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <Flame className="w-5 h-5 text-[#D4AF37]" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Fırsat Havuzu İlanı</h4>
            {reason && (
              <p className="text-xs font-bold text-white/90 uppercase tracking-wide mt-0.5">{reason}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#D4AF37]/20 px-5 py-2.5 rounded-xl pulse-gold shrink-0 border border-[#D4AF37]/30 relative z-10">
          <Clock className="w-4 h-4 text-[#D4AF37]" />
          <span className="font-technical text-base font-black text-[#D4AF37] tabular-nums tracking-tighter">{timeLeft}</span>
        </div>
      </div>
    )
  }

  // Card variant (compact)
  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-[#D4AF37] px-3 py-1.5 rounded-lg shadow-xl border border-[#FFD700]/30">
      <Flame className="w-3.5 h-3.5 text-white" fill="currentColor" />
      <span className="font-technical text-[11px] font-black text-white tabular-nums tracking-tight">{timeLeft}</span>
    </div>
  )
}
