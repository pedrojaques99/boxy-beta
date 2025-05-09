import { Suspense } from 'react'
import ShopClient from './client'

// Make this page dynamic
export const dynamic = 'force-dynamic'

export default function ShopPage() {
  return (
    <main>
      <Suspense fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      }>
        <ShopClient />
      </Suspense>
    </main>
  )
}
