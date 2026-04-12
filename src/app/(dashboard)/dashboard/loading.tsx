import { CarGridSkeleton } from "@/components/cars/car-card-skeleton"

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-background transition-all duration-500">
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 md:px-12">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Header skeleton */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
              <div className="space-y-3">
                <div className="h-10 bg-muted rounded-lg w-64 animate-pulse" />
                <div className="h-3 bg-muted rounded w-48 animate-pulse" />
              </div>
            </div>
            {/* Filter bar skeleton */}
            <div className="h-14 bg-muted/50 rounded-2xl animate-pulse" />
          </div>

          {/* Cars grid skeleton */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-2 h-8 bg-muted rounded-full animate-pulse" />
              <div className="h-6 bg-muted rounded w-40 animate-pulse" />
            </div>
            <CarGridSkeleton count={8} />
          </div>
        </div>
      </main>
    </div>
  )
}
