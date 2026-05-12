import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MaskedCarView } from '@/components/cars/masked-car-view'
import type { Metadata } from 'next'

/** RPC: fn_get_masked_listing dönüş tipi */
interface MaskedListing {
  brand: string
  model: string
  series: string | null
  year: number
  km: number
  fuel: string | null
  transmission: string | null
  body_type: string | null
  engine: string | null
  heavy_damage: string | null
  damage_report: string | null
  images: string[]
  title: string | null
  expertise: Record<string, string>
}

// ⚡ Perf: ISR — regenerate every 60s instead of cold start on every visit
export const revalidate = 60

// Dynamic SEO metadata
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data } = await supabase
    .rpc('fn_get_masked_listing', { p_masked_slug: slug })
    .returns<MaskedListing[]>()
    .single()

  if (!data) {
    return {
      title: 'İlan Bulunamadı — GaleriLink',
    }
  }

  const title = data.title || `${data.brand} ${data.model} ${data.year}`
  const description = `${data.brand} ${data.model} ${data.year} • ${data.km?.toLocaleString('tr-TR')} KM`

  return {
    title: `${title} — GaleriLink`,
    description,
    openGraph: {
      title: `${title} — GaleriLink`,
      description,
      type: 'website',
      images: data.images?.[0] ? [{ url: data.images[0], width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — GaleriLink`,
      description,
      images: data.images?.[0] ? [data.images[0]] : [],
    },
    robots: {
      index: false, // B2B — gizli link, arama motorlarında çıkmamalı
      follow: false,
    },
  }
}

export default async function MaskedListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('fn_get_masked_listing', { p_masked_slug: slug })
    .returns<MaskedListing[]>()
    .single()

  if (error || !data) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header — Salt Logo, Navigasyon YOK */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center max-w-7xl mx-auto px-4">
          <div className="font-bold text-xl tracking-tight text-primary">
            Galeri<span className="text-muted-foreground">Link</span>
          </div>
        </div>
      </header>

      {/* İçerik */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <MaskedCarView car={data} />
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border/40 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
            Galerilink B2B Ticaret Ağı
          </p>
          <p className="text-[9px] text-muted-foreground/60">
            Bu sayfa yalnızca araç bilgi amaçlıdır.
          </p>
        </div>
      </footer>
    </div>
  )
}
