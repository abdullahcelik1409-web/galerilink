import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function WaitingApprovalPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="max-w-md text-center space-y-6">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 text-primary mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Hesabınız Onay Bekliyor</h1>
        <p className="text-muted-foreground text-lg">
          Güvenli kapalı devre sistemimiz gereği galerici kayıtları manuel olarak onaylanmaktadır. Vergi levhası ve bilgileriniz doğrulandıktan sonra platforma erişebileceksiniz.
        </p>
        
        <div className="pt-8">
           <Button asChild variant="outline">
              <Link href="/login">Giriş Sayfasına Dön</Link>
           </Button>
        </div>
      </div>
    </div>
  )
}
