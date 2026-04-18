"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Trash2, Loader2 } from "lucide-react"
import { adminUserAction } from "./actions"
import { cn } from "@/lib/utils"

interface AdminActionButtonsProps {
  userId: string
}

export function AdminActionButtons({ userId }: AdminActionButtonsProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | 'delete' | null>(null)

  const handleAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (action === 'delete' && !confirm('Bu kullanıcıyı tamamen silmek istediğinize emin misiniz?')) {
      return
    }

    setLoading(action)
    try {
      const result = await adminUserAction(userId, action)
      if (!result.success) {
        alert(result.error)
      }
    } catch (err) {
      alert("İşlem sırasında bir hata oluştu.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button 
        onClick={() => handleAction('approve')}
        disabled={!!loading}
        className="h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white hover:bg-white/90 text-black shadow-lg shadow-white/5 gap-2 active:scale-95 transition-all group"
      >
        {loading === 'approve' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
        )}
        <span className="hidden xl:inline">Onayla</span>
      </Button>

      <Button 
        onClick={() => handleAction('reject')}
        disabled={!!loading}
        className="h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white border border-white/20 hover:border-white gap-2 active:scale-95 transition-all group"
      >
        {loading === 'reject' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <XCircle className="w-4 h-4" />
        )}
        <span className="hidden xl:inline">Reddet</span>
      </Button>

      <Button 
        onClick={() => handleAction('delete')}
        disabled={!!loading}
        className="w-10 h-10 rounded-xl bg-white/[0.02] hover:bg-red-600 border border-white/10 hover:border-red-600 text-white/40 hover:text-white transition-all duration-300 group active:scale-90 flex items-center justify-center p-0"
        title="Kullanıcıyı Sil"
      >
        {loading === 'delete' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </Button>
    </div>
  )
}
