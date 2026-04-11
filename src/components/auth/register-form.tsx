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
  company_name: z.string().min(2, "İşletme adı en az 2 karakter olmalıdır."),
  tax_no: z.string().min(2, "Vergi numarası gereklidir."),
  city: z.string().min(1, "Lütfen il seçiniz."),
  district: z.string().min(1, "Lütfen ilçe seçiniz."),
  phone: z.string().min(11, "Geçerli bir telefon numarası giriniz (05xx...)."),
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
})

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Selection Engine States
  const [city, setCity] = useState("")
  const [district, setDistrict] = useState("")
  const [isCitySearchOpen, setIsCitySearchOpen] = useState(false)
  const [isDistrictSearchOpen, setIsDistrictSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      company_name: "",
      tax_no: "",
      city: "",
      district: "",
      phone: "",
      email: "",
      password: "",
    },
  })

  // Sync state to form
  useEffect(() => { setValue("city", city, { shouldValidate: !!city }) }, [city, setValue])
  useEffect(() => { setValue("district", district, { shouldValidate: !!district }) }, [district, setValue])

  const districts = useMemo(() => city ? TURKEY_LOCATIONS[city] || [] : [], [city])
  const filteredCities = useMemo(() => CITIES.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm])
  const filteredDistricts = useMemo(() => districts.filter(d => d.toLowerCase().includes(searchTerm.toLowerCase())), [districts, searchTerm])

  const handleRegisterRaw = async (data: RegisterValues) => {
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
            city: city,
            district: district,
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      router.push("/waiting-approval")
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

      {/* Search Overlays */}
      {(isCitySearchOpen || isDistrictSearchOpen) && (
        <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col p-6 overflow-hidden h-[100dvh]">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-white uppercase italic tracking-widest">
                {isCitySearchOpen ? "Şehir Seçiniz" : `${city} - İlçe Seçiniz`}
              </h3>
              <button 
                type="button"
                onClick={() => { setIsCitySearchOpen(false); setIsDistrictSearchOpen(false); setSearchTerm(""); }} 
                className="p-4 bg-white/5 rounded-full"
              >
                <X className="w-8 h-8 text-white" />
              </button>
           </div>
           
           <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
              <input 
                autoFocus
                placeholder="Şehir/İlçe ara..." 
                className="w-full h-16 pl-14 bg-white/5 border-2 border-white/10 text-white rounded-2xl text-xl font-bold focus:border-primary outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

           <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pb-20">
              {(isCitySearchOpen ? filteredCities : filteredDistricts).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    if (isCitySearchOpen) { setCity(item); setDistrict(""); setIsCitySearchOpen(false); }
                    else { setDistrict(item); setIsDistrictSearchOpen(false); }
                    setSearchTerm("")
                  }}
                  className={`w-full h-18 px-8 flex items-center justify-between rounded-2xl text-left font-black tracking-widest transition-all ${((isCitySearchOpen ? city : district) === item) ? "bg-primary text-white shadow-2xl" : "bg-white/5 text-white/40"}`}
                >
                  <span className="uppercase text-lg">{item}</span>
                  {(isCitySearchOpen ? city : district) === item && <Check className="w-6 h-6 text-white" />}
                </button>
              ))}
           </div>
        </div>
      )}

      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">ÜYELİK</h1>
        <h1 className="text-5xl font-black text-primary italic tracking-tighter uppercase leading-none">BAŞVURUSU</h1>
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest max-w-sm mx-auto">
          GaleriLink B2B ağına katılmak için ticari bilgilerinizi eksiksiz doldurunuz.
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
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Ti̇cari̇ Bi̇lgi̇ler</h3>
                <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Resmi işletme kayıtlarınız</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">İşletme / Galeri İsmi</Label>
                <div className="relative">
                  <input 
                    {...register("company_name")}
                    type="text"
                    placeholder="Örn: Özkar Galeri"
                    className={`w-full h-16 px-6 bg-white/5 border-2 rounded-2xl font-black text-lg outline-none transition-all placeholder:text-white/10 ${errors.company_name ? "border-red-500/50" : "border-white/5 focus:border-primary/50"}`}
                  />
                  {errors.company_name && <p className="text-[8px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.company_name.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Vergi Levhası Numarası</Label>
                <div className="relative">
                  <input 
                    {...register("tax_no")}
                    type="text"
                    placeholder="Vergi No giriniz"
                    className={`w-full h-16 px-6 bg-white/5 border-2 rounded-2xl font-black text-lg outline-none transition-all placeholder:text-white/10 ${errors.tax_no ? "border-red-500/50" : "border-white/5 focus:border-primary/50"}`}
                  />
                  {errors.tax_no && <p className="text-[8px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.tax_no.message}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Location */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Lokasyon Bi̇lgi̇si̇</h3>
                <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Hizmet verdiğiniz bölge</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Bulunduğunuz İl</Label>
                <button 
                  type="button" 
                  onClick={() => setIsCitySearchOpen(true)}
                  className={`w-full h-16 px-6 flex items-center justify-between bg-white/5 border-2 rounded-2xl transition-all ${city ? "border-primary/50 text-white" : "border-white/5 text-white/20"}`}
                >
                  <span className="font-black uppercase tracking-widest text-lg">{city || "ŞEHİR SEÇİN"}</span>
                  <ChevronRight className="w-5 h-5 opacity-20" />
                </button>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Bulunduğunuz İlçe</Label>
                <button 
                  type="button" 
                  disabled={!city}
                  onClick={() => setIsDistrictSearchOpen(true)}
                  className={`w-full h-16 px-6 flex items-center justify-between bg-white/5 border-2 rounded-2xl transition-all disabled:opacity-10 ${district ? "border-primary/50 text-white" : "border-white/5 text-white/20"}`}
                >
                  <span className="font-black uppercase tracking-widest text-lg">{district || (city ? "İlÇE SEÇİN" : "ŞEHİR BEKLENİYOR")}</span>
                  <ChevronRight className="w-5 h-5 opacity-20" />
                </button>
              </div>
            </div>
          </section>

          {/* Section 3: Credentials */}
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
                <Input id="phone" type="tel" {...register("phone")} placeholder="05xx..." className="h-16 bg-white/5 border-2 border-white/5 text-white rounded-2xl font-black text-xl" />
                {errors.phone && <p className="text-[8px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">E-posta</Label>
                <Input id="email" type="email" {...register("email")} placeholder="eposta@adresiniz.com" className="h-16 bg-white/5 border-2 border-white/5 text-white rounded-2xl font-black text-xl" />
                {errors.email && <p className="text-[8px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Güçlü Bir Şifre</Label>
                <Input id="password" type="password" {...register("password")} placeholder="••••••••" className="h-16 bg-white/5 border-2 border-white/5 text-white rounded-2xl font-black text-xl" />
                {errors.password && <p className="text-[8px] text-red-500 font-bold uppercase mt-1 ml-1">{errors.password.message}</p>}
              </div>
            </div>
          </section>

          <div className="pt-6">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-24 rounded-[2.5rem] text-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-5 shadow-2xl shadow-primary/40 transition-all active:scale-95 group relative overflow-hidden"
            >
              {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : (
                <>
                  <Sparkles className="w-8 h-8 group-hover:animate-bounce" />
                  BAŞVURUYU GÖNDER
                  <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </Button>
            
            <div className="mt-8 flex items-center justify-center gap-2 px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
              <Info className="w-4 h-4 text-primary" />
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">
                Başvurunuz incelendikten sonra yönetici onayı ile aktif edilecektir.
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
