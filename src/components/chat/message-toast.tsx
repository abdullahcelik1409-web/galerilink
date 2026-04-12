"use client"

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function GlobalMessageToast() {
  const { user } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (!user) return

    const channel = supabase.channel('global-message-toast')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, async (payload: any) => {
        const msg = payload.new

        // Don't toast if we are the sender
        if (msg.sender_id === user.id) return

        // We need to check if we are part of this conversation
        const { data: conv } = await supabase
          .from('conversations')
          .select('id, car_id, buyer_id, seller_id, car:cars(title)')
          .eq('id', msg.conversation_id)
          .single()

        if (conv && (conv.buyer_id === user.id || conv.seller_id === user.id)) {
           // We are part of it! Show toast.
           toast('Yeni Mesaj', {
             description: `"${conv.car?.title}" ilanı için yeni bir mesajınız var.`,
             icon: <MessageCircle className="w-4 h-4 text-primary" />,
             action: {
               label: 'Mesajlara Git',
               onClick: () => router.push(`/messages`)
             }
           })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, router])

  return null
}
