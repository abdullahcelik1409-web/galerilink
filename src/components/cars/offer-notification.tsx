"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Banknote, X } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Notification {
  id: string
  amount: number
  listingTitle?: string
  timestamp: number
}

export function OfferNotification({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const router = useRouter()

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, exiting: true } as any : n))
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 300)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('offers-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'offers',
          filter: `owner_id=eq.${userId}`,
        },
        async (payload) => {
          const offer = payload.new as any

          // Araç bilgisini çek
          const { data: car } = await supabase
            .from('cars')
            .select('title, brand, model')
            .eq('id', offer.listing_id)
            .single()

          const notification: Notification = {
            id: offer.id,
            amount: offer.amount,
            listingTitle: car?.title || `${car?.brand} ${car?.model}` || 'Araç',
            timestamp: Date.now(),
          }

          setNotifications(prev => [notification, ...prev].slice(0, 5))

          // Auto-remove after 8 seconds
          setTimeout(() => {
            removeNotification(offer.id)
          }, 8000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, removeNotification])

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.map((notification) => (
        <Link
          key={notification.id}
          href="/dashboard/offers"
          onClick={(e) => {
            // Let the navigation happen, but immediately start removing
            removeNotification(notification.id);
          }}
          className={`pointer-events-auto block bg-card border border-amber-500/30 rounded-2xl shadow-2xl p-4 flex items-start gap-3 opportunity-glow cursor-pointer hover:border-amber-500/50 transition-colors ${
            (notification as any).exiting ? 'toast-exit' : 'toast-enter'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Banknote className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Yeni Teklif Geldi!</p>
            <p className="text-sm font-bold text-foreground mt-0.5 truncate">{notification.listingTitle}</p>
            <p className="font-technical text-lg font-black text-primary mt-1">
              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(notification.amount)}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault(); // Prevent Link navigation if just closing
              e.stopPropagation();
              removeNotification(notification.id);
            }}
            className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </Link>
      ))}
    </div>
  )
}
