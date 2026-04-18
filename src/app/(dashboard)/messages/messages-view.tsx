"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ConversationsList } from '@/components/chat/conversations-list'
import { ChatBox } from '@/components/chat/chat-box'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { ShieldAlert, Lock, Mail, ChevronRight, CheckCircle2, Sparkles, Phone, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VerificationModal } from '@/components/profile/verification-modal'

export function MessagesView() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const supabase = createClient()
  
  const initialCarId = searchParams.get('car')
  const initialSellerId = searchParams.get('seller')

  const [activeConversation, setActiveConversation] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)

  // Fetch Profile for verification status
  useEffect(() => {
    if (!user) return
    
    async function fetchProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(data)
      setProfileLoading(false)
    }

    fetchProfile()
  }, [user, supabase])

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
    if (!user || !initialCarId || !initialSellerId || profile?.hesap_durumu !== 'onaylandi') return

    async function checkOrCreateConversation() {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('*, car:cars(id, title, images), buyer:profiles!buyer_id(id, galeri_adi), seller:profiles!seller_id(id, galeri_adi)')
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
          .select('*, car:cars(id, title, images), buyer:profiles!buyer_id(id, galeri_adi), seller:profiles!seller_id(id, galeri_adi)')
          .single()

        if (!error && newConv) {
          setActiveConversation(newConv)
        }
      }
    }

    checkOrCreateConversation()
  }, [user, initialCarId, initialSellerId, supabase, profile])

  if (profileLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Verification Gate
  if (profile?.hesap_durumu !== 'onaylandi') {
    return (
      <div className="w-full bg-slate-950 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative isolate p-12 py-32 text-center space-y-8 min-h-[600px] flex flex-col items-center justify-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.1)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="relative">
          <div className="w-24 h-24 rounded-[2.5rem] bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20 shadow-2xl shadow-red-500/20 mb-8">
            <Lock className="w-12 h-12 text-red-500 animate-pulse" />
          </div>
          
          <div className="space-y-4 max-w-xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
              B2B AĞ ERİŞİMİ <br />
              <span className="text-primary">KISITLANDI</span>
            </h1>
            <p className="text-sm md:text-base font-bold text-white/40 uppercase tracking-widest leading-relaxed">
              Diğer galerilerle iletişime geçmek, teklif vermek ve mesajlaşmak için kurumsal kimliğinizi doğrulamanız gerekmektedir.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <Button 
            onClick={() => setIsVerificationModalOpen(true)}
            className="h-20 px-12 rounded-3xl text-xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-4 shadow-2xl shadow-primary/40 transition-all active:scale-95 whitespace-nowrap"
          >
            <Sparkles className="w-6 h-6" />
            HESABI ŞİMDİ DOĞRULA
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 max-w-4xl w-full">
           <FeatureLock label="Özel Mesajlaşma" icon={<MessageSquare className="w-5 h-5" />} />
           <FeatureLock label="Hızlı Teklif Verme" icon={<Sparkles className="w-5 h-5" />} />
           <FeatureLock label="Galeri İletişim" icon={<Phone className="w-5 h-5" />} />
        </div>

        <VerificationModal 
          isOpen={isVerificationModalOpen} 
          onClose={() => setIsVerificationModalOpen(false)} 
        />
      </div>
    )
  }

  return (
    <div className="flex w-full bg-card border rounded-[2rem] overflow-hidden shadow-sm h-[600px]">
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

function FeatureLock({ label, icon }: { label: string, icon: any }) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-3xl border border-white/5">
       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20">
          {icon}
       </div>
       <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</span>
    </div>
  )
}
