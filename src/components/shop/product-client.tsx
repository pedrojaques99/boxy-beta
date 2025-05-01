'use client';

import { Button } from '@/components/ui/button'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/lib/theme-context'
import { Product } from '@/types'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSubscription } from '@/hooks/use-subscription'
import { Dictionary } from '@/i18n/types'

interface ProductClientProps {
  product: Product
  t: Dictionary
}

export function ProductClient({ product, t }: ProductClientProps) {
  const { theme } = useTheme()
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const supabase = createClient()
  const { subscriptionType } = useSubscription()

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      let query = supabase
        .from('products')
        .select('*')
        .neq('id', product.id)
        .limit(6)

      if (product.category) {
        query = query.eq('category', product.category)
      }

      const { data, error } = await query

      if (!error && data) {
        setRelatedProducts(data)
      }
    }

    fetchRelatedProducts()
  }, [product.id, product.category])

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/shop">
          <Button variant="outline" className="gap-2 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Button>
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Product Image */}
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {product.thumb ? (
            <img
              src={product.thumb}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-muted-foreground">No image available</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{product.name}</h1>
          {product.type && (
            <span className="inline-block rounded-full bg-primary/10 dark:bg-primary/20 text-primary px-3 py-1 text-sm font-medium">
              {product.type}
            </span>
          )}

          {product.description && (
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p>{product.description}</p>
            </div>
          )}

          <div className="space-y-4">
            {product.category && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">Category:</span>
                <span className="rounded-full bg-secondary/10 dark:bg-secondary/20 text-secondary-foreground px-3 py-1 text-sm">
                  {product.category}
                </span>
              </div>
            )}
            {product.software && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">Software:</span>
                <span className="rounded-full bg-secondary/10 dark:bg-secondary/20 text-secondary-foreground px-3 py-1 text-sm">
                  {product.software}
                </span>
              </div>
            )}
          </div>

          {product.tags && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted text-muted-foreground px-3 py-1 text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {product.file_url && subscriptionType === 'premium' && (
            <div className="pt-6">
              <Button
                asChild
                className="w-full gap-2 transition-transform hover:scale-[1.02] bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                <a href={product.file_url} download>
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
          )}

          {product.file_url && subscriptionType === 'free' && (
            <div className="pt-6">
              <Button
                asChild
                className="w-full gap-2 transition-transform hover:scale-[1.02] bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                <Link href="/price">
                  <Download className="h-4 w-4" />
                  Upgrade to Download
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                href={`/shop/${relatedProduct.id}`}
                className="block break-inside-avoid"
              >
                <Card className="overflow-hidden group h-full">
                  {relatedProduct.thumb && (
                    <div className="relative w-full overflow-hidden bg-muted">
                      <img
                        src={relatedProduct.thumb}
                        alt={relatedProduct.name}
                        className="w-full h-auto object-cover transition-transform duration-500 hover:scale-[1.02]"
                      />
                      {relatedProduct.type && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="absolute top-2 right-2 px-2 py-1 rounded-md text-sm transition-all bg-background border border-primary text-primary hover:bg-primary/10"
                        >
                          {relatedProduct.type}
                        </motion.button>
                      )}
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {relatedProduct.name}
                      </h2>
                    </div>
                    {relatedProduct.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {relatedProduct.description}
                      </p>
                    )}
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      {t.shop.viewDetails}
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 