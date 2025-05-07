import { Suspense } from 'react'
import { ProductSkeleton } from '@/components/shop/product-skeleton'
import ShopClient from './client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function ShopPage() {
  return (
    <Suspense fallback={<p>Loading shop...</p>}>
      <ShopClient />
    </Suspense>
  )
}
