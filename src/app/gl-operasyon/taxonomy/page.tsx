import { getAuthUser } from "@/lib/supabase/auth-cache"
import { redirect } from "next/navigation"
import { 
  ShieldCheck, 
  ShieldAlert,
  ArrowLeft,
  Settings2,
  Database
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { TaxonomyStudio } from "./client-components"

export const metadata = {
  title: "Taxonomy Studio - Galerilink Admin",
}

export default async function TaxonomyPage() {
  const { user } = await getAuthUser()
  
  // 🛡️ Yetki Kontrolü
  const adminEmailsVar = process.env.ADMIN_EMAILS || 'abdullah.celik1409@gmail.com'
  const authorizedEmails = adminEmailsVar.split(',').map(e => e.trim().toLowerCase())
  
  if (!user || !authorizedEmails.includes(user.email?.toLowerCase() || "")) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white selection:bg-indigo-500/30">
        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-[#080808] border border-white/30 rounded-[3.5rem] p-12 text-center space-y-8 shadow-2xl">
            <ShieldAlert className="w-16 h-16 text-white mx-auto" />
            <div className="space-y-3">
              <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">ERİŞİM KISITLI</h1>
              <p className="font-technical text-lg font-black text-white/90 truncate">{user?.email || 'Yetkisiz Giriş'}</p>
            </div>
            <Button variant="outline" className="w-full h-16 rounded-2xl border-white/20 bg-white/10 hover:bg-white hover:text-black transition-all text-white" asChild>
              <Link href="/dashboard">Güvenli Bölgeye Dön</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/40 relative font-sans overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.05] pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 p-6 md:p-12 max-w-[1400px] mx-auto space-y-12 pb-32">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-white/10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.15)] border border-white/20">
              <Database className="w-8 h-8 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-white">TAXONOMY STUDIO</h1>
                 <Badge variant="outline" className="border-primary/40 text-primary text-[8px] font-black tracking-[0.2em] px-2 py-0.5 bg-primary/5">V1.0 ALPHA</Badge>
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em]">Veri Tabanı ve Hiyerarşi Mimarı</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/gl-operasyon">
              <Button variant="outline" className="h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/20 hover:bg-white hover:text-black px-8 transition-all gap-3">
                <ArrowLeft className="w-4 h-4" />
                TERMİNALE DÖN
              </Button>
            </Link>
          </div>
        </header>

        {/* Studio Content */}
        <main>
           <div className="mb-10 flex items-center gap-4">
              <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white/90">HİYERARŞİ YÖNETİMİ</h3>
           </div>
           
           <TaxonomyStudio />
        </main>
        
        {/* Footer info */}
        <footer className="pt-12 border-t border-white/5 flex flex-col items-center gap-2 opacity-30">
           <Settings2 className="w-5 h-5" />
           <p className="text-[8px] font-black uppercase tracking-[0.5em]">Tüm değişiklikler anında genel veri havuzuna yansır.</p>
        </footer>
      </div>
    </div>
  )
}
