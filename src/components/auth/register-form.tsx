"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { TURKEY_LOCATIONS } from "@/lib/constants/locations"
import Link from "next/link"
import { 
  Building2, MapPin, ShieldCheck, 
  ChevronRight, Search, X, Check,
  ArrowRight, AlertCircle, Loader2, Sparkles,
  Info
} from "lucide-react"

const CITIES = Object.keys(TURKEY_LOCATIONS).sort((a, b) => a.localeCompare(b, "tr"))

const registerSchema = z.object({
  ad_soyad: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır."),
  galeri_adi: z.string().min(2, "Galeri ismi en az 2 karakter olmalıdır."),
  phone: z.string().length(11, "Telefon numarası 11 hane olmalıdır (05xx...)."),
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
})

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      ad_soyad: "",
      galeri_adi: "",
      phone: "",
      email: "",
      password: "",
    },
  })

  const handleRegisterRaw = async (data: RegisterValues) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Kayıt işlemi (Sadece E-posta ile)
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            ad_soyad: data.ad_soyad,
            galeri_adi: data.galeri_adi,
            phone: data.phone,
            hesap_durumu: 'beklemede'
          }
        }
      })

      if (signUpError) {
        // Özel hata yakalama (Unique constraints vb.)
        if (signUpError.message.includes("unique_phone")) {
          setError("Bu telefon numarası zaten kayıtlı.")
        } else if (signUpError.message.includes("unique_galeri_adi")) {
          setError("Bu galeri ismi zaten kullanımda.")
        } else if (signUpError.message.includes("unique_email") || signUpError.message.includes("already registered")) {
          setError("Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.")
        } else {
          setError(signUpError.message)
        }
        setLoading(false)
        return
      }

      router.push("/dashboard")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kayıt sırasında bir hata oluştu."
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20 relative isolate">
      
      {/* FIXED TOP ERROR BAR */}
      {error && (
        <div className="fixed top-0 left-0 right-0 z-[1000] bg-red-600 text-white p-4 text-center font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-[0_5px_30px_rgba(220,38,38,0.5)] animate-in slide-in-from-top duration-300">
           <AlertCircle className="w-5 h-5" />
           {error}
           <button onClick={() => setError(null)} className="ml-auto bg-black/20 p-1 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">ÜYELİK</h1>
        <h1 className="text-5xl font-black text-primary italic tracking-tighter uppercase leading-none">BAŞVURUSU</h1>
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest max-w-sm mx-auto">
          GaleriLink B2B ağına katılmak için bilgilerinizi eksiksiz doldurunuz.
        </p>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative">
        <form onSubmit={handleSubmit(handleRegisterRaw)} className="space-y-14 relative z-10" noValidate>
          
          {/* Section 1: Business */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">ÜYELİK BİLGİLERİ</h3>
                <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Hesabınızı oluşturun</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Ad Soyad</Label>
                <div className="relative">
                  <input 
                    {...register("ad_soyad")}
                    type="text"
                    placeholder="Adınız Soyadınız"
                    className={`w-full h-16 px-6 bg-white/5 border-2 rounded-2xl font-black text-lg outline-none transition-all placeholder:text-white/10 ${errors.ad_soyad ? "border-red-500/50" : "border-white/5 focus:border-primary/50"}`}
                  />
                  {errors.ad_soyad && <p className="text-[8px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.ad_soyad.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Galeri İsmi</Label>
                <div className="relative">
                  <input 
                    {...register("galeri_adi")}
                    type="text"
                    placeholder="Örn: Özkar Galeri"
                    className={`w-full h-16 px-6 bg-white/5 border-2 rounded-2xl font-black text-lg outline-none transition-all placeholder:text-white/10 ${errors.galeri_adi ? "border-red-500/50" : "border-white/5 focus:border-primary/50"}`}
                  />
                  {errors.galeri_adi && <p className="text-[8px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.galeri_adi.message}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Credentials */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Eri̇şi̇m Ayarları</h3>
                <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Sisteme giriş bilgileriniz</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Telefon Numarası</Label>
                <Input id="phone" type="tel" {...register("phone")} placeholder="05xx..." className="h-16 bg-white/5 border-2 border-white/5 text-white rounded-2xl font-black text-xl placeholder:text-white/10" />
                {errors.phone && <p className="text-[8px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">E-posta Adresi</Label>
                <Input id="email" type="email" {...register("email")} placeholder="eposta@adresiniz.com" className="h-16 bg-white/5 border-2 border-white/5 text-white rounded-2xl font-black text-xl placeholder:text-white/10" />
                {errors.email && <p className="text-[8px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Güçlü Bir Şifre</Label>
                <Input id="password" type="password" {...register("password")} placeholder="••••••••" className="h-16 bg-white/5 border-2 border-white/5 text-white rounded-2xl font-black text-xl placeholder:text-white/10" />
                {errors.password && <p className="text-[8px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.password.message}</p>}
              </div>
            </div>
          </section>

          <div className="pt-6">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-24 rounded-[2.5rem] text-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-5 shadow-2xl shadow-primary/40 transition-all active:scale-95 group relative overflow-hidden"
            >
              {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : (
                <>
                  <Sparkles className="w-8 h-8 group-hover:animate-bounce" />
                  KAYIT OL
                  <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </Button>
            
            <div className="mt-8 flex items-center justify-center gap-2 px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
              <Info className="w-4 h-4 text-primary" />
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">
                Üye olduğunuzda kullanım koşullarını kabul etmiş sayılırsınız.
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">
              Zaten üye misiniz? <Link href="/login" className="text-primary/60 hover:text-primary ml-1 font-black">GİRİŞ YAPIN</Link>
            </p>
          </div>

        </form>
      </div>
    </div>
  )
}
