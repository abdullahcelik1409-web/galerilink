"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Banknote, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search,
  Filter,
  Car as CarIcon,
  ChevronRight,
  Loader2,
  Check,
  X,
  Phone,
  MessageCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

// Fallback toast
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
  owner_id: string
  listing_id: string
  car: {
    title: string
    brand: string
    model: string
    image: string
    price_b2b: number
  }
  bidder?: {
    company_name: string
    city: string
    phone?: string
  }
  owner?: {
    company_name: string
    city: string
    phone?: string
  }
}

export function OffersManagementClient({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming')
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchOffers = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)

    let query = supabase
      .from('offers')
      .select(`
        *,
        car:cars!offers_listing_id_fkey (
          title,
          brand,
          model,
          images,
          price_b2b
        ),
        bidder:profiles!offers_bidder_id_fkey (
          company_name,
          city,
          phone
        ),
        owner:profiles!offers_owner_id_fkey (
          company_name,
          city,
          phone
        )
      `)
      .order('created_at', { ascending: false })

    if (activeTab === 'incoming') {
      query = query.eq('owner_id', userId)
    } else {
      query = query.eq('bidder_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching global offers:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      toast.error("Teklifler yüklenirken bir hata oluştu.")
    } else {
      setOffers(data?.map((o: any) => ({
        ...o,
        car: {
          title: o.car?.title || `${o.car?.brand} ${o.car?.model}`,
          brand: o.car?.brand,
          model: o.car?.model,
          image: o.car?.images?.[0] || "",
          price_b2b: o.car?.price_b2b
        }
      })) || [])
    }
    setLoading(false)
  }, [userId, activeTab])

  useEffect(() => {
    fetchOffers()
    
    const supabase = createClient()
    const channel = supabase
      .channel('global-offers-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
        fetchOffers()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchOffers])
  const handleStatusUpdate = async (offerId: string, newStatus: 'accepted' | 'rejected') => {
    setActionId(offerId)
    const supabase = createClient()
    const { error } = await supabase.from('offers').update({ status: newStatus }).eq('id', offerId)

    if (error) {
      toast.error("İşlem başarısız oldu.")
    } else {
      toast.success(newStatus === 'accepted' ? "Teklif onaylandı." : "Teklif reddedildi.")
    }
    setActionId(null)
  }

  const handleFinishSale = async (listingId: string, offerId: string) => {
    setActionId(offerId)
    const supabase = createClient()

    // 1. Mark car as sold
    const { error: carError } = await supabase
      .from('cars')
      .update({ status: 'sold', is_active: false })
      .eq('id', listingId)

    if (carError) {
      toast.error("Satış onaylanırken bir hata oluştu.")
      console.error(carError)
    } else {
      // 2. Delete other offers for this listing
      await supabase
        .from('offers')
        .delete()
        .eq('listing_id', listingId)
        .neq('id', offerId)

      toast.success("Tebrikler! Satış başarıyla tamamlandı. Diğer teklifler silindi.")
      fetchOffers()
    }
    setActionId(null)
  }

  const filteredOffers = useMemo(() => {
    if (!searchQuery) return offers
    const s = searchQuery.toLowerCase()
    return offers.filter(o => 
      o.car.title.toLowerCase().includes(s) || 
      (o.bidder?.company_name || "").toLowerCase().includes(s) ||
      (o.owner?.company_name || "").toLowerCase().includes(s)
    )
  }, [offers, searchQuery])

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 py-8 pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.15)] relative">
                 <div className="absolute inset-0 bg-emerald-500/10 animate-pulse rounded-2xl" />
                 <Banknote className="w-7 h-7 relative z-10" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-white">Teklif <span className="text-emerald-400">Yönetimi</span></h1>
           </div>
           <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em] max-w-lg">Gelen ve giden tüm nakit tekliflerinizi merkezi olarak takip edin ve yönetin.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1.5 bg-white/5 border border-white/10 rounded-[1.5rem] glass-node w-fit">
           <button 
             onClick={() => setActiveTab('incoming')}
             className={cn(
               "flex items-center gap-2.5 px-6 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeTab === 'incoming' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border border-emerald-400" : "text-white/60 hover:text-white"
             )}
           >
              <ArrowDownLeft className="w-4 h-4" />
              Gelen Teklifler
           </button>
           <button 
             onClick={() => setActiveTab('outgoing')}
             className={cn(
               "flex items-center gap-2.5 px-6 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeTab === 'outgoing' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border border-emerald-400" : "text-white/60 hover:text-white"
             )}
           >
              <ArrowUpRight className="w-4 h-4" />
              Giden Teklifler
           </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-400 transition-colors" />
            <input 
              type="text" 
              placeholder="İlan veya galeri ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5 transition-all text-xs font-bold uppercase tracking-widest"
            />
         </div>
      </div>

      {/* Results Label */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
        <Clock className="w-3.5 h-3.5" />
        <span>Tarih sırasına göre listeleniyor — {filteredOffers.length} Teklif</span>
      </div>

      {/* Offers Grid/List */}
      <div className="grid grid-cols-1 gap-5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white/5 border border-white/10 rounded-[2rem] animate-pulse" />
          ))
        ) : filteredOffers.length > 0 ? (
          filteredOffers.map((offer) => (
            <div 
              key={offer.id}
              className={cn(
                "group p-6 bg-white/5 border border-white/10 rounded-[2.5rem] glass-node relative overflow-hidden transition-all duration-500 hover:border-emerald-500/30",
                offer.status === 'accepted' && "bg-emerald-500/5 border-emerald-500/20",
                offer.status === 'rejected' && "opacity-50 grayscale-[0.5]"
              )}
            >
              <div className="absolute inset-0 subtle-scanline opacity-10 pointer-events-none" />
              
              <div className="space-y-6 relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  {/* 1. Car Image & Info */}
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-white/10 overflow-hidden relative shrink-0">
                        {offer.car.image ? (
                          <Image 
                            src={offer.car.image} 
                            alt={offer.car.title} 
                            fill 
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover group-hover:scale-110 transition-transform duration-700" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20">
                            <CarIcon className="w-10 h-10" />
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 px-2 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/10">
                          <span className="text-[8px] font-black text-emerald-400 tabular-nums">
                              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(offer.car.price_b2b)}
                          </span>
                        </div>
                    </div>
                    <div className="min-w-0">
                        <Link href={`/dashboard/cars/${offer.listing_id}`} className="block">
                          <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors truncate">
                            {offer.car.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(offer.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                          {activeTab === 'incoming' ? (
                            <>
                              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-black text-white">{offer.bidder?.company_name}</span>
                              <span className="w-1 h-1 rounded-full bg-white/20" />
                              <span className="text-[10px] font-bold text-muted-foreground">{offer.bidder?.city || 'Şehir Yok'}</span>
                            </>
                          ) : (
                            <>
                              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-black text-white">{offer.owner?.company_name}</span>
                              <span className="w-1 h-1 rounded-full bg-white/20" />
                              <span className="text-[10px] font-bold text-muted-foreground">{offer.owner?.city || 'Şehir Yok'}</span>
                            </>
                          )}
                        </div>
                    </div>
                  </div>

                  {/* 2. Amount & Status View */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 border-t lg:border-t-0 border-white/5 pt-6 lg:pt-0">
                    <div className="text-left lg:text-right">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Teklif Tutarı</div>
                        <p className="font-technical text-2xl md:text-4xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(offer.amount)}
                        </p>
                        <div className="flex items-center justify-start lg:justify-end gap-2 mt-2">
                          {offer.status === 'pending' ? (
                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">Beklemede</span>
                          ) : offer.status === 'accepted' ? (
                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Onaylandı
                            </span>
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-red-500/10 text-red-400 rounded-full border border-red-500/20 flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5" /> Reddedildi
                            </span>
                          )}
                        </div>
                    </div>

                    {/* Actions for Incoming Tab - Accept/Reject */}
                    {activeTab === 'incoming' && offer.status === 'pending' && (
                      <div className="flex items-center gap-3">
                          <button 
                            disabled={actionId !== null}
                            onClick={() => handleStatusUpdate(offer.id, 'rejected')}
                            className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                          >
                            {actionId === offer.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-6 h-6" strokeWidth={3} />}
                          </button>
                          <button 
                            disabled={actionId !== null}
                            onClick={() => handleStatusUpdate(offer.id, 'accepted')}
                            className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                          >
                            {actionId === offer.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-6 h-6" strokeWidth={3} />}
                          </button>
                      </div>
                    )}

                    {/* Shortcut for Outgoing Tab */}
                    {activeTab === 'outgoing' && (
                        <Link 
                          href={`/dashboard/cars/${offer.listing_id}`}
                          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-emerald-400 hover:border-emerald-500/30 transition-all active:scale-95"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </Link>
                    )}
                  </div>
                </div>

                {/* 3. Deal Closing Section (Appears when Accepted) */}
                {offer.status === 'accepted' && (
                  <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black uppercase tracking-widest text-white">Anlaşma Sağlandı</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Şimdi iletişime geçin ve satışı tamamlayın.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      {/* Contact Actions */}
                      <div className="flex-1 md:flex-none flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl">
                        {activeTab === 'incoming' ? (
                          <>
                            <a 
                              href={`tel:${offer.bidder?.phone}`} 
                              className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-emerald-500 hover:text-white transition-all"
                            >
                              <Phone className="w-5 h-5" />
                            </a>
                             <a 
                              href={`https://wa.me/90${offer.bidder?.phone?.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Merhaba, ${offer.car.title} aracınız için verdiğim teklif onaylandı.`)}`} 
                              target="_blank"
                              className="h-11 px-4 flex items-center gap-2 rounded-xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                            >
                              <MessageCircle className="w-4 h-4" />
                              WhatsApp
                            </a>
                          </>
                        ) : (
                          <>
                            <a 
                              href={`tel:${offer.owner?.phone}`} 
                              className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-emerald-500 hover:text-white transition-all"
                            >
                              <Phone className="w-5 h-5" />
                            </a>
                            <a 
                              href={`https://wa.me/90${offer.owner?.phone?.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Merhaba, ${offer.car.title} ilanıma verdiğiniz teklifi kabul ediyorum.`)}`} 
                              target="_blank"
                              className="h-11 px-4 flex items-center gap-2 rounded-xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                            >
                              <MessageCircle className="w-4 h-4" />
                              WhatsApp
                            </a>
                          </>
                        )}
                      </div>

                      {/* Finish Sale Action (Only for Owner/Incoming) */}
                      {activeTab === 'incoming' && (
                        <button 
                          disabled={actionId !== null}
                          onClick={() => handleFinishSale(offer.listing_id, offer.id)}
                          className="flex-1 md:flex-none h-[4.5rem] md:h-14 px-8 rounded-2xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-[0_10px_20px_-10px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_25px_-5px_rgba(16,185,129,0.5)] border border-emerald-400 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {actionId === offer.id ? <Loader2 className="w-5 h-5 animate-spin" /> : "Satışı Bitir"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-white/5 rounded-[3rem] bg-white/5 glass-node">
            <Banknote className="w-16 h-16 opacity-30 mb-6 text-emerald-500 rounded-full p-4 bg-emerald-500/10 animate-pulse" />
            <h3 className="text-xl font-black uppercase tracking-tight text-white/50">Henüz teklif bulunmuyor</h3>
            <p className="text-xs font-bold mt-2 uppercase tracking-widest opacity-40">
              {activeTab === 'incoming' ? "İlanlarınıza yapılan teklifler burada listelenir." : "Diğer ilanlara verdiğiniz teklifler burada listelenir."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
