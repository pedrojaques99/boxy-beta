'use client'

import { Product } from '@/types/shop'
import { Dictionary } from '@/i18n/types'
import { ProductClient } from '@/components/shop/product-client'
import { ProductSocialClient } from '@/components/shop/ProductSocialClient'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ProductPageClientProps {
  product: Product
  t: Dictionary
}

export default function ProductPageClient({ product, t }: ProductPageClientProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  return (
    <>
      <ProductClient product={product} t={t} userId={userId} />
    </>
  )
} 