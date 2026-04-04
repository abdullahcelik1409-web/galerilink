"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useCustomerMode } from "@/components/providers/customer-mode-provider"
import { Car, LayoutDashboard, Settings, PlusCircle } from "lucide-react"

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const { isCustomerMode } = useCustomerMode()

  return (
    <div className={cn("pb-12 h-screen overflow-y-auto flex-col sticky top-0", className)}>
      <div className="py-6 px-4 flex-shrink-0 border-b min-h-[64px] flex flex-col justify-center">
        <h2 className="px-2 text-2xl font-extrabold tracking-tight text-primary">
          {!isCustomerMode ? "GaleriLink" : "Premium Araçlar"}
        </h2>
        {!isCustomerMode && <p className="px-2 text-xs text-muted-foreground mt-1">B2B Ticaret Ağı</p>}
      </div>
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3">
          <div className="space-y-1">
            <Link href="/dashboard" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all", pathname === '/dashboard' ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
              <LayoutDashboard className="h-4 w-4" />
              Tüm Vitrin
            </Link>
            {!isCustomerMode && (
              <>
                <Link href="/dashboard/my-cars" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all", pathname === '/dashboard/my-cars' ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
                  <Car className="h-4 w-4" />
                  Benim İlanlarım
                </Link>
                <Link href="/dashboard/add-car" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all", pathname === '/dashboard/add-car' ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-primary hover:bg-primary/5")}>
                  <PlusCircle className="h-4 w-4" />
                  Yeni İlan Ekle
                </Link>
                <Link href="/dashboard/settings" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all mt-8", pathname === '/dashboard/settings' ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
                  <Settings className="h-4 w-4" />
                  Profil & Ayarlar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
