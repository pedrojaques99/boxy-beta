import { Suspense } from 'react'
import ShopClient from './client'

// Make this page dynamic
export const dynamic = 'force-dynamic'

export default function ShopPage() {
  return (
    <main>
      <Suspense fallback={<div>Loading...</div>}>
        <ShopClient />
      </Suspense>
    </main>
  )
}
