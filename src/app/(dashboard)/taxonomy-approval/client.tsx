"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, AlertCircle, RefreshCw, XCircle } from "lucide-react"

export default function TaxonomyApprovalClient() {
  const [pendingItems, setPendingItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const fetchPending = async () => {
    setLoading(true)
    setError(null)
    try {
      // Sadece onay bekleyenleri getir (Level ve tarihe göre sirala)
      const { data, error: fetchErr } = await supabase
        .from('car_taxonomy')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr
      setPendingItems(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const originalItems = [...pendingItems]
    
    // Optimistic UI update
    setPendingItems(prev => prev.filter(item => item.id !== id))
    
    try {
      const response = await fetch('/api/taxonomy/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve', id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Onay hatası')
      }
    } catch (err: any) {
      console.error("Onay hatası:", err)
      alert("Onaylanırken hata oluştu.")
      // Revert optimistic update
      setPendingItems(originalItems)
    }
  }

  const handleReject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return
    
    const originalItems = [...pendingItems]
    setPendingItems(prev => prev.filter(item => item.id !== id))
    
    try {
      const response = await fetch('/api/taxonomy/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject', id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Silme hatası')
      }
    } catch (err: any) {
      console.error("Silme hatası:", err)
      alert("Silinirken hata oluştu.")
      setPendingItems(originalItems)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Taksonomi Onay Bekleyenler</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Kullanıcıların manuel olarak girdiği ve onay bekleyen marka, model, paket bilgilerini buradan onaylayın veya reddedin.
          </p>
        </div>
        <button 
          onClick={fetchPending}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-colors text-sm font-bold uppercase"
        >
          <RefreshCw className={\`w-4 h-4 \${loading ? 'animate-spin' : ''}\`} />
          Yenile
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs font-bold uppercase">{error}</p>
        </div>
      )}

      {loading && pendingItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin mb-4" />
          <p className="text-xs font-black uppercase tracking-widest">Veriler Yükleniyor...</p>
        </div>
      ) : pendingItems.length === 0 ? (
        <div className="p-12 bento-card text-center rounded-[2.5rem] flex flex-col items-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500/50 mb-4" />
          <h3 className="text-lg font-black uppercase tracking-widest text-emerald-500">Mükemmel!</h3>
          <p className="text-xs text-muted-foreground font-bold mt-2">Onay bekleyen hiçbir taksonomi verisi yok.</p>
        </div>
      ) : (
        <div className="bg-card rounded-[2.5rem] border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b uppercase text-[10px] font-black tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">İsim</th>
                  <th className="px-6 py-4">Seviye (Kategori)</th>
                  <th className="px-6 py-4">Oluşturulma Tarihi</th>
                  <th className="px-6 py-4 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-bold max-w-[200px] truncate" title={item.name}>
                      {item.name}
                      {item.slug && <div className="text-[10px] text-muted-foreground font-medium truncate">{item.slug}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                        {item.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                      {new Date(item.created_at).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleReject(item.id, e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Sil
                        </button>
                        <button
                          onClick={(e) => handleApprove(item.id, e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Onayla
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
