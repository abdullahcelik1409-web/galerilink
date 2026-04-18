"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Banknote, X, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"

interface OfferModalProps {
  listingId: string
  ownerId: string
  carTitle: string
  isOpen: boolean
  onClose: () => void
}

export function OfferModal({ listingId, ownerId, carTitle, isOpen, onClose }: OfferModalProps) {
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const displayAmount = amount ? Number(amount).toLocaleString('tr-TR') : ''

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      setError("Geçerli bir teklif tutarı giriniz.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Oturum bulunamadı.")

      const { data: profile } = await supabase
        .from('profiles')
        .select('hesap_durumu')
        .eq('id', user.id)
        .single()

      if (profile?.hesap_durumu !== 'onaylandi') {
        setError("Teklif verebilmek için hesabınızın doğrulanması gerekmektedir.")
        setLoading(false)
        return
      }

      if (user.id === ownerId) {
        setError("Kendi ilanınıza teklif veremezsiniz.")
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase.from('offers').insert({
        listing_id: listingId,
        bidder_id: user.id,
        owner_id: ownerId,
        amount: Number(amount),
      })

      if (insertError) {
        if (insertError.message.includes('3 teklif')) {
          setError("Bu ilana zaten 3 teklif verdiniz. Daha fazla teklif veremezsiniz.")
        } else {
          throw insertError
        }
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setAmount("")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Teklif gönderilirken bir hata oluştu.")
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) { onClose(); setAmount(""); setError(null); setSuccess(false); } }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {success ? (
          /* Success State */
          <div className="p-10 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Teklif Gönderildi!</h3>
              <p className="text-sm text-muted-foreground mt-1">Araç sahibi teklifinizi anlık olarak görecek.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 pb-4 flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5 text-[#D4AF37]" strokeWidth={2.5} />
              </div>
              <button
                onClick={() => { onClose(); setAmount(""); setError(null); }}
                disabled={loading}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-2">
              <h3 className="text-lg font-black uppercase tracking-tight">Hızlı Nakit Teklif Ver</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                <strong className="text-[#D4AF37] font-bold">{carTitle}</strong> için nakit teklifinizi belirleyin.
              </p>
              
              <div className="mt-5 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] block">Teklif Tutarı (₺)</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-light text-muted-foreground/50">₺</span>
                  <input
                    inputMode="numeric"
                    value={displayAmount}
                    placeholder="0"
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '')
                      setAmount(raw)
                    }}
                    className="w-full h-14 pl-10 pr-4 font-technical text-2xl font-black bg-muted/30 border border-[#D4AF37]/20 rounded-xl text-primary outline-none focus:border-[#D4AF37]/50 focus:ring-4 focus:ring-[#D4AF37]/10 transition-all placeholder:text-muted-foreground/20"
                    disabled={loading}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                  Bu ilana en fazla 3 teklif verebilirsiniz. Takas kapalıdır.
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mx-6 mt-3 p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold animate-shake flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="p-6 pt-4 flex gap-3">
              <button
                onClick={() => { onClose(); setAmount(""); setError(null); }}
                disabled={loading}
                className="flex-1 h-12 rounded-xl border border-border font-bold text-xs uppercase tracking-widest hover:bg-muted transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !amount}
                className="flex-1 h-12 rounded-xl bg-[#D4AF37] text-black font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_-10px_rgba(212,175,55,0.4)] hover:shadow-[0_15px_25px_-5px_rgba(212,175,55,0.5)] active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Banknote className="w-4 h-4" />
                    Teklif Ver
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
