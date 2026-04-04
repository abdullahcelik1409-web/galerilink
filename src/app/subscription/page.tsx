import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Abonelik ve Ödeme - GaleriLink",
}

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // To allow user to logout from subscription page, provide a logout handler client-side component if needed
  // For MVP, simplistic UI.

  const handleLogout = async () => {
    "use server"
    const sup = await createClient()
    await sup.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <form action={handleLogout}>
          <Button variant="ghost" type="submit">Güvenli Çıkış Yap</Button>
        </form>
      </div>
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">GaleriLink Premium'a Geçin</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ücretsiz deneme süreniz sona erdi. B2B kurumsal ticaret ağında yer almaya ve kendi ilanlarınızı paylaşmaya devam etmek için aboneliğinizi aktifleştirin.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Card */}
          <Card className="border-muted bg-card/50 opacity-70">
            <CardHeader>
              <CardTitle>Deneme Sürümü</CardTitle>
              <CardDescription>Süresi Doldu (14 Gün)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-6">0₺</div>
              <ul className="space-y-3 text-sm text-muted-foreground font-medium">
                <li className="flex items-center gap-2"><Check className="h-4 w-4" /> 14 Günlük Tam Erişim</li>
                <li className="flex items-center gap-2 text-destructive"><Check className="h-4 w-4" /> Süre Sona Erdi</li>
              </ul>
            </CardContent>
          </Card>

          {/* Premium Card */}
          <Card className="border-primary shadow-xl relative overflow-hidden bg-card transition-all hover:scale-[1.02]">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-xs font-bold rounded-bl-lg">
              Sektör Standardı
            </div>
            <CardHeader>
              <CardTitle className="text-primary">Profesyonel Galeri Ağı</CardTitle>
              <CardDescription>Kurumsal B2B Ticaretine Sınırsız Erişim</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold mb-2">₺999<span className="text-xl text-muted-foreground font-medium">/Aylık</span></div>
              <p className="text-sm text-muted-foreground mb-6 font-semibold">1 yıllık alımlarda 2 ay hediye</p>
              
              <ul className="space-y-3 text-sm font-bold text-foreground/80">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Sınırsız İlan Yükleme</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Müşteri Modu (Safe Mode) Güvencesi</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Diğer Tüm Galerilerin Stoklarına Erişim</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Marka/Model Bazlı İlan Analizi</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full text-lg h-12 shadow-md" size="lg">Iyzico ile Güvenli Ödeme</Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="mt-12 text-center text-sm font-medium text-muted-foreground">
          <p>Ödeme entegrasyon sistemleri devreye alınma aşamasındadır. Hizmet alımı için sistem destek hattı ile iletişime geçebilirsiniz.</p>
        </div>
      </div>
    </div>
  )
}
