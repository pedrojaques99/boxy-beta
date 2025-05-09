import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getDictionary } from '@/i18n'
import { i18n } from '@/i18n/settings'
import { Suspense } from 'react'
import ProductPageClient from './client'

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
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    }>
      <ProductPageClient product={product} t={t} />
    </Suspense>
  )
} 