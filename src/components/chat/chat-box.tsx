"use client"

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, CheckCircle2, ShieldAlert, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChatBox({ conversation }: { conversation: any }) {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isBuyer = conversation.buyer_id === user?.id
  const otherParty = isBuyer ? conversation.seller : conversation.buyer

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!user || !conversation?.id) return

    async function fetchMessages() {
      // Check block status first
      const { data: blockData } = await supabase
        .from('blocks')
        .select('*')
        .or(`and(blocker_id.eq.${otherParty?.id},blocked_id.eq.${user?.id}),and(blocker_id.eq.${user?.id},blocked_id.eq.${otherParty?.id})`)
      
      if (blockData && blockData.length > 0) {
        setIsBlocked(true)
      } else {
        setIsBlocked(false)
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data)
        
        // Mark unread messages from other user as read
        const unreadIds = data
          .filter((m: any) => !m.is_read && m.sender_id !== user.id)
          .map((m: any) => m.id)
          
        if (unreadIds.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadIds)
        }
      }
      setLoading(false)
      setTimeout(scrollToBottom, 50)
    }

    fetchMessages()

    const channel = supabase.channel(`chat_${conversation.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`
      }, (payload: any) => {
        setMessages(prev => [...prev, payload.new])
        
        // Auto mark read if we are the recipient
        if (payload.new.sender_id !== user.id) {
           supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id).then()
        }
        
        setTimeout(scrollToBottom, 50)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`
      }, (payload: any) => {
        setMessages(prev => prev.map((m: any) => m.id === payload.new.id ? payload.new : m))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, conversation, supabase, otherParty?.id])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || isBlocked) return

    setSending(true)
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user?.id,
      content: newMessage.trim(),
    })

    if (!error) {
      setNewMessage('')
      // Update conversation updated_at
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversation.id)
      scrollToBottom()
    }
    setSending(false)
  }

  const handleBlockToggle = async () => {
    if (!user || !otherParty) return
    
    // Simplistic toggle logic (for full implementation, we'd check if we are the blocker)
    if (isBlocked) {
       // Typically, we check if WE blocked them to allow unblocking. For UI simplicity:
       await supabase.from('blocks').delete().match({ blocker_id: user.id, blocked_id: otherParty.id })
       setIsBlocked(false)
    } else {
       await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: otherParty.id })
       setIsBlocked(true)
    }
  }

  return (
    <div className="flex flex-col h-full relative bg-card">
      {/* Header */}
      <div className="h-16 border-b flex items-center justify-between px-6 shrink-0 bg-secondary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight">{otherParty?.company_name || 'Bilinmeyen Kullanıcı'}</div>
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
              <span>{isBuyer ? 'Satıcı' : 'Alıcı'}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="truncate max-w-[200px]">{conversation.car?.title}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleBlockToggle} className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2">
          <ShieldAlert className="w-4 h-4" />
          {isBlocked ? 'Engeli Kaldır' : 'Engelle'}
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 dark:bg-slate-950/30">
        {loading ? (
          <div className="text-center text-sm text-muted-foreground">Yükleniyor...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground mt-10">
            Henüz mesaj yok. Şimdi göndermeye başlayın!
          </div>
        ) : (
          messages.map((msg: any) => {
            const isMe = msg.sender_id === user?.id
            return (
              <div key={msg.id} className={cn("flex flex-col max-w-[70%]", isMe ? "ml-auto" : "mr-auto")}>
                 <div className={cn(
                   "p-3 rounded-2xl text-sm relative group",
                   isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm border border-border"
                 )}>
                    {msg.content}
                 </div>
                 <div className={cn("text-[10px] text-muted-foreground mt-1 flex items-center gap-1", isMe ? "justify-end" : "justify-start")}>
                    {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    {isMe && (
                      <CheckCircle2 className={cn("w-3 h-3 ml-0.5", msg.is_read ? "text-blue-500" : "text-muted-foreground/50")} />
                    )}
                 </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-card h-20 shrink-0">
        {isBlocked ? (
           <div className="w-full h-full bg-secondary/50 rounded-xl flex items-center justify-center text-sm font-medium text-muted-foreground gap-2">
              <ShieldAlert className="w-4 h-4" />
              Bu sohbet engellendi. Mesaj gönderemezsiniz.
           </div>
        ) : (
          <form className="flex gap-2 h-full" onSubmit={handleSend}>
            <Input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Bir mesaj yazın..."
              className="h-full rounded-xl bg-secondary/30 border-transparent focus-visible:border-primary focus-visible:ring-0"
              disabled={sending}
            />
            <Button 
              type="submit" 
              className="h-full px-6 rounded-xl cta-button gap-2"
              disabled={sending || !newMessage.trim()}
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">Gönder</span>
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
