import { useState, useRef, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Upload, Check, AlertCircle, FileText, Camera, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { TURKEY_LOCATIONS } from "@/lib/constants/locations"

const CITIES = Object.keys(TURKEY_LOCATIONS).sort((a, b) => a.localeCompare(b, "tr"))

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function VerificationModal({ isOpen, onClose, onSuccess }: VerificationModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [yetkiBelgeNo, setYetkiBelgeNo] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mevcut durumu kontrol et
  useEffect(() => {
    if (isOpen) {
      fetchCurrentStatus()
    }
  }, [isOpen])

  const fetchCurrentStatus = async () => {
    setIsInitialLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('hesap_durumu')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setCurrentStatus(data.hesap_durumu)
        }
      }
    } catch (err) {
      console.error("Status fetch error:", err)
    } finally {
      setIsInitialLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Lütfen geçerli bir resim dosyası seçiniz.")
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError(null)
    }
  }

  const compressToWebP = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Max dimensions (e.g., 2000px)
          const MAX_SIZE = 2000
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width
              width = MAX_SIZE
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height
              height = MAX_SIZE
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error("Canvas to WebP failed"))
          }, 'image/webp', 0.8) // 80% quality
        }
        img.src = event.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async () => {
    if (!yetkiBelgeNo) {
      setError("Yetki Belge Numarası gereklidir.")
      return
    }
    if (!selectedCity || !selectedDistrict) {
      setError("İl ve İlçe seçimi gereklidir.")
      return
    }
    if (!selectedFile) {
      setError("Vergi Levhası fotoğrafı gereklidir.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.")

      // 1. WebP Sıkıştırma
      const webpBlob = await compressToWebP(selectedFile)
      const fileName = `${user.id}/${Date.now()}.webp`

      // 2. Storage'a Yükleme
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('verifications')
        .upload(fileName, webpBlob, {
          contentType: 'image/webp',
          upsert: true
        })

      if (uploadError) {
        console.error("Storage upload error:", uploadError)
        throw new Error(`Yükleme hatası: ${uploadError.message}`)
      }

      // 3. Public URL Al
      const { data: { publicUrl } } = supabase.storage
        .from('verifications')
        .getPublicUrl(fileName)

      // 4. Profil Güncelleme
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          yetki_belge_no: yetkiBelgeNo,
          vergi_levhasi_url: publicUrl,
          city: selectedCity,
          district: selectedDistrict,
          hesap_durumu: 'beklemede'
        })
        .eq('id', user.id)

      if (updateError) {
        console.error("Profile update error:", updateError)
        throw new Error(`Kayıt hatası: ${updateError.message} (Yetki sorunu olabilir)`)
      }

      if (onSuccess) onSuccess()
      onClose()
      alert("Belgeleriniz başarıyla yüklendi. Admin onayı bekliyor.")
      window.location.reload()
    } catch (err) {
      console.error("Verification error:", err)
      setError(err instanceof Error ? err.message : "Beklenmedik bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl overflow-hidden bg-slate-950 text-white">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">HESABI DOĞRULA</DialogTitle>
              <DialogDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
                Tüm özellikleri açmak için belgenizi yükleyin
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {isInitialLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Sistem Kontrol Ediliyor...</p>
            </div>
          ) : currentStatus === 'beklemede' ? (
            <div className="py-12 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                <FileText className="w-10 h-10 text-yellow-500 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase italic tracking-tight">ONAY BEKLENİYOR</h3>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest leading-relaxed px-4">
                  Belgeleriniz admin ekibimiz tarafından inceleniyor. <br />
                  Bu işlem genellikle 24 saat içinde tamamlanır.
                </p>
              </div>
            </div>
          ) : currentStatus === 'onaylandi' ? (
            <div className="py-12 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase italic tracking-tight">HESABINIZ ONAYLI</h3>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest leading-relaxed px-4">
                  Tebrikler! Mağazanız doğrulanmış durumda. <br />
                  Tüm özelliklere erişiminiz açık.
                </p>
              </div>
              <Button onClick={onClose} variant="outline" className="rounded-2xl px-8 border-white/10 hover:bg-white hover:text-black font-black uppercase text-[10px] tracking-widest h-12">
                PANEL'E DÖN
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-xs font-bold text-red-500 uppercase tracking-widest">{error}</p>
                </div>
              )}

              {currentStatus === 'reddedildi' && (
                <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <p className="text-[10px] font-bold text-red-100 uppercase tracking-widest leading-tight">
                    ÖNCEKİ BAŞVURUNUZ REDDEDİLDİ. <br />
                    LÜTFEN BİLGİLERİ KONTROL EDİP TEKRAR DENEYİN.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">YETKİ BELGE NUMARASI</Label>
                  <Input 
                    value={yetkiBelgeNo}
                    onChange={(e) => setYetkiBelgeNo(e.target.value)}
                    placeholder="Örn: 3412345"
                    className="h-16 bg-white/5 border-2 border-white/5 rounded-2xl font-black text-xl placeholder:text-white/10 focus:border-primary/50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">ŞEHİR (İL)</Label>
                    <select
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value)
                        setSelectedDistrict("")
                      }}
                      className="w-full h-16 bg-white/5 border-2 border-white/5 rounded-2xl font-black text-lg px-6 outline-none hover:border-white/10 focus:border-primary/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-950">İl Seçiniz</option>
                      {CITIES.map(city => (
                        <option key={city} value={city} className="bg-slate-950">{city}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">BÖLGE (İLÇE)</Label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={!selectedCity}
                      className="w-full h-16 bg-white/5 border-2 border-white/5 rounded-2xl font-black text-lg px-6 outline-none hover:border-white/10 focus:border-primary/50 transition-all appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <option value="" className="bg-slate-950">İlçe Seçiniz</option>
                      {selectedCity && TURKEY_LOCATIONS[selectedCity].map(dist => (
                        <option key={dist} value={dist} className="bg-slate-950">{dist}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">VERGİ LEVHASI FOTOĞRAFI (WEBP)</Label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "relative aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all overflow-hidden group",
                      previewUrl ? "border-primary/50 bg-primary/5" : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    {previewUrl ? (
                      <>
                        <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform" />
                        <div className="relative z-10 flex flex-col items-center gap-2">
                          <Check className="w-12 h-12 text-primary" />
                          <span className="bg-black/40 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">Değiştir</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-white/20 group-hover:text-primary transition-colors" />
                        <div className="text-center">
                          <p className="text-sm font-black uppercase tracking-widest">Belge Seçiniz</p>
                          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">JPEG, PNG veya WEBP</p>
                        </div>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {(!currentStatus || currentStatus === 'reddedildi') && !isInitialLoading && (
          <DialogFooter className="p-6 pt-0">
            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-20 rounded-3xl text-xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-4 shadow-2xl shadow-primary/40 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                <>
                  <FileText className="w-6 h-6" />
                  DOĞRULAMAYI BAŞLAT
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
