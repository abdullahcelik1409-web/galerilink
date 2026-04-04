"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { TURKEY_LOCATIONS } from "@/lib/constants/locations"
import Link from "next/link"
import { Eye, EyeOff, Lock, Mail, Store, Phone, MapPin, ShieldCheck, Briefcase, UserPlus } from "lucide-react"

const CITIES = Object.keys(TURKEY_LOCATIONS).sort((a, b) => a.localeCompare(b, "tr"))

const registerSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
  company_name: z.string().min(2, "İşletme adı en az 2 karakter olmalıdır."),
  tax_no: z.string().min(2, "Vergi numarası gereklidir."),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz."),
  city: z.string().min(1, "Lütfen il seçiniz."),
  district: z.string().min(1, "Lütfen ilçe seçiniz."),
})

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      company_name: "",
      tax_no: "",
      phone: "",
      city: "",
      district: "",
    },
  })

  const selectedCity = watch("city")

  const districts = useMemo(() => 
    selectedCity ? TURKEY_LOCATIONS[selectedCity] : [],
    [selectedCity]
  )

  const handleRegister = async (data: RegisterValues) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            company_name: data.company_name,
            tax_no: data.tax_no,
            phone: data.phone,
            city: data.city,
            district: data.district,
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      router.push("/waiting-approval")
    } catch (err: any) {
      setError(err?.message || "Beklenmeyen bir hata oluştu.")
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/20 rounded-[3rem] shadow-2xl p-6 md:p-12 space-y-10 mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Hesap Oluştur</h2>
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest leading-relaxed">B2B ağımıza katılmak için galeri bilgilerinizi girin.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/20 border border-primary/30 px-4 py-2 rounded-2xl shrink-0">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Güvenli Başvuru</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleRegister)} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Identity Section */}
          <div className="bg-white/10 border border-white/10 p-6 rounded-[2rem] space-y-5">
             <div className="flex items-center gap-2 text-white/80 mb-2">
                <Briefcase className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">İŞLETME KİMLİĞİ</span>
             </div>
             
             <div className="space-y-1.5">
                <Label htmlFor="company_name" className="text-[9px] font-black uppercase tracking-widest text-white/60 ml-1">İşletme / Galeri Adı</Label>
                <div className="relative group">
                   <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                   <Input 
                     id="company_name" 
                     {...register("company_name")} 
                     className={`h-12 pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all ${errors.company_name ? "border-red-500/50" : ""}`}
                   />
                </div>
                {errors.company_name && <p className="text-[9px] text-red-500 font-bold uppercase pl-1">{errors.company_name.message}</p>}
             </div>

             <div className="space-y-1.5">
                <Label htmlFor="tax_no" className="text-[9px] font-black uppercase tracking-widest text-white/60 ml-1">Vergi Levhası No</Label>
                <div className="relative group">
                   <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                   <Input 
                     id="tax_no" 
                     {...register("tax_no")}
                     className={`h-12 pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all ${errors.tax_no ? "border-red-500/50" : ""}`}
                   />
                </div>
                {errors.tax_no && <p className="text-[9px] text-red-500 font-bold uppercase pl-1">{errors.tax_no.message}</p>}
             </div>
          </div>

          {/* Location & Contact Section */}
          <div className="bg-white/10 border border-white/10 p-6 rounded-[2rem] space-y-5">
             <div className="flex items-center gap-2 text-white/80 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">LOKASYON & İLETİŞİM</span>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <Label className="text-[9px] font-black uppercase tracking-widest text-white/60 ml-1">İl</Label>
                   <Controller
                     name="city"
                     control={control}
                     render={({ field }) => (
                       <Select 
                         onValueChange={(v) => {
                           field.onChange(v)
                           setValue("district", "")
                         }} 
                         value={field.value}
                       >
                         <SelectTrigger className={`h-12 bg-white/10 border-white/20 text-white rounded-xl focus:ring-primary/20 ${errors.city ? "border-red-500/50" : ""}`}>
                           <SelectValue placeholder="İl" />
                         </SelectTrigger>
                         <SelectContent className="bg-slate-900 border-white/20 text-white max-h-80">
                           {CITIES.map((city) => (
                             <SelectItem key={city} value={city} className="focus:bg-primary focus:text-white">
                               {city}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     )}
                   />
                </div>

                <div className="space-y-1.5">
                   <Label className="text-[9px] font-black uppercase tracking-widest text-white/60 ml-1">İlçe</Label>
                   <Controller
                     name="district"
                     control={control}
                     render={({ field }) => (
                       <Select 
                         onValueChange={field.onChange} 
                         value={field.value}
                         disabled={!selectedCity}
                       >
                         <SelectTrigger className={`h-12 bg-white/10 border-white/20 text-white rounded-xl focus:ring-primary/20 ${errors.district ? "border-red-500/50" : ""}`}>
                           <SelectValue placeholder={selectedCity ? "İlçe" : "-"} />
                         </SelectTrigger>
                         <SelectContent className="bg-slate-900 border-white/20 text-white max-h-80">
                           {districts.map((dist) => (
                             <SelectItem key={dist} value={dist} className="focus:bg-primary focus:text-white">
                               {dist}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     )}
                   />
                </div>
             </div>

             <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[9px] font-black uppercase tracking-widest text-white/60 ml-1">Resmi Telefon</Label>
                <div className="relative group">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                   <Input 
                     id="phone" 
                     type="tel" 
                     {...register("phone")}
                     placeholder="05XX XXX XX XX"
                     className={`h-12 pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all ${errors.phone ? "border-red-500/50" : ""}`}
                   />
                </div>
                {errors.phone && <p className="text-[9px] text-red-500 font-bold uppercase pl-1">{errors.phone.message}</p>}
             </div>
          </div>
        </div>

        {/* Security Section (Full Width) */}
        <div className="bg-primary/10 border border-primary/20 p-8 rounded-[2rem] space-y-6">
           <div className="flex items-center gap-2 text-primary/80 mb-2">
              <Lock className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">SİSTEM ERİŞİM BİLGİLERİ</span>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-widest text-white/60 ml-1">Giriş E-posta Adresi</Label>
                <div className="relative group">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                   <Input 
                     id="email" 
                     type="email" 
                     {...register("email")}
                     placeholder="örnek@galeri.com"
                     className={`h-12 pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all ${errors.email ? "border-red-500/50" : ""}`}
                   />
                </div>
                {errors.email && <p className="text-[9px] text-red-500 font-bold uppercase pl-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[9px] font-black uppercase tracking-widest text-white/60 ml-1">Sistem Şifresi</Label>
                <div className="relative group">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                   <Input 
                     id="password" 
                     type={showPassword ? "text" : "password"} 
                     {...register("password")}
                     className={`h-12 pl-12 pr-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all ${errors.password ? "border-red-500/50" : ""}`}
                   />
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                   >
                     {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                   </button>
                </div>
                {errors.password && <p className="text-[9px] text-red-500 font-bold uppercase pl-1">{errors.password.message}</p>}
              </div>
           </div>
        </div>
        
        {error && <div className="text-xs p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl font-bold animate-shake">{error}</div>}
        
        <Button className="w-full h-16 rounded-[1.5rem] text-base font-black uppercase tracking-widest cta-button gap-3" type="submit" disabled={loading}>
          <UserPlus className="w-5 h-5" />
          {loading ? "Kayıt Yapılıyor..." : "Ağa Katıl ve Başvuruyu Gönder"}
        </Button>
      </form>

      <div className="pt-8 border-t border-white/10 text-center px-12">
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
          Zaten bir bayi hesabınız var mı?{" "}
          <Link href="/login" className="text-primary hover:text-primary/80 transition-colors ml-1 font-black">
            Güvenli Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  )
}
