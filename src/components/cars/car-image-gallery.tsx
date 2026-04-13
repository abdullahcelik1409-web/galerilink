"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CarImageGalleryProps {
  images: string[]
}

export function CarImageGallery({ images }: CarImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  if (!images || images.length === 0) {
    return (
      <div className="aspect-[16/10] bg-muted rounded-xl flex items-center justify-center text-muted-foreground font-medium border-2 border-dashed">
        Fotoğraf bulunmuyor
      </div>
    )
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="space-y-4">
      {/* Main Large Image Container */}
      <div className="relative aspect-[16/10] bg-muted rounded-xl overflow-hidden group border shadow-sm">
        <Image 
          src={images[currentIndex]} 
          alt={`Car image ${currentIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
          className="object-cover transition-opacity duration-300"
          priority={currentIndex === 0}
        />
        
        {/* Navigation Arrows - Only visible if more than 1 image */}
        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 hover:bg-background border shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
              aria-label="Önceki fotoğraf"
            >
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 hover:bg-background border shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
              aria-label="Sonraki fotoğraf"
            >
              <ChevronRight className="w-6 h-6 text-foreground" />
            </button>
          </>
        )}

        {/* Image Counter Badge */}
        <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur-md border border-white/10">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails Grid */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {images.map((url, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "relative flex-shrink-0 w-24 aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all",
                currentIndex === index 
                  ? "border-primary ring-2 ring-primary/20 scale-102" 
                  : "border-transparent hover:border-primary/40"
              )}
            >
              <Image src={url} alt={`Thumbnail ${index + 1}`} fill sizes="96px" className="object-cover" loading="lazy" />
              {currentIndex !== index && <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
