import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MaskedCarView } from '@/components/cars/masked-car-view'

// ⚡ Perf: ISR — regenerate every 60s instead of cold start on every visit
export const revalidate = 60

export default async function MaskedListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('fn_get_masked_listing', { p_masked_slug: slug })
    .single()

  if (error || !data) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center max-w-7xl mx-auto px-4">
          <div className="font-bold text-xl tracking-tight text-primary">
            Galeri<span className="text-muted-foreground">Link</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <MaskedCarView car={data} />
      </main>
    </div>
  )
}
