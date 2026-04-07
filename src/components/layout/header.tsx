"use client"
import { useState } from "react"
import { useCustomerMode } from "@/components/providers/customer-mode-provider"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { ShieldAlert, ShieldCheck, LogOut, Menu, X, Car, LayoutDashboard, Settings, PlusCircle, Flame, Banknote } from "lucide-react"
import { cn } from "@/lib/utils"

export function Header({ profile }: { profile: any }) {
  const { isCustomerMode, toggleCustomerMode } = useCustomerMode()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[64px] items-center gap-x-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 shadow-sm w-full mx-auto">
        <div className="flex flex-1 items-center justify-between min-w-0">
          
          <div className="flex md:hidden">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          {/* Customer Mode Indicator */}
          <div className={`flex items-center gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-full border transition-all ${
            isCustomerMode ? "bg-amber-500/10 border-amber-500/50 text-amber-600" : "bg-card border-border shadow-sm"
          }`}>
            {isCustomerMode ? <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-amber-500" /> : <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-primary" />}
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider">{isCustomerMode ? 'Müşteri Modu Aktif' : 'Galerici Modu'}</span>
            </div>
            <div className="ml-1 md:ml-2 flex items-center">
              <Switch id="customer-mode" checked={isCustomerMode} onCheckedChange={toggleCustomerMode} />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
            {!isCustomerMode && (
              <div className="text-right hidden sm:flex flex-col truncate">
                <span className="text-sm font-semibold truncate max-w-[120px] lg:max-w-[200px]">{profile?.company_name}</span>
                <span className="text-xs text-muted-foreground truncate">{profile?.city}</span>
              </div>
            )}
            <div className="h-8 w-px bg-border hidden sm:block mx-1" />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
              <span className="hidden md:inline font-medium">Çıkış</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
          <div className="fixed inset-y-0 left-0 z-50 h-full w-[280px] border-r bg-card shadow-lg flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b h-[64px]">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-primary">
                  {!isCustomerMode ? "GaleriLink" : "Premium Araçlar"}
                </h2>
                {!isCustomerMode && <p className="text-xs text-muted-foreground mt-0.5">B2B Ticaret Ağı</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-4 py-4 flex-1 px-3 mt-2">
              <div className="space-y-1">
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all", pathname === '/dashboard' ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
                  <LayoutDashboard className="h-4 w-4" />
                  Tüm Vitrin
                </Link>
                {!isCustomerMode && (
                  <>
                    <Link href="/dashboard/my-cars" onClick={() => setIsMobileMenuOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all", pathname === '/dashboard/my-cars' ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
                      <Car className="h-4 w-4" />
                      Benim İlanlarım
                    </Link>
                    <Link href="/dashboard/offers" onClick={() => setIsMobileMenuOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all", pathname === '/dashboard/offers' ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
                      <Banknote className="h-4 w-4" />
                      Teklifler
                    </Link>
                    <Link href="/dashboard/opportunities" onClick={() => setIsMobileMenuOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all", pathname === '/dashboard/opportunities' ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : "text-muted-foreground hover:text-amber-600 hover:bg-amber-500/5")}>
                      <Flame className="h-4 w-4" />
                      Fırsat Havuzu
                    </Link>
                    <Link href="/dashboard/add-car" onClick={() => setIsMobileMenuOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all", pathname === '/dashboard/add-car' ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-primary hover:bg-primary/5")}>
                      <PlusCircle className="h-4 w-4" />
                      Yeni İlan Ekle
                    </Link>
                    <Link href="/dashboard/settings" onClick={() => setIsMobileMenuOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all mt-8", pathname === '/dashboard/settings' ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
                      <Settings className="h-4 w-4" />
                      Profil & Ayarlar
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
