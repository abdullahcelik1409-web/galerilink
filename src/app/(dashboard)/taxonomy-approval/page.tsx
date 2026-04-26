import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import TaxonomyApprovalClient from "./client"

export const metadata = {
  title: "Taksonomi Onay - Admin | GaleriLink",
}

export default async function TaxonomyApprovalPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Güvenlik: Sadece environment variables içinde kayıtlı ADMIN e-postaları buraya girebilir
  const adminEmailsVar = process.env.ADMIN_EMAILS || 'abdullah.celik1409@gmail.com'
  const cleanAdminEmails = adminEmailsVar.replace(/['"]+/g, '')
  const adminEmails = cleanAdminEmails.split(',').map(e => e.trim().toLowerCase())
  
  if (!adminEmails.includes('abdullah.celik1409@gmail.com')) {
    adminEmails.push('abdullah.celik1409@gmail.com')
  }
  
  if (!adminEmails.includes(user.email?.toLowerCase() || "")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center space-y-4">
        <div className="p-4 bg-destructive/10 text-destructive rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight">Yetkisiz Erişim</h1>
        <p className="text-muted-foreground font-medium text-sm">
          Bu sayfayı görüntülemek için Admin yetkisine sahip olmalısınız. Hesabınız admin olarak işaretlenmemiş. Eğer admin iseniz lütfen teknik destek ile iletişime geçin.
        </p>
      </div>
    )
  }

  return <TaxonomyApprovalClient />
}
