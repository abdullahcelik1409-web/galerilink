'use client'

import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText, Loader2, ExternalLink, Shield } from 'lucide-react'
import { getSecureDocumentUrl } from '@/actions/document'
import { toast } from 'sonner'

interface DocumentViewerProps {
  filePath: string
  userName?: string
}

export function DocumentViewer({ filePath, userName }: DocumentViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  const handleOpen = async () => {
    setIsLoading(true)
    try {
      const result = await getSecureDocumentUrl(filePath)
      
      if (result.success && result.url) {
        setSignedUrl(result.url)
        setIsOpen(true)
      } else {
        toast.error(result.error || 'Belge yüklenemedi.')
      }
    } catch (error) {
      toast.error('Bağlantı hatası oluştu.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    // Güvenlik için modal kapandığında URL'i temizle
    setTimeout(() => setSignedUrl(null), 300)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Button 
        variant="outline" 
        size="sm"
        disabled={isLoading}
        onClick={handleOpen}
        className="h-12 bg-white/10 hover:bg-white text-white hover:text-black border-white/20 hover:border-white group/file rounded-xl px-6 gap-3 transition-all font-black text-[10px] uppercase shadow-sm"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 opacity-100 group-hover/file:scale-110 transition-transform" />
        )}
        <span className="tracking-widest">
          {isLoading ? 'YUKLENIYOR...' : 'BELGEYİ GÖR'}
        </span>
        {!isLoading && <ExternalLink className="w-3 h-3 opacity-60 group-hover/file:opacity-100 transition-opacity" />}
      </Button>

      <DialogContent className="max-w-4xl bg-black border-white/20 text-white rounded-[2rem] overflow-hidden shadow-[0_0_100px_-20px_rgba(255,255,255,0.1)]">
        <DialogHeader className="border-b border-white/10 pb-4 mb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-black italic uppercase tracking-tighter">
            <Shield className="w-5 h-5 text-indigo-400" />
            GÜVENLİ BELGE GÖRÜNTÜLEYİCİ
          </DialogTitle>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">
            {userName ? `${userName} - VERGİ LEVHASI` : 'VERİ TUTARLILIK DENETİMİ'}
          </p>
        </DialogHeader>

        <div className="relative aspect-video flex items-center justify-center bg-[#050505] rounded-xl overflow-hidden border border-white/5">
          {signedUrl ? (
            <img 
              src={signedUrl} 
              alt="Vergi Levhası" 
              className="max-w-full max-h-full object-contain select-none"
              onContextMenu={(e) => e.preventDefault()} // Sağ tık engelleme (basit koruma)
            />
          ) : (
            <div className="flex flex-col items-center gap-4 py-20 grayscale opacity-40">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">HÜCRE YÜKLENİYOR...</span>
            </div>
          )}
          
          {/* Güvenlik Katmanı Filigranı */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] rotate-[-35deg] select-none">
             <span className="text-8xl font-black uppercase whitespace-nowrap">GALERILINK ADMIN</span>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center bg-white/[0.03] p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
             <span className="text-[9px] font-black uppercase tracking-widest text-white/60">GÜVENLİ OTURUM AKTİF</span>
          </div>
          <div className="text-[9px] font-black uppercase tracking-widest text-white/40">
             BAĞLANTI SÜRESİ: <span className="text-white/80">300 SN</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
