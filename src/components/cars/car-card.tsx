"use client"

import { useState } from "react"
import { useCustomerMode } from "@/components/providers/customer-mode-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Gauge, Store, CheckCircle2, ChevronRight, Zap, Trash2, Share2, Check, Banknote } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { DeleteCarModal } from "./delete-car-modal"
import { OpportunityBadge } from "./opportunity-badge"
import { OfferModal } from "./offer-modal"

export function CarCard({ car, showDelete = false }: { car: any; showDelete?: boolean }) {
  const { isCustomerMode } = useCustomerMode()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [offerOpen, setOfferOpen] = useState(false)

  const isOpportunity = car.is_opportunity && car.opportunity_expires_at

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!car.masked_slug) {
      alert("Bu araç için gizli link henüz oluşturulmamış veya API'den alınamamış."); 
      return;
    }
    
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${car.masked_slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  }

  const formattedPrice = new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: 'TRY', 
    maximumFractionDigits: 0 
  }).format(car.price_b2b)
  
  const locationText = car.location_district && car.location_city 
    ? `${car.location_district}, ${car.location_city}` 
    : (car.location_city || car.profiles?.city || "Belirsiz")

  const cardContent = (
    <Card className={cn(
      "bento-card overflow-hidden h-full flex flex-col border-none ring-1 ring-border/50 relative",
      isOpportunity && "opportunity-card ring-[#D4AF37]/40"
    )}>
      {/* Visual Header */}
      <div className="aspect-[4/3] w-full bg-muted relative overflow-hidden shrink-0">
        {car.images && car.images[0] ? (
          <img 
            src={car.images[0]} 
            alt={`${car.brand} ${car.model}`} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" 
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-muted-foreground text-[10px] font-black uppercase tracking-widest bg-muted/50">
            Fotoğraf Yok
          </div>
        )}
        
        {/* Opportunity Badge */}
        {isOpportunity && <OpportunityBadge expiresAt={car.opportunity_expires_at} />}

        {/* Shimmer Overlay for Opportunity */}
        {isOpportunity && <div className="absolute inset-0 opportunity-glow opacity-30 pointer-events-none" />}

        {/* Glass Year Badge */}
        <div className="absolute top-3 right-3 bg-white/20 dark:bg-white/10 backdrop-blur-xl border border-white/30 dark:border-white/20 px-3 py-1.5 rounded-xl shadow-lg ring-1 ring-black/5">
           <span className="font-technical text-sm font-black text-white drop-shadow-md">{car.year}</span>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
      </div>
      
      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col space-y-4">
        <div className="space-y-1">
           <div className="flex items-center gap-1.5 text-muted-foreground font-black text-[9px] uppercase tracking-[0.2em] mb-1">
              <span>{car.brand}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{car.model}</span>
           </div>
           <h3 className="font-black text-lg leading-tight uppercase text-primary tracking-tighter line-clamp-2 min-h-[2.8rem] group-hover:text-primary transition-colors">
              {car.title || `${car.brand} ${car.model}`}
           </h3>
        </div>

        {/* Quick Specs Grid */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/40">
           <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary/60">
                 <Gauge className="w-3.5 h-3.5" />
              </div>
              <span className="font-technical text-xs font-bold text-primary truncate tracking-tight">
                 {car.km?.toLocaleString('tr-TR')} <span className="text-[9px] opacity-60">KM</span>
              </span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary/60">
                 <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-primary/70 truncate uppercase tracking-tight" title={locationText}>
                 {car.location_city}
              </span>
           </div>
        </div>
      </div>

      {/* B2B Price & Action Area */}
      <div className="mt-auto">
         {!isCustomerMode ? (
            <div className="bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden group/price transition-colors duration-500">
               <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                     <span className="text-[8px] font-black text-muted-foreground dark:text-white/30 uppercase tracking-widest block">B2B Ağ Fiyatı</span>
                     <p className="font-technical text-lg font-black text-foreground dark:text-white tracking-tighter leading-none">{formattedPrice}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = `tel:${car.profiles?.phone}`;
                    }}
                    className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-white/10 hover:bg-primary dark:hover:bg-white text-primary dark:text-white hover:text-white dark:hover:text-primary transition-all flex items-center justify-center shadow-lg border border-primary/10 dark:border-white/10"
                  >
                     <Phone className="w-4 h-4" />
                  </button>
               </div>
            </div>
         ) : (
            <div className="bg-primary/5 p-4 border-t border-primary/10 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">İlan Yayında</span>
               </div>
               <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-primary gap-1">
                  İncele <ChevronRight className="w-3 h-3" />
               </div>
            </div>
         )}

          {/* Opportunity Quick Offer Button */}
          {isOpportunity && !isCustomerMode && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOfferOpen(true); }}
              className="w-full flex items-center justify-center gap-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] py-3.5 transition-all border-t border-[#D4AF37]/20 font-black text-[10px] uppercase tracking-[0.2em]"
            >
               <Banknote className="w-4 h-4" />
               Hızlı Nakit Teklif Ver
            </button>
          )}

         {/* Seller Meta (Small) */}
         {!isCustomerMode && car.profiles && (
            <div className="px-5 py-3 border-t border-border/20 flex items-center justify-between gap-2 overflow-hidden bg-muted/10">
               <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-white border border-primary/5 flex items-center justify-center text-primary shrink-0">
                     <Store className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tight">
                     {car.profiles.company_name}
                  </span>
               </div>
               <div className="shrink-0 flex items-center">
                  <Zap className="w-3 h-3 text-emerald-500" />
               </div>
            </div>
         )}
      </div>
    </Card>
  )

  return (
    <div className="relative h-full group">
      {/* Delete Button - Positioned OUTSIDE the Link to avoid navigation conflict */}
      {showDelete && (
        <div className="absolute top-3 left-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={() => setDeleteOpen(true)}
            className="w-9 h-9 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:bg-destructive hover:text-white hover:border-destructive/50 transition-all"
            title="İlanı Sil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:bg-primary hover:text-white hover:border-primary/50 transition-all"
            title="Gizli Linki Kopyala"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      <Link href={`/dashboard/cars/${car.id}`} className="block h-full">
        {cardContent}
      </Link>

      {/* Delete Confirmation Modal */}
      {showDelete && (
        <DeleteCarModal
          carId={car.id}
          carTitle={car.title || `${car.brand} ${car.model}`}
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
        />
      )}

      {/* Offer Modal */}
      <OfferModal
        listingId={car.id}
        ownerId={car.seller_id}
        carTitle={car.title || `${car.brand} ${car.model}`}
        isOpen={offerOpen}
        onClose={() => setOfferOpen(false)}
      />
    </div>
  )
}
