"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Gauge, ChevronLeft, ChevronRight, Fuel, Settings, 
  Car, Zap, AlertTriangle, ShieldCheck 
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ExpertiseSelector } from "./expertise-selector"

/* ---------- Teknik Spec Kartı ---------- */
function SpecCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) {
  if (!value || value === '—') return null
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 ring-1 ring-border/30 hover:ring-border/60 transition-all duration-300 group">
      <div className="w-10 h-10 rounded-xl bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center text-primary/60 group-hover:text-primary transition-colors shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-0.5">{label}</p>
        <p className="text-sm font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}

/* ---------- Fotoğraf Galerisi ---------- */
function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [currentImage, setCurrentImage] = useState(0)
  const hasImages = images && images.length > 0

  const nextImage = () => {
    if (hasImages) setCurrentImage((prev) => (prev + 1) % images.length)
  }
  const prevImage = () => {
    if (hasImages) setCurrentImage((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="space-y-3">
      {/* Ana Görsel */}
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-muted group select-none">
        {hasImages ? (
          <>
            <Image 
              src={images[currentImage]} 
              alt={title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              priority
            />
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10"
                  aria-label="Önceki fotoğraf"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={nextImage} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10"
                  aria-label="Sonraki fotoğraf"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                {/* Sayaç */}
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md rounded-xl px-3 py-1.5 z-10">
                  <span className="font-mono text-xs font-bold text-white">{currentImage + 1} / {images.length}</span>
                </div>
                {/* Dot Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 flex gap-1.5 z-10">
                  {images.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setCurrentImage(idx); }}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        currentImage === idx ? "w-4 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
                      )}
                      aria-label={`Fotoğraf ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 bg-muted/20 gap-2">
            <Car className="w-8 h-8 opacity-40" />
            <span className="text-sm font-medium">Görsel Yüklenmemiş</span>
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {hasImages && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img: string, idx: number) => (
            <button
              key={idx}
              onClick={() => setCurrentImage(idx)}
              className={cn(
                "relative w-16 h-12 rounded-lg overflow-hidden shrink-0 transition-all duration-200 ring-2",
                currentImage === idx 
                  ? "ring-primary scale-105" 
                  : "ring-transparent opacity-60 hover:opacity-90"
              )}
            >
              <Image src={img} alt={`Fotoğraf ${idx + 1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ========== ANA BİLEŞEN ========== */
export function MaskedCarView({ car }: { car: any }) {
  const expertise = car.expertise || {}
  const expertiseCount = Object.keys(expertise).length
  const displayTitle = car.title || `${car.brand} ${car.model} ${car.year}`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      
      {/* ── SOL: Görseller ── */}
      <div className="space-y-6">
        <ImageGallery images={car.images || []} title={displayTitle} />

        {/* KM Kartı */}
        <Card className="p-4 flex items-center gap-3 bg-muted/30 border-none ring-1 ring-border/50">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.15em] mb-0.5">Kilometre</p>
            <p className="font-bold text-lg leading-none">
              {car.km?.toLocaleString('tr-TR')} <span className="text-sm font-normal text-muted-foreground">km</span>
            </p>
          </div>
        </Card>
      </div>

      {/* ── SAĞ: Detaylar ── */}
      <div className="space-y-8">
        
        {/* Başlık Alanı */}
        <div>
          <div className="flex items-center gap-2 text-muted-foreground font-black uppercase tracking-[0.15em] text-[11px] mb-2">
            <span>{car.brand}</span>
            {car.series && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{car.series}</span>
              </>
            )}
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>{car.model}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
            {displayTitle}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-base px-4 py-1.5 border-primary/20 bg-primary/5 text-primary font-bold">
              {car.year} Model
            </Badge>
            {car.heavy_damage && car.heavy_damage !== 'Hayır' && (
              <Badge variant="destructive" className="text-xs px-3 py-1 font-bold">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Ağır Hasarlı
              </Badge>
            )}
            {car.heavy_damage === 'Hayır' && (
              <Badge variant="outline" className="text-xs px-3 py-1 border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Ağır Hasar Kaydı Yok
              </Badge>
            )}
          </div>
        </div>

        {/* Teknik Özellikler Grid */}
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Teknik Özellikler
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <SpecCard icon={Fuel} label="Yakıt" value={car.fuel} />
            <SpecCard icon={Settings} label="Vites" value={car.transmission} />
            <SpecCard icon={Car} label="Kasa Tipi" value={car.body_type} />
            <SpecCard icon={Zap} label="Motor" value={car.engine} />
          </div>
        </div>

        {/* Hasar Raporu */}
        {car.damage_report && (
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Hasar / Tramer Notu
            </h3>
            <Card className="p-5 bg-card/50 ring-1 ring-border/30">
              <p className="text-muted-foreground leading-relaxed text-sm">
                {car.damage_report}
              </p>
            </Card>
          </div>
        )}

        {/* Ekspertiz Şeması */}
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Ekspertiz Raporu
          </h3>
          <Card className="p-5 border-border/50 overflow-hidden flex justify-center ring-1 ring-border/30">
            <div className="w-full max-w-sm">
              <ExpertiseSelector value={expertise} readOnly />
            </div>
          </Card>
          {expertiseCount > 0 && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span><strong>{expertiseCount}</strong> parça üzerinde işlem tespit edildi.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
