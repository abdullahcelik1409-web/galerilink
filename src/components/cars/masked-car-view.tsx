"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gauge, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ExpertiseSelector } from "./expertise-selector"

export function MaskedCarView({ car }: { car: any }) {
  const [currentImage, setCurrentImage] = useState(0)

  const hasImages = car.images && car.images.length > 0
  const expertise = car.expertise || {}

  const nextImage = () => {
    if (hasImages) {
      setCurrentImage((prev) => (prev + 1) % car.images.length)
    }
  }

  const prevImage = () => {
    if (hasImages) {
      setCurrentImage((prev) => (prev - 1 + car.images.length) % car.images.length)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Visual Section */}
      <div className="space-y-4">
        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-muted group select-none">
          {hasImages ? (
            <>
              <Image 
                src={car.images[currentImage]} 
                alt={`${car.brand} ${car.model}`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-500"
                priority
              />
              {car.images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md rounded-full px-3 py-1 flex gap-1.5 z-10">
                    {car.images.map((_: any, idx: number) => (
                      <div key={idx} className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", currentImage === idx ? "w-4 bg-white" : "bg-white/40")} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 bg-muted/20">
              <span className="text-sm font-medium">Görsel Yüklenmemiş</span>
            </div>
          )}
        </div>

        {/* Info Blocks */}
        <div>
          <Card className="p-4 flex items-center gap-3 bg-muted/30 border-none ring-1 ring-border/50">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Kilometre</p>
              <p className="font-bold text-lg leading-none">{car.km?.toLocaleString('tr-TR')} <span className="text-sm font-normal text-muted-foreground">km</span></p>
            </div>
          </Card>
        </div>
      </div>

      {/* Details Section */}
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground font-medium uppercase tracking-wider text-sm mb-2">
            <span>{car.brand}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-border" />
            <span>{car.model}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
            {car.title || `${car.brand} ${car.model} ${car.year}`}
          </h1>
          <Badge variant="outline" className="text-base px-4 py-1.5 border-primary/20 bg-primary/5 text-primary">
            {car.year} Model
          </Badge>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Ekspertiz ve Hasar Durumu
          </h3>
          <Card className="p-5 bg-card/50">
            <p className="text-muted-foreground leading-relaxed">
              {car.damage_report || "Özel bir hasar veya tramer notu girilmemiş."}
            </p>
          </Card>

          <Card className="p-5 border-border/50 overflow-hidden flex justify-center">
            <div className="w-full max-w-sm">
               <ExpertiseSelector value={expertise} readOnly />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
