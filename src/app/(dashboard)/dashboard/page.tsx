import { Suspense } from "react"
import { getAuthUser } from "@/lib/supabase/auth-cache"
import { OpportunityFilterBar } from "@/components/cars/opportunity-filter-bar"
import { OpportunityFeed, RegularFeed, ResultCount, FeedHeaderCount } from "./dashboard-feed"
import { CarCardSkeleton } from "@/components/cars/car-card-skeleton"

export const metadata = {
  title: "Ağdaki Araçlar - GaleriLink",
}

export const revalidate = 60;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { user } = await getAuthUser()
  
  if (!user) return null

  // Await the searchParams dynamically in Next 15 (if using newer Next) but Next.js 13/14 provides it directly. 
  // Let's resolve safely
  const resolvedParams = await searchParams || {}

  return (
    <div className="flex min-h-screen bg-background transition-all duration-500">
      <main className="flex-1 transition-all duration-700 ease-in-out px-4 sm:px-6 lg:px-8 py-8 md:px-12">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Dashboard Header & Advanced Filter Bar */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter uppercase italic">Vitrin İlanlar</h1>
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                  Sisteme kayıtlı <span className="text-primary">yüzlerce</span> aktif ticari ilan listeleniyor. 
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Suspense fallback={<div className="h-8 w-32 bg-primary/5 rounded-full animate-pulse" />}>
                   <FeedHeaderCount searchParams={resolvedParams} />
                </Suspense>
              </div>
            </div>

            <div className="relative z-20">
              <Suspense fallback={<div className="h-14 w-full bg-white/5 rounded-2xl animate-pulse" />}>
                <OpportunityFilterBar 
                  variant="primary"
                  resultCount={
                    <Suspense fallback={"..."}>
                      <ResultCount searchParams={resolvedParams} />
                    </Suspense>
                  }
                />
              </Suspense>
            </div>
          </div>

          <Suspense fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <CarCardSkeleton /><CarCardSkeleton /><CarCardSkeleton /><CarCardSkeleton />
            </div>
          }>
            <OpportunityFeed searchParams={resolvedParams} />
          </Suspense>

          <Suspense fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <CarCardSkeleton /><CarCardSkeleton /><CarCardSkeleton /><CarCardSkeleton />
              <CarCardSkeleton /><CarCardSkeleton /><CarCardSkeleton /><CarCardSkeleton />
            </div>
          }>
            <RegularFeed searchParams={resolvedParams} />
          </Suspense>

        </div>
      </main>
    </div>
  )
}
