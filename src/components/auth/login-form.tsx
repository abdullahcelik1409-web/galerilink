"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setError("E-posta adresi veya şifre hatalı.")
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-2xl p-6 md:p-10 space-y-8 mx-auto w-full">
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white tracking-tight uppercase">Giriş Yap</h2>
        <p className="text-white/60 text-xs font-bold uppercase tracking-widest leading-relaxed">Sisteme erişmek için kimliğinizi doğrulayın.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 ml-1">E-posta Adresi</Label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
              <Input 
                id="email" 
                type="email" 
                placeholder="ornek@domain.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="h-14 pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 ml-1">Güvenlik Şifresi</Label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="h-14 pl-12 pr-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <Button className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest cta-button" type="submit" disabled={loading}>
          {loading ? "Doğrulanıyor..." : "Sisteme Giriş Yap"}
        </Button>
      </form>

      <div className="pt-6 border-t border-white/10 text-center">
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
          Hesabınız yok mu?{" "}
          <Link href="/register" className="text-primary hover:text-primary/80 transition-colors ml-1 font-black">
            Yeni Kayıt Oluştur
          </Link>
        </p>
      </div>
    </div>
  )
}
