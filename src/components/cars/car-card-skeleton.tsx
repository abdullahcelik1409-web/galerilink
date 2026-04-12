export function CarCardSkeleton() {
  return (
    <div className="bento-card overflow-hidden h-full flex flex-col border-none ring-1 ring-border/50 animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[4/3] w-full bg-muted shrink-0" />
      
      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2 bg-muted rounded w-12" />
            <div className="w-1 h-1 rounded-full bg-muted" />
            <div className="h-2 bg-muted rounded w-16" />
          </div>
          <div className="h-5 bg-muted rounded w-3/4" />
          <div className="h-5 bg-muted rounded w-1/2" />
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-muted" />
            <div className="h-3 bg-muted rounded w-16" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-muted" />
            <div className="h-3 bg-muted rounded w-12" />
          </div>
        </div>
      </div>

      {/* Price area */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-2 bg-muted rounded w-16" />
            <div className="h-5 bg-muted rounded w-24" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  )
}

export function CarGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <CarCardSkeleton key={i} />
      ))}
    </div>
  )
}
