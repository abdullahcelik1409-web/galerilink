"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Moon, Sun, LogOut, Laptop, Mail, Phone, Building2, User, Loader2, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [userEmail, setUserEmail] = useState<string>("")
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

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading || !mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Profil Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-32">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/50 relative">
        <div className="absolute top-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-primary/50 to-transparent" />
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xl relative">
              <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-2xl" />
              <User className="w-7 h-7 relative z-10" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-foreground drop-shadow-sm">Profil <span className="text-primary">Ayarları</span></h1>
            </div>
          </div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em] max-w-lg leading-relaxed">
            Sistem tercihlerinizi ve hesap bilgilerinizi güvenle yönetin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Profile Details Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[2.5rem] blur-xl" />
          <div className="p-8 bg-card/80 backdrop-blur-sm border border-border/50 rounded-[2.5rem] relative z-10 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Hesap Bilgileri</h3>
                  <p className="text-[10px] uppercase tracking-widest text-primary/80 font-bold mt-0.5">Kayıtlı Profil Detayları</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                <span className="text-[9px] font-black text-primary uppercase tracking-widest">Doğrulanmış</span>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div className="p-5 bg-muted/30 border border-border/50 hover:border-border transition-colors rounded-3xl flex items-center gap-5 group/item">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover/item:text-foreground transition-colors">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Galeri Adı</p>
                  <p className="text-base font-black text-foreground uppercase tracking-wider truncate">{profile?.company_name || 'Belirtilmemiş'}</p>
                </div>
              </div>

              <div className="p-5 bg-muted/30 border border-border/50 hover:border-border transition-colors rounded-3xl flex items-center gap-5 group/item">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover/item:text-foreground transition-colors">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">E-Posta Adresi</p>
                  <p className="text-base font-black text-foreground truncate">{userEmail || 'Belirtilmemiş'}</p>
                </div>
              </div>

              <div className="p-5 bg-muted/30 border border-border/50 hover:border-border transition-colors rounded-3xl flex items-center gap-5 group/item">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover/item:border-primary/40 group-hover/item:text-primary transition-all">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">İletişim Numarası</p>
                  <p className="text-base font-black text-foreground font-technical tracking-widest">{profile?.phone || 'Belirtilmemiş'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System & Actions Column */}
        <div className="space-y-8 flex flex-col">
          
          {/* Chrome Extension Key */}
          <div className="p-8 bg-card/80 backdrop-blur-sm border border-border/50 rounded-[2.5rem] relative overflow-hidden group/ext">
             <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/ext:opacity-100 transition-opacity duration-700" />
             <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Chrome Uzantısı</h3>
                    <p className="text-[10px] uppercase tracking-widest text-primary font-bold mt-0.5">Sahibinden Aktarıcı Anahtarı</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                    Sahibinden üzerinden ilanları tek tıkla taslak olarak aktarmak için aşağıdaki özel anahtarınızı uzantı ayarlarında kullanın.
                  </p>
                  
                  <div className="flex items-center gap-2 p-4 bg-muted/40 rounded-2xl border border-border/50">
                    <code className="flex-1 font-technical text-sm font-bold tracking-widest truncate select-all">{profile?.extension_key || 'Oluşturuluyor...'}</code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(profile?.extension_key);
                        alert("Anahtar kopyalandı!");
                      }}
                      className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-2">
                    <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
                      ⚠️ Bu anahtarı kimseyle paylaşmayın. Yeni bir ilan aktarıldığında doğrudan sizin galerinize tanımlanacaktır.
                    </p>
                  </div>
                </div>
             </div>
          </div>

          {/* Theme Settings */}
          <div className="p-8 bg-card/80 backdrop-blur-sm border border-border/50 rounded-[2.5rem] flex-1">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center text-foreground/70">
                <Laptop className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Görünüm Karakteri</h3>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">Arayüz Deneyiminizi Seçin</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setTheme("dark")} 
                className={cn(
                  "w-full h-[4.5rem] flex items-center justify-start px-6 gap-4 rounded-2xl border transition-all duration-300 font-bold text-xs uppercase tracking-widest",
                  theme === "dark" 
                    ? "bg-primary border-primary text-primary-foreground shadow-lg" 
                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Moon className="w-5 h-5" /> 
                <span>Karanlık Mod (Önerilen)</span>
              </button>
              
              <button 
                onClick={() => setTheme("light")} 
                className={cn(
                  "w-full h-[4.5rem] flex items-center justify-start px-6 gap-4 rounded-2xl border transition-all duration-300 font-bold text-xs uppercase tracking-widest",
                  theme === "light" 
                    ? "bg-primary border-primary text-primary-foreground shadow-lg" 
                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Sun className="w-5 h-5" /> 
                <span>Aydınlık Mod</span>
              </button>
              
              <button 
                onClick={() => setTheme("system")} 
                className={cn(
                  "w-full h-[4.5rem] flex items-center justify-start px-6 gap-4 rounded-2xl border transition-all duration-300 font-bold text-xs uppercase tracking-widest",
                  theme === "system" 
                    ? "bg-primary border-primary text-primary-foreground shadow-lg" 
                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Laptop className="w-5 h-5" /> 
                <span>Sistem Eşleşmesi</span>
              </button>
            </div>
          </div>

          {/* Secure Logout */}
          <div className="p-8 bg-destructive/5 border border-destructive/20 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-black text-destructive uppercase tracking-tight">Güvenli Çıkış</h3>
                <p className="text-[10px] uppercase tracking-widest text-destructive/80 font-bold mt-1">Oturumunuzu bu cihazdan sonlandırın.</p>
              </div>
              <button 
                onClick={handleLogout} 
                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-destructive/10 text-destructive border border-destructive/30 flex items-center justify-center gap-3 hover:bg-destructive hover:text-destructive-foreground hover:shadow-lg transition-all active:scale-95 font-black text-xs uppercase tracking-widest"
              >
                <LogOut className="w-5 h-5" />
                Sistemden Çık
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
