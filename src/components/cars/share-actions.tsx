"use client"

import { useState } from "react"
import { Share2, Copy, MessageCircle, Check, Share, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ShareActionsProps {
  maskedSlug: string
  title?: string
}

export function ShareActions({ maskedSlug, title }: ShareActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/p/${maskedSlug}`
    : ""

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`İlanı incele: ${shareUrl}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || "Araç İlanı - GaleriLink",
          text: "Müşteri özel ilan linki",
          url: shareUrl,
        })
      } catch (err) {
        console.error("Error sharing:", err)
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        size="xs"
        className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 font-bold uppercase tracking-widest text-[10px] h-[22px] gap-1.5 rounded-full px-3 py-0 transition-all active:scale-95"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Share2 className="w-3 h-3" />
        Paylaş
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-border/40 p-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
            <div className="px-3 py-2 border-bottom mb-1">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Müşteri Paylaşım</span>
            </div>
            
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/5 text-left transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:bg-blue-500/20">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">Linki Kopyala</span>
                <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{copied ? 'Kopyalandı!' : 'Doğrudan Link'}</span>
              </div>
            </button>

            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-500/5 text-left transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500/20">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">WhatsApp</span>
                <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Hızlı Gönder</span>
              </div>
            </button>

            {typeof navigator !== "undefined" && !!navigator.share && (
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-orange-500/5 text-left transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center group-hover:bg-orange-500/20">
                  <Share className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">Diğer Uygulamalar</span>
                  <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Instagram / Facebook</span>
                </div>
              </button>
            )}

            <div className="mt-2 pt-2 border-t border-border/40 px-3 pb-1">
               <p className="text-[8px] text-muted-foreground leading-tight italic font-medium">Bu link sadece müşteri bilgilerini içerir, B2B fiyatları gizlidir.</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
