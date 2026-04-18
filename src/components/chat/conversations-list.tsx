"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Car, User, Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ConversationsList({ activeConversation, onSelect }: { activeConversation: any, onSelect: (c: any) => void }) {
  const { user } = useAuth()
  const supabase = createClient()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchConversations() {
      // Fetch conversations where user is buyer or seller
      // Also fetch related car details and the other user's profile
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          car:cars ( id, title, brand, model, year, images ),
          buyer:profiles!buyer_id ( id, galeri_adi ),
          seller:profiles!seller_id ( id, galeri_adi ),
          messages ( id, content, created_at, is_read, sender_id )
        `)
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`)
        .order('updated_at', { ascending: false })

      if (!error && data) {
        setConversations(data)
      }
      setLoading(false)
    }

    fetchConversations()

    // Realtime subscription for conversation updates
    const channel = supabase.channel('conversations_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchConversations()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Yükleniyor...</div>

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
        <Car className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">Henüz bir mesajlaşmanız bulunmuyor.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {conversations.map((conv) => {
        const isSelected = activeConversation?.id === conv.id
        const isBuyer = conv.buyer_id === user?.id
        const otherParty = isBuyer ? conv.seller : conv.buyer
        
        // Sort messages manually since Supabase join doesn't guarantee order if not specified in text query easily
        const sortedMsgs = conv.messages?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []
        const lastMessage = sortedMsgs[0]
        
        // Determine if we have unread messages from the other party
        const unreadCount = sortedMsgs.filter((m: any) => !m.is_read && m.sender_id !== user?.id).length

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={cn(
              "p-4 border-b flex flex-col text-left transition-colors hover:bg-muted/50",
              isSelected ? "bg-primary/5 border-primary/20" : "bg-transparent"
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-bold text-sm tracking-tight">{otherParty?.galeri_adi || 'Bilinmeyen Kullanıcı'}</div>
                  <div className="text-[10px] font-black uppercase text-muted-foreground">{isBuyer ? 'Satıcı' : 'Alıcı'}</div>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                {lastMessage && <Clock className="w-3 h-3" />}
                {lastMessage && new Date(lastMessage.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg border border-border/50">
              {conv.car?.images?.[0] ? (
                <div className="w-10 h-10 rounded shrink-0 bg-secondary overflow-hidden">
                  <img src={conv.car.images[0]} alt="car" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded shrink-0 bg-secondary flex items-center justify-center">
                  <Car className="w-5 h-5 text-muted-foreground/50" />
                </div>
              )}
              
              <div className="overflow-hidden flex-1">
                <div className="text-xs font-bold truncate text-foreground">{conv.car?.title || `${conv.car?.brand} ${conv.car?.model}`}</div>
                {lastMessage ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    {lastMessage.sender_id === user?.id && (
                       <CheckCircle2 className={cn("w-3 h-3", lastMessage.is_read ? "text-blue-500" : "text-muted-foreground/50")} />
                    )}
                    <div className={cn("text-xs truncate", unreadCount > 0 ? "text-foreground font-bold" : "text-muted-foreground")}>
                      {lastMessage.content}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">Henüz mesaj yok</div>
                )}
              </div>

              {unreadCount > 0 && (
                <div className="min-w-5 h-5 px-1 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-bold">
                  {unreadCount}
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
