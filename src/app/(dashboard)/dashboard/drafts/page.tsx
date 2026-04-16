"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { 
  FileStack, 
  ChevronRight, 
  Trash2, 
  Car, 
  Calendar, 
  Activity,
  Sparkles,
  Loader2,
  ArrowRight,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadDrafts() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('cars_drafts')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (!error) setDrafts(data || [])
      setLoading(false)
    }

    loadDrafts()
  }, [])

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null })
  const [isDeleting, setIsDeleting] = useState(false)

  const openDeleteModal = (id: string) => {
    setDeleteModal({ open: true, id })
  }

  const handleConfirmDelete = async () => {
    const id = deleteModal.id
    if (!id) return
    
    setIsDeleting(true)
    // 1. Önce taslağın resimlerini bulalım (Storage'dan silmek için)
    const draftToDelete = drafts.find(d => d.id === id)
    if (draftToDelete?.images?.length > 0) {
      try {
        const pathsToDelete = draftToDelete.images
          .map((url: string) => {
            const parts = url.split('car_images/')
            return parts.length > 1 ? parts[1] : null
          })
          .filter(Boolean)

        if (pathsToDelete.length > 0) {
          await supabase.storage.from('car_images').remove(pathsToDelete)
        }
      } catch (err) {
        console.error('[Storage Error] Resimler silinemedi:', err)
      }
    }

    // 2. Veritabanı kaydını sil
    const { error } = await supabase.from('cars_drafts').delete().eq('id', id)
    if (!error) {
      setDrafts(prev => prev.filter(d => d.id !== id))
      setDeleteModal({ open: false, id: null })
    } else {
      alert("Taslak silinirken bir hata oluştu.")
    }
    setIsDeleting(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50 italic">Taslaklar Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-32 font-fira-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/50 relative">
        <div className="absolute top-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-primary/50 to-transparent" />
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <FileStack className="w-7 h-7 relative z-10" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-foreground drop-shadow-sm font-fira-code">İlan <span className="text-primary italic">Taslakları</span></h1>
            </div>
          </div>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] max-w-lg leading-relaxed italic">
            Uzatıdan gelen verileri kontrol edin, düzenleyin ve ağda paylaşın.
          </p>
        </div>
      </div>

      {drafts.length === 0 ? (
        <div className="p-20 bg-card/30 backdrop-blur-xl border border-dashed border-border/50 rounded-[3rem] text-center space-y-6">
           <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto opacity-50">
              <FileStack className="w-10 h-10 text-muted-foreground" />
           </div>
           <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight font-fira-code text-muted-foreground/50">Henüz Taslak Yok</h3>
              <p className="text-xs text-muted-foreground/60 font-medium">Uzantı üzerinden ilan aktardığınızda burada görünecektir.</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {drafts.map((draft) => (
            <div 
              key={draft.id} 
              className="group relative bg-card/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              {/* Image Preview */}
              <div className="aspect-[16/10] relative overflow-hidden">
                {draft.images?.[0] ? (
                  <img 
                    src={draft.images[0]} 
                    alt={draft.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Car className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                    {draft.ilan_no}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                   <Button 
                     onClick={() => router.push(`/dashboard/add-car?draftId=${draft.id}`)}
                     className="w-full bg-white text-black hover:bg-white/90 rounded-2xl h-12 font-black uppercase tracking-widest text-xs gap-2 group/btn"
                   >
                     İlanı Yayınla
                     <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                   </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6 relative z-10">
                <div className="space-y-2">
                   <h3 className="text-lg font-black uppercase tracking-tighter leading-tight font-fira-code line-clamp-2 truncate">{draft.title}</h3>
                   <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-tight">
                         <Sparkles className="w-3 h-3" />
                         {draft.brand}
                      </div>
                      <div className="w-[1px] h-3 bg-border/50" />
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{draft.model}</div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-3 bg-muted/40 rounded-2xl border border-border/50 flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                         <Calendar className="w-2.5 h-2.5" />
                         Model Yılı
                      </div>
                      <span className="font-technical text-sm font-black text-foreground">{draft.year}</span>
                   </div>
                   <div className="p-3 bg-muted/40 rounded-2xl border border-border/50 flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                         <Activity className="w-2.5 h-2.5" />
                         Kilometre
                      </div>
                      <span className="font-technical text-sm font-black text-foreground">{draft.km.toLocaleString()} KM</span>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">İlan Fiyatı</span>
                    <span className="text-xl font-fira-code font-black text-emerald-500 tracking-tighter">{draft.price || "---"}</span>
                  </div>
                  <button 
                    onClick={() => openDeleteModal(draft.id)}
                    className="p-3 bg-destructive/10 text-destructive rounded-2xl hover:bg-destructive hover:text-white transition-all duration-300"
                    title="Taslağı Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => !isDeleting && setDeleteModal({ open: false, id: null })}
          />
          <div className="relative w-full max-w-md bg-card border border-border/50 rounded-[2.5rem] shadow-2xl p-8 space-y-8 animate-in zoom-in-95 duration-300">
             <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/20 relative">
                   <div className="absolute inset-0 bg-destructive/5 animate-pulse rounded-3xl" />
                   <AlertTriangle className="w-10 h-10 relative z-10" />
                </div>
                <div className="space-y-2">
                   <h2 className="text-2xl font-black uppercase tracking-tight font-fira-code">Taslak Silinecek</h2>
                   <p className="text-xs text-muted-foreground font-medium max-w-[280px] mx-auto leading-relaxed">
                      Bu işlem geri alınamaz. İlana ait tüm resimler <span className="text-destructive font-bold italic">bulut sunucudan (Supabase)</span> kalıcı olarak silinecektir.
                   </p>
                </div>
             </div>

             <div className="flex flex-col gap-3">
                <Button 
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="w-full h-14 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl font-black uppercase tracking-[0.2em] text-xs gap-3 shadow-lg shadow-destructive/20 active:scale-95 transition-all"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {isDeleting ? "RESİMLER SİLİNİYOR..." : "EVET, TAMAMEN SİL"}
                </Button>
                <Button 
                  disabled={isDeleting}
                  onClick={() => setDeleteModal({ open: false, id: null })}
                  variant="ghost"
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                >
                  VAZGEÇ
                </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
