"use client"

import { useCustomerMode } from "@/components/providers/customer-mode-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CarImageGallery } from "@/components/cars/car-image-gallery"
import { MapPin, Calendar, Gauge, Phone, Store, Info, ShieldCheck, ChevronLeft, Activity, Sparkles, CheckCircle2, Zap, Banknote, MessageCircle } from "lucide-react"
import { ExpertiseSelector } from "./expertise-selector"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ShareActions } from "./share-actions"
import { OpportunityBadge } from "./opportunity-badge"
import { OfferModal } from "./offer-modal"
import { CarOffersList } from "./car-offers-list"
import { useState } from "react"
import { VerificationModal } from "@/components/profile/verification-modal"

interface CarDetailViewProps {
  car: any
  isOwner?: boolean
  isVerified?: boolean
}

export function CarDetailView({ car, isOwner, isVerified = true }: CarDetailViewProps) {
  const { isCustomerMode } = useCustomerMode()
  const [offerOpen, setOfferOpen] = useState(false)
  const [verificationOpen, setVerificationOpen] = useState(false)

  const isOpportunity = car.is_opportunity && car.opportunity_expires_at

  const formattedPrice = new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: 'TRY', 
    maximumFractionDigits: 0 
  }).format(car.price_b2b)

  const blurClass = (!isVerified && !isOwner) ? "blur-xl select-none pointer-events-none opacity-50 font-black italic tracking-widest" : ""

  const PricingSection = () => (
    !isCustomerMode ? (
      <div className="bento-card p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] bg-slate-50 dark:bg-slate-950 text-foreground dark:text-white border-none shadow-2xl relative overflow-hidden group transition-all duration-500">
         <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
         <div className="relative z-10 space-y-6 md:space-y-8">
            <div>
              <span className="text-[10px] font-black text-muted-foreground dark:text-white/40 uppercase tracking-[0.3em] block mb-2">Ağ İçi B2B Fiyatı</span>
              <p className={cn("font-technical text-4xl sm:text-5xl md:text-6xl font-black text-foreground dark:text-white tracking-tighter leading-none transition-all duration-700", blurClass)}>
                {formattedPrice}
              </p>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap gap-2 mt-4 md:mt-6">
                 <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 py-1 px-3 rounded-full border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Ekspertiz Garantili
                 </div>
                 <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 py-1 px-3 rounded-full border border-blue-500/20 text-[9px] font-black uppercase tracking-widest">
                    <Zap className="w-3.5 h-3.5" />
                    Hemen Teslim
                 </div>
              </div>
            </div>

            <div className="space-y-4">
               {(!isVerified && !isOwner) ? (
                  <Button 
                    onClick={() => setVerificationOpen(true)}
                    className="w-full h-16 rounded-2xl text-[13px] md:text-sm font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 shadow-2xl shadow-primary/40 transition-all active:scale-95 px-4"
                  >
                     <ShieldCheck className="w-5 h-5 shrink-0" />
                     <span className="truncate">BİLGİLERİ GÖRMEK İÇİN DOĞRULA</span>
                  </Button>
               ) : (
                 <>
                   <Button className="w-full h-14 md:h-16 rounded-2xl text-base md:text-lg font-black uppercase tracking-widest cta-button gap-3" asChild>
                      <a href={`tel:${car.profiles?.phone}`}>
                        <Phone className="w-6 h-6" />
                        Hemen Ara
                      </a>
                   </Button>
                   {!isOwner && (
                     <Button variant="secondary" className="w-full h-14 md:h-16 rounded-2xl text-base md:text-lg font-black uppercase tracking-widest gap-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors" asChild>
                        <Link href={`/messages?car=${car.id}&seller=${car.seller_id}`}>
                          <MessageCircle className="w-6 h-6" />
                          Mesaj Gönder
                        </Link>
                     </Button>
                   )}
                 </>
               )}
               
               <p className="text-[10px] text-center font-bold text-muted-foreground dark:text-white/30 uppercase tracking-widest leading-relaxed mt-2">İlan sahibine anında ulaşın.</p>

               {/* Opportunity Offer Button */}
               {isOpportunity && !isOwner && (
                 <button
                   onClick={() => isVerified || isOwner ? setOfferOpen(true) : setVerificationOpen(true)}
                   className={cn(
                     "w-full h-12 md:h-14 rounded-2xl bg-[#D4AF37] text-black text-sm md:text-base font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-95 mt-2 shadow-[0_10px_30px_-5px_rgba(212,175,55,0.4)]",
                     blurClass
                   )}
                 >
                   <Banknote className="w-5 h-5" />
                   Hızlı Nakit Teklif Ver
                 </button>
               )}
            </div>
         </div>
      </div>
    ) : (
      <div className="bento-card p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] bg-primary/5 border-dashed flex flex-col items-center text-center gap-6">
         <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary/40" />
         </div>
         <div className="space-y-2">
            <h3 className="text-base md:text-lg font-black uppercase tracking-tight text-primary">Müşteri Modu Aktif</h3>
            <p className="text-[10px] md:text-xs font-semibold text-muted-foreground px-4">Bu sayfa "Müşteri Modu" ile paylaşılmaktadır. Fiyat ve iletişim bilgileri gizlidir.</p>
         </div>
         <Button variant="outline" className="rounded-full font-bold uppercase tracking-widest text-[10px] px-8 h-10 border-primary/20">Modu Kapat</Button>
      </div>
    )
  )

  return (
    <>
    <div className="max-w-7xl mx-auto space-y-8 pb-24 px-4 sm:px-6 lg:px-0">
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Button variant="ghost" asChild size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground w-fit">
          <Link href="/dashboard">
            <ChevronLeft className="w-4 h-4" />
            Vitrini Dön
          </Link>
        </Button>
        <div className="flex items-center gap-2">
            <Badge className="bg-primary/5 text-primary border-primary/10 font-bold uppercase tracking-widest text-[10px]">İlan No: #{car.id.slice(0, 8)}</Badge>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold uppercase tracking-widest text-[10px]">Aktif İlan</Badge>
            {isOwner && <ShareActions maskedSlug={car.masked_slug} title={car.title} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column: Image Gallery & Core Info */}
        <div className="lg:col-span-8 space-y-8 md:space-y-10">
          <div className="space-y-6">
            {/* Opportunity Banner */}
            {isOpportunity && (
              <OpportunityBadge 
                expiresAt={car.opportunity_expires_at} 
                reason={car.opportunity_reason}
                variant="detail" 
              />
            )}

            <CarImageGallery images={car.images || []} />
            
            {/* Mobile Pricing - Visible only on LG down */}
            <div className="lg:hidden">
               <PricingSection />
            </div>

            {/* Identity & Vitality Bento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
               {/* Main Identity */}
               <div className="md:col-span-3 bento-card p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
                  <div className="relative z-10 space-y-4">
                     <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                           <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight text-primary">
                              {car.title || `${car.brand} ${car.model}`}
                           </h1>
                           <div className="flex items-center gap-2 text-muted-foreground font-extrabold uppercase tracking-widest text-[9px] md:text-xs pt-1">
                              <span>{car.brand}</span>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span>{car.model}</span>
                           </div>
                        </div>
                        <div className="font-technical text-2xl md:text-4xl font-black text-primary/20 group-hover:text-primary/40 transition-colors shrink-0">
                           {car.year}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Metrics Bento Cells */}
               <div className="bento-card p-5 md:p-6 rounded-2xl md:rounded-3xl flex flex-col justify-between gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                     <Gauge className="w-4 h-4 md:w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Kilometre</span>
                    <span className="font-technical text-xl md:text-2xl font-black text-primary truncate block">{car.km?.toLocaleString('tr-TR')} <span className="text-xs">KM</span></span>
                  </div>
               </div>

               <div className="bento-card p-5 md:p-6 rounded-2xl md:rounded-3xl flex flex-col justify-between gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                     <MapPin className="w-4 h-4 md:w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Konum</span>
                    <span className={cn("text-sm md:text-base font-extrabold text-primary uppercase tracking-tight truncate block", blurClass)}>{isCustomerMode ? "Gizli" : car.location_city}</span>
                  </div>
               </div>

               <div className="bento-card p-5 md:p-6 rounded-2xl md:rounded-3xl flex flex-col justify-between gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                     <Calendar className="w-4 h-4 md:w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Eklenme</span>
                    <span className="text-sm md:text-base font-extrabold text-primary uppercase tracking-tight block">Yeni İlan</span>
                  </div>
               </div>
            </div>
          </div>
          
          {/* Diagnostic Sections */}
          <div className="space-y-8 md:space-y-12 bg-card border rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-sm">
            {/* Description Card */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                   <Info className="w-4 h-4" />
                </div>
                <h3 className="text-base md:text-lg font-black uppercase tracking-tight">Ekspertiz & Tramer Notları</h3>
              </div>
              <p className="whitespace-pre-line text-foreground/80 leading-relaxed text-xs md:text-sm bg-muted/30 p-5 md:p-6 rounded-2xl border-l-4 border-primary">
                {car.damage_report || "Bu ilan için detaylı açıklama belirtilmemiş."}
              </p>
            </div>

            {/* Visual Diagnostic */}
            <div className="space-y-6 md:space-y-8 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                   <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-base md:text-lg font-black uppercase tracking-tight">Görsel Hasar Teşhisi</h3>
              </div>
              <div className="flex justify-center py-6 bg-muted/20 rounded-[1.5rem] md:rounded-[2rem] border border-dashed border-primary/20 p-4">
                  <div className="w-full max-w-sm">
                      <ExpertiseSelector value={car.expertise} readOnly />
                  </div>
              </div>
            </div>

            {/* Offers List */}
            <div className="pt-8 border-t border-border/50">
               <CarOffersList listingId={car.id} isOwner={isOwner} />
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Conversion Sidebar (LG and up) */}
        <div className="hidden lg:block lg:col-span-4 space-y-8 lg:sticky lg:top-24">
          <PricingSection />

          {/* SELER CARD */}
          {car.profiles && (
             <div className="bento-card p-8 rounded-[2.5rem] bg-muted/30 border-none space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center border border-primary/5 shadow-sm overflow-hidden">
                      <Store className="w-7 h-7 text-primary" />
                   </div>
                   <div className="flex flex-col flex-1 min-w-0">
                      <h3 className={cn("font-black text-xl truncate tracking-tight text-primary", blurClass)}>{car.profiles.galeri_adi}</h3>
                      {!isCustomerMode && (
                         <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                            <MapPin className="w-3 h-3" />
                            <span className={cn("truncate", blurClass)}>{car.profiles.district}, {car.profiles.city}</span>
                         </div>
                      )}
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-2">
                   <div className="flex items-center justify-center gap-2 text-primary/80 font-black text-[9px] uppercase tracking-[0.2em] bg-primary/10 py-3 rounded-2xl border border-primary/5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Onaylı Galeri Satıcısı</span>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>

    {/* Offer Modal */}
    <OfferModal
      listingId={car.id}
      ownerId={car.seller_id}
      carTitle={car.title || `${car.brand} ${car.model}`}
      isOpen={offerOpen}
      onClose={() => {
        setOfferOpen(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
    />

    {/* Verification Modal */}
    <VerificationModal 
      isOpen={verificationOpen}
      onClose={() => setVerificationOpen(false)}
    />
    </>
  )
}
