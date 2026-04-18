"use client"

import { useState, useEffect, useMemo } from "react"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { 
  Moon, 
  Sun, 
  LogOut, 
  Laptop, 
  Mail, 
  Phone, 
  Building2, 
  User, 
  Loader2, 
  ShieldCheck, 
  Zap,
  Clock,
  ChevronRight,
  Settings,
  Bell,
  Copy,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SettingsPage() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [userEmail, setUserEmail] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || "")
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
      setLoading(false)
      setMounted(true)
    }
    loadData()
  }, [])

  const trialDaysRemaining = useMemo(() => {
    let endDate: Date | null = null;
    
    if (profile?.trial_ends_at) {
      endDate = new Date(profile.trial_ends_at);
    } else if (profile?.created_at) {
      // Default: 14 days from registration fallback
      endDate = new Date(profile.created_at);
      endDate.setDate(endDate.getDate() + 14);
    }

    if (!endDate) return 0;
    
    const now = new Date()
    const diff = endDate.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [profile?.trial_ends_at, profile?.created_at])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleCopy = (text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Sistem Yükleniyor</p>
      </div>
    )
  }

  return (
    <div className="transition-all duration-500 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:px-12 space-y-10">
        
        {/* Dashboard-Style Header */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic">Profil Ayarları</h1>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                Kişisel bilgilerinizi ve <span className="text-primary">sistem tercihlerini</span> buradan yönetin.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                  {new Date().toLocaleDateString('tr-TR')}
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Main Controls */}
          <div className="xl:col-span-8 space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Account Card */}
              <div className="bg-card ring-1 ring-border/50 rounded-[2rem] p-8 shadow-sm hover:ring-primary/20 transition-all duration-500 flex flex-col group">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight italic">Hesap</h3>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Kimlik Bilgileri</p>
                    </div>
                  </div>
                  {profile?.hesap_durumu === 'onaylandi' && (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                      <Zap className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <DetailItem label="Galeri Adı" value={profile?.galeri_adi} />
                  <DetailItem label="Ad Soyad" value={profile?.ad_soyad} />
                  <DetailItem label="E-Posta" value={userEmail} />
                  <DetailItem label="Telefon" value={profile?.phone} isTechnical />
                </div>
              </div>

              {/* Membership Card */}
              <div className="bg-card ring-1 ring-border/50 rounded-[2rem] p-8 shadow-sm hover:ring-primary/20 transition-all duration-500 flex flex-col group">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight italic">Üyelik</h3>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Plan Yönetimi</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="p-5 bg-muted/30 rounded-2xl border border-border/40">
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Mevcut Plan</span>
                       {(profile?.subscription_status === 'trial' || !profile?.subscription_status) && (
                          <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">DENEME</span>
                       )}
                     </div>
                     <div className="text-2xl font-black italic uppercase tracking-tighter text-foreground">
                       {profile?.subscription_status === 'pro' ? 'PROFESYONEL' : 'STANDART'}
                     </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 group/timer">
                     <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover/timer:scale-110 transition-transform">
                        <Clock className="w-5 h-5" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-0.5">Kalan Süre</p>
                        <p className="text-sm font-technical font-black text-foreground uppercase tracking-tight">
                          {trialDaysRemaining} GÜN KALDI
                        </p>
                     </div>
                  </div>
                </div>

                <Button 
                  className="w-full mt-8 h-12 rounded-xl bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
                  asChild
                >
                  <Link href="/subscription">PLANI YÜKSELT <ChevronRight className="ml-auto w-4 h-4" /></Link>
                </Button>
              </div>
            </div>

            {/* Extension Hub */}
            <div className="bg-card ring-1 ring-border/50 rounded-[2rem] p-8 shadow-sm hover:ring-primary/20 transition-all duration-500 overflow-hidden relative group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    <Laptop className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight italic">Chrome Uzantısı</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">İlan Aktarım Modülü</p>
                  </div>
                </div>
                
                <div className="flex-1 max-w-sm w-full">
                   <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border/50 relative group/code transition-colors hover:border-primary/30">
                      <code className="flex-1 font-technical text-sm font-black text-primary tracking-widest truncate pl-2">
                         {profile?.extension_key || 'TANIMSIZ'}
                      </code>
                      <button 
                        onClick={() => handleCopy(profile?.extension_key)}
                        className="w-10 h-10 rounded-lg bg-background border flex items-center justify-center text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm active:scale-90"
                      >
                         {copied ? <Check className="w-4 h-4" strokeWidth={3} /> : <Copy className="w-4 h-4" strokeWidth={3} />}
                      </button>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panels */}
          <div className="xl:col-span-4 space-y-8">
            
            {/* System Controls */}
            <div className="bg-card ring-1 ring-border/50 rounded-[2rem] p-8 space-y-8 shadow-sm">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                    <Settings className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight italic">Sistem</h3>
               </div>

               <div className="space-y-3">
                 <ThemeButton active={theme === 'dark'} onClick={() => setTheme('dark')} label="Karanlık Mod" />
                 <ThemeButton active={theme === 'light'} onClick={() => setTheme('light')} label="Aydınlık Mod" />
                 <ThemeButton active={theme === 'system'} onClick={() => setTheme('system')} label="Sistem Eşleşmesi" />
               </div>

               <div className="pt-8 border-t border-border/40">
                  <div className="flex items-center justify-between group/bell">
                     <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-muted-foreground group-hover/bell:text-primary transition-colors" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Bildirimler</span>
                     </div>
                     <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">AKTİF</span>
                  </div>
               </div>
            </div>

            {/* Logout Action */}
            <button 
               onClick={handleLogout}
               className="w-full group h-24 bg-card ring-1 ring-border/50 rounded-[2rem] flex items-center justify-between px-8 hover:bg-destructive shadow-sm transition-all duration-500 hover:ring-destructive/50"
            >
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive group-hover:bg-white transition-all shadow-sm">
                   <LogOut className="w-5 h-5" />
                 </div>
                 <div className="text-left">
                   <h3 className="font-black text-foreground uppercase tracking-tight group-hover:text-white transition-colors">Güvenli Çıkış</h3>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-white/60">Oturumu Kapat</p>
                 </div>
               </div>
               <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-all opacity-0 group-hover:translate-x-0 group-hover:opacity-100 -translate-x-3" />
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}

function DetailItem({ label, value, isTechnical = false }: { label: string, value: string, isTechnical?: boolean }) {
  return (
    <div className="py-4 border-b border-border/20 last:border-0 flex items-center justify-between group/item">
      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className={cn(
        "text-xs font-black text-foreground uppercase truncate max-w-[200px] border-b border-transparent group-hover/item:border-primary/30 transition-all",
        isTechnical && "font-technical tracking-widest text-primary"
      )}>
        {value || 'BİLGİ YOK'}
      </span>
    </div>
  )
}

function ThemeButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full h-14 flex items-center justify-between px-6 rounded-xl border-2 transition-all duration-500",
        active 
          ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
          : "bg-muted/10 border-border/40 text-muted-foreground hover:bg-muted/20 hover:text-foreground"
      )}
    >
      <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
      {active && <Check className="w-4 h-4" strokeWidth={4} />}
    </button>
  )
}
