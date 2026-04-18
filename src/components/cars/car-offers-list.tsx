"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Banknote, User, Clock, CheckCircle2, XCircle, Check, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Fallback toast since sonner is not installed
const toast = {
  success: (msg: string) => console.log("Success:", msg),
  error: (msg: string) => console.error("Error:", msg)
}

interface Offer {
  id: string
  amount: number
  status: string
  created_at: string
  bidder_id: string
  bidder: {
    galeri_adi: string
    city: string
  }
}

export function CarOffersList({ listingId, isOwner }: { listingId: string; isOwner?: boolean }) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const fetchOffers = useCallback(async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('offers')
      .select(`
        id,
        amount,
        status,
        created_at,
        bidder_id,
        bidder:profiles!offers_bidder_id_fkey (
          galeri_adi,
          city,
          phone
        )
      `)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })

    if (!isOwner) {
      query = query.eq('bidder_id', user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching offers:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
    } else {
      setOffers(data?.map((o: any) => ({
        ...o,
        bidder: {
          galeri_adi: o.bidder?.galeri_adi || 'B2B Galeri',
          city: o.bidder?.city || 'Belirsiz',
          phone: o.bidder?.phone
        }
      })) || [])
    }
    setLoading(false)
  }, [listingId, isOwner])

  useEffect(() => {
    fetchOffers()

    // Real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel(`listing-offers-${listingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
          filter: `listing_id=eq.${listingId}`
        },
        () => {
          fetchOffers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listingId, fetchOffers])

  const handleStatusUpdate = async (offerId: string, newStatus: 'accepted' | 'rejected') => {
    setActionId(offerId)
    const supabase = createClient()

    const { error } = await supabase
      .from('offers')
      .update({ status: newStatus })
      .eq('id', offerId)

    if (error) {
      toast.error("İşlem sırasında bir hata oluştu.")
      console.error(error)
    } else {
      toast.success(newStatus === 'accepted' ? "Teklif onaylandı!" : "Teklif reddedildi.")
      // Realtime will trigger the refresh
    }
    setActionId(null)
  }

  if (loading) return (
     <div className="animate-pulse space-y-4">
        <div className="h-20 bg-muted/20 border border-border/50 rounded-2xl" />
        <div className="h-20 bg-muted/10 border border-border/50 rounded-2xl" />
     </div>
  )

  if (offers.length === 0) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
              <Banknote className="w-5 h-5" />
           </div>
           <div>
              <h3 className="text-base md:text-lg font-black uppercase tracking-tight text-white">
                 {isOwner ? "Gelen Teklifler" : "Tekliflerim"}
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {isOwner ? "İlanınıza gelen tüm nakit teklifleri buradan yönetin." : "Bu ilana verdiğiniz tekliflerin durumunu takip edin."}
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {offers.map((offer) => (
          <div 
            key={offer.id}
            className={cn(
              "p-5 bg-white/5 border border-white/10 rounded-[2rem] glass-node relative overflow-hidden group transition-all duration-500",
              offer.status === 'accepted' && "border-emerald-500/30 bg-emerald-500/5",
              offer.status === 'rejected' && "border-red-500/10 opacity-60"
            )}
          >
            <div className="absolute inset-0 subtle-scanline opacity-5 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
               {/* Left Side: Bidder Info */}
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground group-hover:text-[#D4AF37] transition-all duration-500 group-hover:scale-110">
                     <User className="w-7 h-7" />
                  </div>
                  <div>
                     <h4 className="text-base font-black uppercase tracking-tight text-white group-hover:text-[#D4AF37] transition-colors">
                       {offer.bidder.galeri_adi}
                     </h4>
                     <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                       <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(offer.created_at).toLocaleDateString('tr-TR')}</span>
                       <span className="w-1 h-1 rounded-full bg-border" />
                       <span>{offer.bidder.city}</span>
                     </div>
                  </div>
               </div>

               {/* Right Side: Amount & Status & Actions */}
               <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4">
                  <div className="text-left md:text-right">
                    <p className="font-technical text-2xl md:text-3xl font-black text-[#D4AF37] tabular-nums tracking-tighter shadow-gold drop-shadow-2xl">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(offer.amount)}
                    </p>
                    <div className="flex items-center justify-start md:justify-end gap-2 mt-1">
                       {offer.status === 'pending' ? (
                          <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">Beklemede</span>
                       ) : offer.status === 'accepted' ? (
                          <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                             <CheckCircle2 className="w-3 h-3" /> Onaylandı
                          </span>
                       ) : (
                          <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-red-500/10 text-red-400 rounded-full border border-red-500/20 flex items-center gap-1.5">
                             <XCircle className="w-3 h-3" /> Reddedildi
                          </span>
                       )}
                    </div>
                  </div>

                  {/* Actions for Owner */}
                  {isOwner && offer.status === 'pending' && (
                    <div className="flex items-center gap-2">
                       <button
                         disabled={actionId !== null}
                         onClick={() => handleStatusUpdate(offer.id, 'rejected')}
                         className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                         title="Reddet"
                       >
                         {actionId === offer.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" strokeWidth={3} />}
                       </button>
                       <button
                         disabled={actionId !== null}
                         onClick={() => handleStatusUpdate(offer.id, 'accepted')}
                         className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                         title="Onayla"
                       >
                         {actionId === offer.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" strokeWidth={3} />}
                       </button>
                    </div>
                  )}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
