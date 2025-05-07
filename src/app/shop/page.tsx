import { Suspense } from 'react'
import { ProductSkeleton } from '@/components/shop/product-skeleton'
import ShopClient from './client'

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      </div>
    }>
      <ShopClient />
    </Suspense>
  )
}
