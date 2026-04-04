"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Trash2, X, AlertTriangle, Loader2 } from "lucide-react"

interface DeleteCarModalProps {
  carId: string
  carTitle: string
  isOpen: boolean
  onClose: () => void
}

export function DeleteCarModal({ carId, carTitle, isOpen, onClose }: DeleteCarModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  if (!isOpen) return null

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // 1. İlana ait görselleri storage'dan sil (opsiyonel, hata verse bile devam et)
      const { data: car } = await supabase
        .from('cars')
        .select('images')
        .eq('id', carId)
        .single()

      if (car?.images && car.images.length > 0) {
        const filePaths = car.images
          .map((url: string) => {
            const match = url.match(/car_images\/(.+)$/)
            return match ? match[1] : null
          })
          .filter(Boolean) as string[]

        if (filePaths.length > 0) {
          await supabase.storage.from('car_images').remove(filePaths)
        }
      }

      // 2. Veritabanından ilanı kalıcı olarak sil
      const { error: deleteError } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId)

      if (deleteError) throw deleteError

      onClose()
      router.refresh()
    } catch (err: any) {
      setError(err.message || "İlan silinirken bir hata oluştu.")
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between">
          <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-2">
          <h3 className="text-base font-black uppercase tracking-tight">İlanı Kalıcı Olarak Sil</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            <strong className="text-foreground">{carTitle}</strong> ilanı ve tüm görselleri kalıcı olarak silinecektir. Bu işlem geri alınamaz.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-3 p-3 bg-destructive/10 text-destructive rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="p-6 pt-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-11 rounded-xl border border-border font-bold text-sm uppercase tracking-wider hover:bg-muted transition-colors"
          >
            Vazgeç
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 h-11 rounded-xl bg-destructive text-destructive-foreground font-bold text-sm uppercase tracking-wider hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Sil
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
