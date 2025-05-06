import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getDictionary } from '@/i18n'
import { i18n } from '@/i18n/settings'
import { ProductClient } from '@/components/shop/product-client'
import { LikeButton } from '@/components/LikeButton'
import { CommentsSection } from '@/components/CommentsSection'
import { Suspense } from 'react'
import { ProductSocialClient } from '@/components/shop/ProductSocialClient'
import { Database } from '@/types/supabase'

async function getProduct(id: string) {
  const supabase = await createClient()
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !product) {
    return null
  }

  return product
}

export default async function ProductPage({
  params,
}: {
  params: { id: string }
}) {
  const headersList = headers()
  const locale = (headersList.get('x-locale') || i18n.defaultLocale) as typeof i18n.locales[number]
  const t = await getDictionary(locale)
  const product = await getProduct(params.id)

  if (!product) {
    notFound()
  }

  return (
    <>
      <ProductClient product={product} t={t} />
      <Suspense fallback={null}>
        <ProductSocialClient productId={product.id} />
      </Suspense>
    </>
  )
} 