import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Zap, Flame, ShieldCheck, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Abonelik ve Ödeme - GaleriLink",
}

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const handleLogout = async () => {
    "use server"
    const sup = await createClient()
    await sup.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background transition-all duration-500 pb-20">
      {/* Header Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 relative">
         <div className="flex items-center justify-between border-b pb-8 border-border/40">
            <div className="space-y-2">
               <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-4 group">
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Geri Dön
               </Link>
               <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">ABONELİK <span className="text-primary">PLANI</span></h1>
               <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                  Ticaret ağındaki yerinizi <span className="text-primary italic">profesyonel paketlerle</span> sabitleyin.
               </p>
            </div>
            
            <form action={handleLogout}>
              <Button variant="ghost" type="submit" className="text-[10px] font-black uppercase tracking-widest hover:bg-destructive/10 hover:text-destructive">Çıkış Yap</Button>
            </form>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* 1. TRIAL ACCOUNT */}
          <PricingCard 
            title="Deneme Sürümü"
            price="0"
            description="Sistemi Keşfedin"
            features={[
              "10 Aktif İlan Hakkı",
              "Chrome Uzantısı Erişimi",
              "Müşteri Modu Güvencesi",
              "B2B İlan Portalı",
              "14 Günlük Süre"
            ]}
            buttonText="Deneme Başlatıldı"
            buttonDisabled={true}
            variant="muted"
          />

          {/* 2. LITE PACK */}
          <PricingCard 
            title="Lite Paket"
            price="849"
            description="Bireysel Galeriler"
            features={[
              "15 Aktif İlan Hakkı",
              "Chrome Uzantısı Erişimi",
              "B2B İlan Portalı",
              "Standart Destek Hattı",
              "Müşteri Modu Erişimi"
            ]}
            buttonText="Aboneliği Başlat"
            variant="default"
          />

          {/* 3. PRO PACK - Featured */}
          <PricingCard 
            title="Pro Paket"
            price="1.249"
            description="Aktif Ticaret"
            features={[
              "50 Aktif İlan Hakkı",
              "Fırsat Havuzunda Vitrin",
              "Sınırsız Chrome Aktarımı",
              "VIP İlan Analiz",
              "Öncelikli Destek"
            ]}
            buttonText="Hemen Katıl"
            variant="primary"
            featured={true}
          />

          {/* 4. ENTERPRISE PACK */}
          <PricingCard 
            title="Kurumsal"
            price="1.999"
            description="Sınırsız Ticaret"
            features={[
              "Sınırsız İlan Yükleme",
              "Fırsat Havuzu (Vitrini)",
              "Sınırsız Chrome Aktarımı",
              "Çoklu Kullanıcı Desteği",
              "7/24 VIP Destek Hattı"
            ]}
            buttonText="Sınırsız Başla"
            variant="dark"
          />
        </div>
        
        <div className="mt-20 p-8 bento-card rounded-[2.5rem] border-dashed border-2 flex flex-col md:flex-row items-center gap-8 text-center md:text-left bg-primary/5 border-primary/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
           <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="w-10 h-10" />
           </div>
           <div className="flex-1 space-y-2 relative z-10">
              <h3 className="text-xl font-black uppercase italic tracking-tighter">Iyzico ile Güvenli Ödeme Terminali</h3>
              <p className="text-sm text-muted-foreground font-medium max-w-2xl">
                Ödemeleriniz Iyzico güvencesi ile uçtan uca şifrelenir. Kart bilgileriniz GaleriLink sunucularında asla saklanmaz. 
                Kurumsal fatura talepleriniz için ödeme sonrası sistem üzerinden talepte bulunabilirsiniz.
              </p>
           </div>
           <div className="shrink-0 flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">
              <span>SSL SECURE</span>
              <div className="w-1 h-1 bg-border rounded-full" />
              <span>PCI-DSS</span>
           </div>
        </div>
      </div>
    </div>
  )
}

function PricingCard({ 
  title, 
  price, 
  description, 
  features, 
  buttonText, 
  buttonDisabled = false, 
  variant = 'default',
  featured = false 
}: { 
  title: string, 
  price: string, 
  description: string, 
  features: string[], 
  buttonText: string, 
  buttonDisabled?: boolean,
  variant?: 'muted' | 'default' | 'primary' | 'dark',
  featured?: boolean
}) {
  return (
    <Card className={cn(
      "relative flex flex-col h-full border-none transition-all duration-500 overflow-hidden rounded-[2.5rem] ring-1 ring-border/50",
      featured ? "scale-[1.05] z-10 shadow-2xl shadow-primary/10 ring-primary/40 bg-card" : "bg-card/50 backdrop-blur-sm",
      variant === 'muted' && "opacity-80"
    )}>
      {featured && (
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}
      
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center justify-between mb-4">
           {featured ? <Flame className="w-6 h-6 text-primary" /> : <Zap className="w-5 h-5 text-muted-foreground opacity-30" />}
           {featured && <span className="bg-primary/10 text-primary text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">En Popüler</span>}
        </div>
        <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">{title}</CardTitle>
        <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{description}</CardDescription>
      </CardHeader>

      <CardContent className="p-8 pt-0 flex-1 flex flex-col">
        <div className="flex items-baseline gap-1 mb-10">
          <span className="text-4xl font-black tracking-tighter italic">₺{price}</span>
          <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">/ Aylık</span>
        </div>

        <ul className="space-y-4 mb-8">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className={cn(
                "w-5 h-5 rounded-md flex items-center justify-center border",
                featured ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border/50"
              )}>
                <Check className="w-3 h-3" strokeWidth={4} />
              </div>
              <span className="text-sm font-bold uppercase tracking-tight text-foreground/80">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="p-8 pt-0 mt-auto">
        <Button 
          disabled={buttonDisabled}
          className={cn(
            "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95",
            featured ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-white"
          )}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  )
}
