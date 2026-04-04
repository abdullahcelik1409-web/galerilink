"use client"

import { useState, useRef, useMemo, useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { formatLocation } from "@/lib/utils"
import { TURKEY_LOCATIONS } from "@/lib/constants/locations"
import { UploadCloud, ImagePlus, X, Type, Activity, Gauge, MapPin, Sparkles, CheckCircle2 } from "lucide-react"
import { ExpertiseSelector } from "./expertise-selector"
import { cn } from "@/lib/utils"

const CITIES = Object.keys(TURKEY_LOCATIONS).sort((a, b) => a.localeCompare(b, "tr"))

const carSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır."),
  brand: z.string().min(1, "Marka gereklidir."),
  model: z.string().min(1, "Model gereklidir."),
  year: z.string().min(4, "Geçerli bir yıl giriniz."),
  km: z.string().min(1, "Kilometre giriniz."),
  price_b2b: z.string().min(1, "Fiyat giriniz."),
  location_city: z.string().min(1, "Lütfen il seçiniz."),
  location_district: z.string().min(1, "Lütfen ilçe seçiniz."),
  damage_report: z.string().optional(),
  expertise: z.any().optional(),
})

type CarFormValues = z.infer<typeof carSchema>

const CHAPTERS = [
  { id: 'vision', label: 'Vizyon', icon: ImagePlus },
  { id: 'identity', label: 'Kimlik', icon: Type },
  { id: 'vitality', label: 'Canlılık', icon: Gauge },
  { id: 'value', label: 'Değer', icon: Sparkles },
]

// Memoized Expertise - prevents re-render on every keystroke
const MemoizedExpertise = memo(ExpertiseSelector)

// Isolated sidebar that watches only its own fields (doesn't cause full form re-render)
function PreviewSidebar({ control, filesCount, error, loading }: { 
  control: any; filesCount: number; error: string | null; loading: boolean 
}) {
  const title = useWatch({ control, name: "title" })
  const price = useWatch({ control, name: "price_b2b" })

  return (
    <div className="md:col-span-4 lg:sticky lg:top-24 space-y-6">
       <div className="bento-card p-8 rounded-[2.5rem] space-y-6">
          <div className="space-y-2">
             <h3 className="text-lg font-black uppercase tracking-tighter">İlan Önizleme</h3>
             <p className="text-xs text-muted-foreground font-medium">İlanınızı yayınlamadan önce girişlerinizi kontrol edin.</p>
          </div>

          <div className="space-y-4 pt-4 border-t">
             <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Başlık</span>
                <span className="font-bold truncate max-w-[150px]">{title || "---"}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Fiyat Bilgisi</span>
                <span className="font-technical font-black text-primary">{price ? `${Number(price).toLocaleString('tr-TR')} ₺` : "---"}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Görsel Sayısı</span>
                <span className="font-bold">{filesCount} Adet</span>
             </div>
          </div>

          {error && (
             <div className="p-4 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 text-[10px] font-black uppercase tracking-widest leading-4">
                {error}
             </div>
          )}

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-16 rounded-2xl text-base font-black uppercase tracking-widest cta-button gap-3"
          >
             {loading ? (
               <UploadCloud className="w-6 h-6 animate-pulse" />
             ) : (
               <>
                 <CheckCircle2 className="w-5 h-5" />
                 İlanı Ağda Yayınla
               </>
             )}
          </Button>

          <div className="p-4 bg-muted/30 rounded-2xl">
             <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed text-center">
                İlanı yayınlayarak B2B ağ kurallarını ve satış komisyon oranlarını kabul etmiş sayılırsınız.
             </p>
          </div>
       </div>
       
       <div className="bento-card p-6 rounded-[2rem] bg-emerald-500/5 border-emerald-500/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
             <Sparkles className="w-5 h-5" />
          </div>
          <div>
             <p className="text-xs font-black uppercase tracking-tight text-emerald-700">Yapay Zeka Asistanı</p>
             <p className="text-[10px] font-bold text-emerald-600/80">İlan başlığınız optimize edildi.</p>
          </div>
       </div>
    </div>
  )
}

// Isolated progress bar that watches all fields but doesn't cause children re-render
function ProgressBar({ control }: { control: any }) {
  const formValues = useWatch({ control })
  
  const progress = useMemo(() => {
    const fields = Object.keys(carSchema.shape)
    const filled = fields.filter(f => !!(formValues as any)?.[f]).length
    return Math.round((filled / fields.length) * 100)
  }, [formValues])

  return (
    <div className="flex items-center gap-4 min-w-[200px]">
       <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
             className="h-full bg-primary transition-all duration-700 ease-in-out" 
             style={{ width: `${progress}%` }}
          />
       </div>
       <span className="font-technical text-[10px] font-bold text-primary uppercase shrink-0">% {progress} Tamamlandı</span>
    </div>
  )
}

export function AddCarForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeChapter, setActiveChapter] = useState('vision')

  // Image states
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CarFormValues>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      title: "",
      brand: "",
      model: "",
      year: new Date().getFullYear().toString(),
      km: "",
      price_b2b: "",
      location_city: "",
      location_district: "",
      damage_report: "",
      expertise: {},
    },
  })

  // Only watch city for district dropdown - isolated
  const selectedCity = useWatch({ control, name: "location_city" })
  const districts = useMemo(() => 
    selectedCity ? TURKEY_LOCATIONS[selectedCity] : [],
    [selectedCity]
  )

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...selectedFiles])
      const newUrls = selectedFiles.map(file => URL.createObjectURL(file))
      setPreviewUrls(prev => [...prev, ...newUrls])
    }
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const uploadToSupabase = async (file: File) => {
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `cars/${fileName}`
    const { error } = await supabase.storage.from('car_images').upload(filePath, file)
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('car_images').getPublicUrl(filePath)
    return publicUrl
  }

  const onSubmit = async (data: CarFormValues) => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı")

      let imageUrls: string[] = []
      if (files.length > 0) {
        imageUrls = await Promise.all(files.map(f => uploadToSupabase(f)))
      }

      const { error: dbError } = await supabase.from('cars').insert({
        seller_id: user.id,
        title: data.title || `${formatLocation(data.brand)} ${formatLocation(data.model)}`,
        brand: formatLocation(data.brand),
        model: formatLocation(data.model),
        year: parseInt(data.year),
        km: parseInt(data.km),
        damage_report: data.damage_report,
        expertise: data.expertise,
        price_b2b: parseFloat(data.price_b2b),
        location_city: data.location_city,
        location_district: data.location_district,
        images: imageUrls,
        is_active: true
      })

      if (dbError) throw dbError
      router.push("/dashboard/my-cars")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "İlan yüklenirken bir hata oluştu.")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Journey Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b py-4 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
               {CHAPTERS.map((chapter, i) => {
                 const Icon = chapter.icon
                 const isActive = activeChapter === chapter.id
                 return (
                   <button
                     key={chapter.id}
                     type="button"
                     onClick={() => {
                        const element = document.getElementById(chapter.id)
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        setActiveChapter(chapter.id)
                     }}
                     className={cn(
                       "group flex items-center gap-2 transition-all duration-300 relative pb-2",
                       isActive ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                     )}
                   >
                     <div className={cn(
                       "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                       isActive ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20" : "bg-muted group-hover:bg-muted-foreground/20"
                     )}>
                        {i + 1}
                     </div>
                     <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">{chapter.label}</span>
                   </button>
                 )
               })}
          </div>
          <ProgressBar control={control} />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Multi-form Track (8 cols) */}
        <div className="md:col-span-8 space-y-12">
          
          {/* 1. VISION - Photos */}
          <section id="vision" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3">
               <ImagePlus className="w-5 h-5 text-primary" />
               <h2 className="text-xl font-black uppercase tracking-tight">1. Vizyon • <span className="text-muted-foreground text-sm font-bold">Aracın Görünümü</span></h2>
            </div>
            
            <div className="bento-card p-6 rounded-3xl group">
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="relative aspect-[4/3] rounded-2xl overflow-hidden border group/img shadow-sm">
                      <img src={url} alt="Preview" className="object-cover w-full h-full transition-transform duration-500 group-hover/img:scale-110" />
                      <button type="button" onClick={() => removeFile(i)} className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground rounded-full p-1.5 hover:bg-destructive opacity-0 group-hover/img:opacity-100 transition-all">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase">Kapak {i + 1}</div>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center aspect-[4/3] rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/60 hover:bg-primary/5 transition-all group/upload"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-2 group-hover/upload:scale-110 transition-transform">
                       <UploadCloud className="w-6 h-6 text-primary opacity-80" />
                    </div>
                    <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Fotoğraf Ekle</span>
                  </button>
               </div>
               <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
               <p className="mt-4 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">En az 3, ideal olarak 8-12 adet kaliteli fotoğraf ekleyiniz.</p>
            </div>
          </section>

          {/* 2. IDENTITY - Core Info */}
          <section id="identity" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3">
               <Type className="w-5 h-5 text-primary" />
               <h2 className="text-xl font-black uppercase tracking-tight">2. Kimlik • <span className="text-muted-foreground text-sm font-bold">Model Tanımı</span></h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="md:col-span-3 bento-card p-6 rounded-3xl">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2 block">İlan Başlığı</Label>
                  <Input 
                     {...register("title")}
                     placeholder="Örn: BMW 3.20i M Sport Hatasız - 14 Günlük Acil" 
                     className={cn(
                        "h-14 text-xl font-bold bg-transparent border-none p-0 focus-visible:ring-0 placeholder:opacity-30",
                        errors.title && "text-destructive"
                     )}
                  />
                  {errors.title && <p className="text-[10px] text-destructive font-bold uppercase mt-1">{errors.title.message}</p>}
               </div>
               
               <div className="bento-card p-6 rounded-3xl">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">Marka</Label>
                  <Input 
                     {...register("brand")} 
                     placeholder="Marka" 
                     className="bg-transparent border-primary/10 focus:border-primary uppercase font-bold" 
                  />
               </div>

               <div className="bento-card p-6 rounded-3xl md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">Model ve Paket</Label>
                  <Input 
                     {...register("model")} 
                     placeholder="Model örn: 3.20i Luxury Line" 
                     className="bg-transparent border-primary/10 focus:border-primary uppercase font-bold" 
                  />
               </div>
            </div>
          </section>

          {/* 3. VITALITY - Technical Specs */}
          <section id="vitality" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3">
               <Gauge className="w-5 h-5 text-primary" />
               <h2 className="text-xl font-black uppercase tracking-tight">3. Canlılık • <span className="text-muted-foreground text-sm font-bold">Teknik Durum</span></h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               <div className="bento-card p-6 rounded-3xl">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Model Yılı</Label>
                  <Input 
                     type="number"
                     {...register("year")} 
                     className="font-technical text-2xl font-black bg-transparent border-none p-0 focus-visible:ring-0 text-primary" 
                  />
               </div>
               <div className="bento-card p-6 rounded-3xl">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Kilometre</Label>
                  <Controller
                     name="km"
                     control={control}
                     render={({ field }) => {
                       const displayValue = field.value
                         ? Number(field.value).toLocaleString('tr-TR')
                         : ''
                       return (
                         <input
                           inputMode="numeric"
                           value={displayValue}
                           placeholder="0"
                           onChange={(e) => {
                             const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '')
                             field.onChange(raw)
                           }}
                           className="font-technical text-2xl font-black bg-transparent border-none p-0 outline-none text-primary w-full"
                         />
                       )
                     }}
                  />
               </div>
               <div className="bento-card p-6 rounded-3xl md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">Bulunduğu Lokasyon</Label>
                  <div className="grid grid-cols-2 gap-4">
                     <Controller
                       name="location_city"
                       control={control}
                       render={({ field }) => (
                         <Select value={field.value} onValueChange={(v) => { field.onChange(v); setValue("location_district", "") }}>
                           <SelectTrigger className="bg-transparent border-primary/10 font-bold uppercase text-[11px]"><SelectValue placeholder="İl" /></SelectTrigger>
                           <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                         </Select>
                       )}
                     />
                     <Controller
                       name="location_district"
                       control={control}
                       render={({ field }) => (
                         <Select value={field.value} onValueChange={field.onChange} disabled={!selectedCity}>
                           <SelectTrigger className="bg-transparent border-primary/10 font-bold uppercase text-[11px]"><SelectValue placeholder="İlçe" /></SelectTrigger>
                           <SelectContent>{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                         </Select>
                       )}
                     />
                  </div>
               </div>
            </div>
          </section>

          {/* 4. VALUE - Price & Expertise */}
          <section id="value" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3">
               <Sparkles className="w-5 h-5 text-primary" />
               <h2 className="text-xl font-black uppercase tracking-tight">4. Değer • <span className="text-muted-foreground text-sm font-bold">Fiyat ve Ekspertiz</span></h2>
            </div>

            <div className="bento-card p-8 rounded-[2.5rem] bg-slate-950 text-white border-none shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                     <div>
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3 block">Ağ İçi Galerici Fiyatı</Label>
                        <div className="flex items-baseline gap-3 overflow-hidden">
                           <span className="text-2xl md:text-4xl font-light text-white/30 shrink-0">₺</span>
                           <Controller
                              name="price_b2b"
                              control={control}
                              render={({ field }) => {
                                const displayValue = field.value
                                  ? Number(field.value).toLocaleString('tr-TR')
                                  : ''

                                return (
                                  <input
                                    inputMode="numeric"
                                    value={displayValue}
                                    placeholder="0"
                                    onChange={(e) => {
                                      // Strip dots, keep only digits
                                      const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '')
                                      field.onChange(raw)
                                    }}
                                    className="font-technical text-3xl md:text-5xl font-black bg-transparent border-none p-0 outline-none text-white placeholder:text-white/5 w-full min-w-0"
                                  />
                                )
                              }}
                           />
                        </div>
                        <p className="mt-4 text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                           <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                           Bu fiyat "Müşteri Modu" aktifken gizlenir.
                        </p>
                     </div>

                     <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 block">Ek Notlar & Tramer Bilgisi</Label>
                        <Textarea 
                           {...register("damage_report")}
                           className="min-h-[160px] bg-white/5 border-white/10 rounded-2xl resize-none text-white/80 text-sm p-4 focus:border-white/30"
                           placeholder="Lokal boya, değişen detayları, tramer tutarı veya özel notlarınız..."
                        />
                     </div>
                  </div>

                  <div className="space-y-6 flex flex-col justify-center">
                     <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-inner">
                        <div className="mb-6 flex items-center justify-between">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-white/60">Görsel Hasar Kaydı</Label>
                           <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                        </div>
                        <Controller
                           name="expertise"
                           control={control}
                           render={({ field }) => (
                           <MemoizedExpertise 
                              value={field.value} 
                              onChange={field.onChange} 
                           />
                           )}
                        />
                     </div>
                  </div>
               </div>
            </div>
          </section>
        </div>

        {/* Right Action Sidebar (4 cols) - Isolated re-renders */}
        <PreviewSidebar control={control} filesCount={files.length} error={error} loading={loading} />

      </form>
    </div>
  )
}
