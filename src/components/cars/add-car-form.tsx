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
import { UploadCloud, ImagePlus, X, Type, Activity, Gauge, MapPin, Sparkles, CheckCircle2, Flame, Info } from "lucide-react"
import { ExpertiseSelector } from "./expertise-selector"
import { cn } from "@/lib/utils"
import { compressImage } from "@/lib/image-optimization"
import { TaxonomyColumnSelector } from "./taxonomy-column-selector"

interface ImageState {
  file: File;
  previewUrl: string;
  isOptimizing: boolean;
  isOptimized: boolean;
  error?: string;
}

const CITIES = Object.keys(TURKEY_LOCATIONS).sort((a, b) => a.localeCompare(b, "tr"))

const carSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır."),
  brand: z.string().min(1, "Marka gereklidir."),
  model: z.string().min(1, "Model gereklidir."),
  year: z.string().min(4, "Geçerli bir yıl giriniz."),
  km: z.string().min(1, "Kilometre giriniz."),
  price_b2b: z.string().min(1, "Fiyat giriniz."),
  location_city: z.string().min(1, "Lütfen şehir seçiniz."),
  location_district: z.string().min(1, "Lütfen ilçe seçiniz."),
  package_id: z.string().optional(), // Optional if manual entry is used
  // Manual entry fields
  manual_data: z.object({
    kategori_id: z.string().optional(),
    kategori_name: z.string().optional(),
    marka: z.string().optional(),
    model: z.string().optional(),
    seri: z.string().optional(),
    motor: z.string().optional(),
    sanziman: z.string().optional(),
    kasa: z.string().optional(),
    paket: z.string().optional(),
  }).optional(),
  is_opportunity: z.boolean(),
  opportunity_reason: z.string().optional(),
  opportunity_expires_at: z.string().optional(),
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
                 İlanı Yayınla
               </>
             )}
          </Button>

          <div className="p-4 bg-muted/30 rounded-2xl">
             <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed text-center">
                İlanı yayınlayarak B2B ağ kurallarını ve satış komisyon oranlarını kabul etmiş sayılırsınız.
             </p>
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
  const [isManualMode, setIsManualMode] = useState(false)
  const [manualLevel, setManualLevel] = useState<string | null>(null)
  const [manualPath, setManualPath] = useState<any[]>([])

  // Image states
  const [carImages, setCarImages] = useState<ImageState[]>([])
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
      is_opportunity: false,
      opportunity_reason: "Nakit İhtiyacı",
      opportunity_expires_at: "48", // Default 48 hours as string duration
    },
  })

  // Only watch city for district dropdown - isolated
  const selectedCity = useWatch({ control, name: "location_city" })
  const districts = useMemo(() => 
    selectedCity ? TURKEY_LOCATIONS[selectedCity] : [],
    [selectedCity]
  )

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      
      // First, add all files to state as 'optimizing'
      const newImages: ImageState[] = selectedFiles.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file), // Initial preview with original
        isOptimizing: true,
        isOptimized: false,
      }))
      
      const startIndex = carImages.length
      setCarImages(prev => [...prev, ...newImages])

      // Then, compress each file in background
      selectedFiles.forEach(async (file, index) => {
        const result = await compressImage(file)
        
        setCarImages(prev => {
          const updated = [...prev]
          const currentIndex = startIndex + index
          if (updated[currentIndex]) {
            // Revoke the initial temporary preview URL
            URL.revokeObjectURL(updated[currentIndex].previewUrl)
            
            updated[currentIndex] = {
              file: result.file,
              previewUrl: result.previewUrl,
              isOptimizing: false,
              isOptimized: result.isOptimized,
              error: result.error,
            }
          }
          return updated
        })
      })
    }
  }, [carImages.length])

  const removeFile = useCallback((index: number) => {
    setCarImages(prev => {
      const updated = [...prev]
      const itemToRemove = updated[index]
      if (itemToRemove) {
        URL.revokeObjectURL(itemToRemove.previewUrl)
      }
      return updated.filter((_, i) => i !== index)
    })
  }, [])

  const uploadToSupabase = async (file: File) => {
    const supabase = createClient()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name.replace(/\.[^/.]+$/, "")}.webp`
    const filePath = `cars/${fileName}`
    
    // Set content type strictly to webp if it's an optimized image
    const { error } = await supabase.storage.from('car_images').upload(filePath, file, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: false
    })
    
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('car_images').getPublicUrl(filePath)
    return publicUrl
  }

  const toSlug = (text: string) => {
    if (!text) return "";
    return text.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  const onSubmit = async (data: CarFormValues) => {
    setLoading(true)
    setError(null)
    
    // Otomobil Blacklist Kontrolü (Sadece manuel modda veya marka/model isimlerinde)
    const blacklist = ["doblo", "courier", "caddy", "fiorino", "partner", "berlingo", "combo", "bipper", "nemo", "transit", "ducato", "boxer", "jumper", "vivaro", "master", "trafic", "vito", "transporter", "caravelle"];
    const checkText = `${data.brand} ${data.model} ${data.manual_data?.marka || ''} ${data.manual_data?.model || ''}`.toLowerCase();
    
    if (blacklist.some(item => checkText.includes(item))) {
      setError("Üzgünüz, şu anda sadece otomobil kategorisinde ilan kabul edilmektedir. Ticari araçlar sistem dışıdır.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı")

      let finalPackageId = data.package_id;

      // Manuel Taksonomi Oluşturma
      if (isManualMode && data.manual_data) {
        console.log("Manuel taksonomi oluşturuluyor...");
        let currentParentId = manualPath[manualPath.length - 1]?.id || null;
        
        // Kategori -> Marka -> Model -> Seri -> Motor -> Şanzıman -> Kasa -> Paket
        const levelsToFill = ['kategori', 'marka', 'model', 'seri', 'motor', 'sanziman', 'kasa', 'paket'];
        const startIndex = levelsToFill.indexOf(manualLevel || 'kategori');
        
        for (let i = startIndex; i < levelsToFill.length; i++) {
          const levelName = levelsToFill[i];
          let entryName = "";
          
          if (levelName === 'kategori') entryName = data.manual_data.kategori_name || "Otomobil";
          else if (levelName === 'marka') entryName = data.manual_data.marka || data.brand || "";
          else if (levelName === 'model') entryName = data.manual_data.model || data.model || "";
          else if (levelName === 'seri') entryName = data.manual_data.seri || "";
          else if (levelName === 'motor') entryName = data.manual_data.motor || "";
          else if (levelName === 'sanziman') entryName = data.manual_data.sanziman || "";
          else if (levelName === 'kasa') entryName = data.manual_data.kasa || "";
          else if (levelName === 'paket') entryName = data.manual_data.paket || "";

          if (!entryName) continue;

          const { data: newNode, error: upsertError } = await supabase
            .from('car_taxonomy')
            .upsert({
              name: entryName,
              level: levelName,
              parent_id: currentParentId,
              slug: toSlug(`${entryName}-${levelName}-${currentParentId ? currentParentId.substring(0,4) : 'root'}`),
              status: 'pending' // Onay bekliyor
            }, { onConflict: 'parent_id, name' })
            .select()
            .single();

          if (upsertError) throw upsertError;
          currentParentId = newNode.id;
          if (levelName === 'paket') finalPackageId = newNode.id;
        }
      }

      if (!finalPackageId) throw new Error("Araç detayları (paket) belirlenemedi.");

      let imageUrls: string[] = []
      if (carImages.length > 0) {
        const readyFiles = carImages.map(img => img.file)
        imageUrls = await Promise.all(readyFiles.map(f => uploadToSupabase(f)))
      }

      const { error: dbError } = await supabase.from('cars').insert({
        seller_id: user.id,
        title: data.title || `${data.brand} ${data.model}`,
        brand: data.manual_data?.marka || data.brand,
        model: data.manual_data?.model || data.model,
        year: parseInt(data.year),
        km: parseInt(data.km),
        damage_report: data.damage_report,
        expertise: data.expertise,
        price_b2b: parseFloat(data.price_b2b),
        location_city: data.location_city,
        location_district: data.location_district,
        images: imageUrls,
        is_active: true,
        package_id: finalPackageId,
        is_opportunity: data.is_opportunity,
        opportunity_reason: data.is_opportunity ? data.opportunity_reason : null,
        opportunity_expires_at: data.is_opportunity && data.opportunity_expires_at 
          ? new Date(Date.now() + parseInt(data.opportunity_expires_at) * 60 * 60 * 1000).toISOString()
          : null,
        is_trade_closed: data.is_opportunity ? true : false
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
                  {carImages.map((img, i) => (
                    <div key={i} className="relative aspect-[4/3] rounded-2xl overflow-hidden border group/img shadow-sm bg-muted/20">
                      <img src={img.previewUrl} alt="Preview" className={cn(
                        "object-cover w-full h-full transition-all duration-500",
                        img.isOptimizing ? "opacity-40 blur-[2px]" : "group-hover/img:scale-110"
                      )} />
                      
                      {/* Optimization Status Overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        {img.isOptimizing ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-background/80 px-2 py-0.5 rounded-full">Optimize Ediliyor</span>
                          </div>
                        ) : img.isOptimized ? (
                          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-md px-2 py-0.5 rounded-full shadow-lg">
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                            <span className="text-[7px] font-black text-white uppercase tracking-tighter">HD Optimize</span>
                          </div>
                        ) : null}
                      </div>

                      <button type="button" onClick={() => removeFile(i)} className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground rounded-full p-1.5 hover:bg-destructive opacity-0 group-hover/img:opacity-100 transition-all z-20">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase z-10">Kapak {i + 1}</div>
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

            <div className="space-y-6">
               <div className="bento-card p-8 rounded-[2.5rem]">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-4 block">Araç Kategorisi & Marka • <span className="text-muted-foreground uppercase">Hiyerarşik Seçim</span></Label>
                  <Controller
                    name="package_id"
                    control={control}
                    render={({ field }) => (
                      isManualMode ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                          <div className="flex items-center justify-between bg-primary/5 p-4 rounded-2xl border border-primary/10">
                            <div className="flex items-center gap-3">
                              <Info className="w-4 h-4 text-primary" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Manuel Detay Girişi</span>
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setIsManualMode(false); setManualLevel(null); setManualPath([]) }}
                              className="h-8 text-[9px] font-black uppercase tracking-tighter hover:bg-primary/10"
                            >
                              Hiyerarşik Seçime Dön
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                             {(!manualLevel || manualLevel === 'kategori' || manualLevel === 'marka') && (
                               <div className="space-y-2">
                                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Marka</Label>
                                 <Input {...register("manual_data.marka")} placeholder="Örn: Audi" className="h-12 bg-muted/30 border-primary/5 rounded-xl font-bold focus:border-primary/30" />
                               </div>
                             )}
                             {(manualLevel === 'kategori' || manualLevel === 'marka' || manualLevel === 'model') && (
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Model</Label>
                                  <Input {...register("manual_data.model")} placeholder="Örn: A3" className="h-12 bg-muted/30 border-primary/5 rounded-xl font-bold focus:border-primary/30" />
                                </div>
                             )}
                             <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Seri / Jenerasyon</Label>
                               <Input {...register("manual_data.seri")} placeholder="Örn: Sedan" className="h-12 bg-muted/30 border-primary/5 rounded-xl font-bold focus:border-primary/30" />
                             </div>
                             <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Motor</Label>
                               <Input {...register("manual_data.motor")} placeholder="Örn: 35 TFSI" className="h-12 bg-muted/30 border-primary/5 rounded-xl font-bold focus:border-primary/30" />
                             </div>
                             <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Şanzıman</Label>
                               <Controller
                                 name="manual_data.sanziman"
                                 control={control}
                                 render={({ field: sField }) => (
                                   <Select value={sField.value} onValueChange={sField.onChange}>
                                     <SelectTrigger className="h-12 bg-muted/30 border-primary/5 rounded-xl font-bold">
                                       <SelectValue placeholder="Seçin" />
                                     </SelectTrigger>
                                     <SelectContent className="rounded-xl border-primary/10">
                                        <SelectItem value="Otomatik" className="font-bold">Otomatik</SelectItem>
                                        <SelectItem value="Manuel" className="font-bold">Manuel</SelectItem>
                                        <SelectItem value="Yarı Otomatik" className="font-bold">Yarı Otomatik</SelectItem>
                                     </SelectContent>
                                   </Select>
                                 )}
                               />
                             </div>
                             <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kasa Tipi</Label>
                               <Controller
                                 name="manual_data.kasa"
                                 control={control}
                                 render={({ field: kField }) => (
                                   <Select value={kField.value} onValueChange={kField.onChange}>
                                     <SelectTrigger className="h-12 bg-muted/30 border-primary/5 rounded-xl font-bold">
                                       <SelectValue placeholder="Seçin" />
                                     </SelectTrigger>
                                     <SelectContent className="rounded-xl border-primary/10">
                                        <SelectItem value="Sedan" className="font-bold">Sedan</SelectItem>
                                        <SelectItem value="Hatchback" className="font-bold">Hatchback</SelectItem>
                                        <SelectItem value="SUV" className="font-bold">SUV</SelectItem>
                                        <SelectItem value="Coupe" className="font-bold">Coupe</SelectItem>
                                        <SelectItem value="Cabrio" className="font-bold">Cabrio</SelectItem>
                                        <SelectItem value="Station Wagon" className="font-bold">Station Wagon</SelectItem>
                                     </SelectContent>
                                   </Select>
                                 )}
                               />
                             </div>
                             <div className="md:col-span-2 space-y-2">
                               <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Paket İsmi / Donanım</Label>
                               <Input {...register("manual_data.paket")} placeholder="Örn: Design" className="h-12 bg-muted/30 border-primary/5 rounded-xl font-bold focus:border-primary/30" />
                             </div>
                          </div>
                        </div>
                      ) : (
                        <TaxonomyColumnSelector 
                          onManualMode={(level, path) => {
                            setIsManualMode(true)
                            setManualLevel(level)
                            setManualPath(path)
                            const brand = path.find(p => p.level === 'marka')?.name
                            const model = path.find(p => p.level === 'model')?.name
                            if (brand) setValue('brand', brand)
                            if (model) setValue('model', model)
                          }}
                          onSelect={(item, path) => {
                            field.onChange(item.id)
                            const brandItem = path.find(p => p.level === 'marka')
                            const modelItem = path.find(p => p.level === 'model')
                            
                            if (brandItem) setValue('brand', brandItem.name)
                            if (modelItem) setValue('model', modelItem.name)
                            
                            const currentTitle = control._formValues.title
                            if (!currentTitle || currentTitle === "") {
                              const technicalPath = path.slice(3).map(p => p.name).join(' ')
                              if (technicalPath) {
                                setValue('title', `${brandItem?.name} ${modelItem?.name} ${technicalPath}`)
                              }
                            }
                          }} 
                        />
                      )
                    )}
                  />
                  {errors.package_id && <p className="text-[10px] text-destructive font-bold uppercase mt-2">{errors.package_id.message}</p>}
               </div>

               <div className="bento-card p-6 rounded-3xl">
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

            {/* Opportunity Pool Toggle Section */}
            <div className="bento-card p-6 rounded-[2.5rem] border-emerald-500/20 bg-emerald-500/5 space-y-6 relative overflow-hidden group/opt">
               <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover/opt:scale-110 transition-transform">
                        <Flame className="w-6 h-6" strokeWidth={2.5} />
                     </div>
                     <div>
                        <h3 className="text-base font-black uppercase tracking-tight text-foreground dark:text-white">Fırsat Havuzuna Ekle</h3>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-relaxed">İlanınız vitrinin en üstünde ve özel premium kategorisinde görünür.</p>
                     </div>
                  </div>
                  <Controller
                    name="is_opportunity"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={cn(
                          "relative inline-flex h-9 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-emerald-500/10",
                          field.value ? "bg-emerald-500" : "bg-muted shadow-inner"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-8 w-8 transform rounded-full bg-white shadow-xl ring-0 transition-transform duration-300 ease-in-out",
                            field.value ? "translate-x-7" : "translate-x-0"
                          )}
                        />
                      </button>
                    )}
                  />
               </div>

               <Controller
                 name="is_opportunity"
                 control={control}
                 render={({ field: { value: isOpt } }) => isOpt ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-4 duration-500 relative z-10">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 ml-1">Fırsat Nedeni</Label>
                         <Controller
                           name="opportunity_reason"
                           control={control}
                           render={({ field }) => (
                             <Select value={field.value} onValueChange={field.onChange}>
                               <SelectTrigger className="h-12 bg-primary/5 dark:bg-white/5 border-emerald-500/20 font-black uppercase text-[11px] text-foreground dark:text-white hover:bg-primary/10 dark:hover:bg-white/10 transition-colors rounded-xl">
                                 <SelectValue placeholder="Neden belirtin" />
                               </SelectTrigger>
                               <SelectContent className="bg-card dark:bg-slate-900 border-emerald-500/20 text-foreground dark:text-white">
                                 <SelectItem value="Nakit İhtiyacı" className="focus:bg-emerald-500/20 focus:text-foreground dark:focus:text-white font-bold">Nakit İhtiyacı</SelectItem>
                                 <SelectItem value="Stok Yenileme" className="focus:bg-emerald-500/20 focus:text-foreground dark:focus:text-white font-bold">Stok Yenileme</SelectItem>
                                 <SelectItem value="Dükkan Değişikliği" className="focus:bg-emerald-500/20 focus:text-foreground dark:focus:text-white font-bold">Dükkan Değişikliği</SelectItem>
                                 <SelectItem value="Diğer" className="focus:bg-emerald-500/20 focus:text-foreground dark:focus:text-white font-bold">Diğer</SelectItem>
                               </SelectContent>
                             </Select>
                           )}
                         />
                      </div>
                      <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 ml-1">Fırsat Süresi</Label>
                          <Controller
                            name="opportunity_expires_at"
                            control={control}
                            render={({ field }) => (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="h-12 bg-primary/5 dark:bg-white/5 border-emerald-500/20 font-technical font-black text-foreground dark:text-white rounded-xl focus:ring-0">
                                  <SelectValue placeholder="Süre seçin" />
                                </SelectTrigger>
                                <SelectContent className="bg-card dark:bg-slate-900 border-emerald-500/20 text-foreground dark:text-white">
                                  <SelectItem value="24" className="focus:bg-emerald-500/20 font-bold">24 Saat</SelectItem>
                                  <SelectItem value="48" className="focus:bg-emerald-500/20 font-bold">48 Saat</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                       </div>
                      <div className="md:col-span-2 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/10 flex items-start gap-3">
                         <Info className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" strokeWidth={3} />
                         <p className="text-[10px] font-bold text-foreground/70 dark:text-white/70 uppercase leading-relaxed tracking-wider">
                            Fırsat ilanlarında <span className="text-emerald-500">takas otomatik olarak kapatılır</span>. Belirlediğiniz süre dolduğunda ilan otomatik olarak normal ilana dönüşür.
                         </p>
                      </div>
                   </div>
                 ) : <></>}
               />
            </div>

            <div className="bento-card p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-950 text-foreground dark:text-white border-none shadow-2xl relative overflow-hidden group transition-all duration-500">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                     <div>
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/40 mb-3 block">Ağ İçi Galerici Fiyatı</Label>
                        <div className="flex items-baseline gap-3 overflow-hidden">
                           <span className="text-2xl md:text-4xl font-light text-foreground/30 dark:text-white/30 shrink-0">₺</span>
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
                                    className="font-technical text-3xl md:text-5xl font-black bg-transparent border-none p-0 outline-none text-foreground dark:text-white placeholder:text-foreground/5 dark:placeholder:text-white/5 w-full min-w-0"
                                  />
                                )
                              }}
                           />
                        </div>
                        <p className="mt-4 text-[10px] font-bold text-muted-foreground dark:text-white/40 uppercase tracking-widest flex items-center gap-2">
                           <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                           Bu fiyat "Müşteri Modu" aktifken gizlenir.
                        </p>
                     </div>

                     <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-white/40 block">Ek Notlar & Tramer Bilgisi</Label>
                        <Textarea 
                           {...register("damage_report")}
                           className="min-h-[160px] bg-primary/5 dark:bg-white/5 border-primary/10 dark:border-white/10 rounded-2xl resize-none text-foreground/80 dark:text-white/80 text-sm p-4 focus:border-primary/30 dark:focus:border-white/30"
                           placeholder="Lokal boya, değişen detayları, tramer tutarı veya özel notlarınız..."
                        />
                     </div>
                  </div>

                  <div className="space-y-6 flex flex-col justify-center">
                     <div className="bg-primary/5 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-primary/10 dark:border-white/10 shadow-inner">
                        <div className="mb-6 flex items-center justify-between">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-white/60">Görsel Hasar Kaydı</Label>
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
        <PreviewSidebar control={control} filesCount={carImages.length} error={error} loading={loading} />

      </form>
    </div>
  )
}
