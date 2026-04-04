"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Moon, Sun, LogOut, Laptop } from "lucide-react"

export default function SettingsPage() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => setMounted(true), [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight border-b pb-4">Profil ve Ayarlar</h1>
        <p className="text-muted-foreground mt-4 text-base">Uygulama tercihlerinizi ve cihazınızın erişimini buradan yönetebilirsiniz.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Görünüm Ayarları</CardTitle>
            <CardDescription>Sistemi kendi zevkinize göre özelleştirin.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {mounted ? (
              <>
                <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")} className="w-32 shadow-sm">
                  <Sun className="w-4 h-4 mr-2" /> Aydınlık
                </Button>
                <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")} className="w-32 shadow-sm">
                  <Moon className="w-4 h-4 mr-2" /> Karanlık
                </Button>
                <Button variant={theme === "system" ? "default" : "outline"} onClick={() => setTheme("system")} className="w-32 shadow-sm">
                  <Laptop className="w-4 h-4 mr-2" /> Sistem
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="w-32 shadow-sm"><Sun className="w-4 h-4 mr-2" /> Aydınlık</Button>
                <Button variant="outline" className="w-32 shadow-sm"><Moon className="w-4 h-4 mr-2" /> Karanlık</Button>
                <Button variant="outline" className="w-32 shadow-sm"><Laptop className="w-4 h-4 mr-2" /> Sistem</Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Güvenli Çıkış</CardTitle>
            <CardDescription className="text-destructive/80">Oturumunuzu bu cihazdan açık unutmayın.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout} className="shadow-sm font-semibold">
              <LogOut className="w-4 h-4 mr-2" /> Mevcut Oturumu Kapat
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
