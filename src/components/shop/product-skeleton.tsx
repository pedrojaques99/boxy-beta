'use client'

export function ProductSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="group block overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm"
        >
          <div className="aspect-square w-full overflow-hidden bg-muted animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 