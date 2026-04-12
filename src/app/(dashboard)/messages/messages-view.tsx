"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ConversationsList } from '@/components/chat/conversations-list'
import { ChatBox } from '@/components/chat/chat-box'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export function MessagesView() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const supabase = createClient()
  
  const initialCarId = searchParams.get('car')
  const initialSellerId = searchParams.get('seller')

  const [activeConversation, setActiveConversation] = useState<any>(null)

  // Listen to new messages
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          console.log('New message received!', payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // Handle URL parameters for starting a new conversation
  useEffect(() => {
    if (!user || !initialCarId || !initialSellerId) return

    async function checkOrCreateConversation() {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('*, car:cars(id, title, images), buyer:profiles!buyer_id(id, company_name), seller:profiles!seller_id(id, company_name)')
        .eq('car_id', initialCarId)
        .eq('buyer_id', user.id)
        .eq('seller_id', initialSellerId)
        .single()

      if (existing) {
        setActiveConversation(existing)
      } else {
        // Create new conversation
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            car_id: initialCarId,
            buyer_id: user.id,
            seller_id: initialSellerId
          })
          .select('*, car:cars(id, title, images), buyer:profiles!buyer_id(id, company_name), seller:profiles!seller_id(id, company_name)')
          .single()

        if (!error && newConv) {
          setActiveConversation(newConv)
        }
      }
    }

    checkOrCreateConversation()
  }, [user, initialCarId, initialSellerId, supabase])

  return (
    <div className="flex w-full bg-card border rounded-[2rem] overflow-hidden shadow-sm">
      {/* Sidebar: Conversation List */}
      <div className="w-full md:w-1/3 border-r flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-6 border-b">
          <h2 className="text-xl font-black uppercase tracking-tight">Mesajlarım</h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">İlan Odaklı Görüşmeler</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationsList 
            activeConversation={activeConversation}
            onSelect={setActiveConversation} 
          />
        </div>
      </div>

      {/* Main Area: Chat Box */}
      <div className="hidden md:flex flex-col flex-1 h-full relative">
        {activeConversation ? (
          <ChatBox conversation={activeConversation} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Sohbet Seçin</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Görüşmelerinizi görüntülemek veya mesaj göndermek için sol taraftan bir ilan sohbeti seçin.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
