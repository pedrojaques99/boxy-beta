'use client';

import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/lib/theme-context'
import { Product } from '@/types'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { getAuthService } from '@/lib/auth/auth-service'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSubscription } from '@/hooks/use-subscription'
import { Dictionary } from '@/i18n/types'
import { cn } from '@/lib/utils'
import { Database } from '@/types/supabase'

interface ProductClientProps {
  product: Product
  t: Dictionary
}

export function ProductClient({ product, t }: ProductClientProps) {
  const { theme } = useTheme()
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const authService = getAuthService()
  const supabaseClient = createClient()
  const { subscriptionType } = useSubscription()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Create an array of product images (assuming product might have images array or just thumb)
  const productImages = product.images || (product.thumb ? [product.thumb] : [])

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      let query = supabaseClient
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
    <>
      <div className="container mx-auto py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-1 text-sm">
            <li>
              <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                {t.navigation?.getStarted || 'Home'}
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </li>
            <li>
              <Link href="/shop" className="text-muted-foreground hover:text-primary transition-colors">
                {t.shop?.title || 'Shop'}
              </Link>
            </li>
            {product.category && (
              <>
                <li className="flex items-center">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </li>
                <li>
                  <Link 
                    href={`/shop?category=${encodeURIComponent(product.category)}`} 
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {product.category}
                  </Link>
                </li>
              </>
            )}
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </li>
            <li className="font-medium text-foreground">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="mb-6">
          <Link href="/shop">
            <Button variant="outline" className="gap-2 hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
              Back to Shop
            </Button>
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Product Image Gallery */}
          <div className="space-y-3">
            <div 
              className="overflow-hidden rounded-lg border border-border bg-card shadow-sm aspect-square relative cursor-pointer"
              onClick={() => productImages.length > 0 && setSelectedImage(productImages[activeImageIndex])}
            >
              {productImages.length > 0 ? (
                <motion.img
                  key={activeImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={productImages[activeImageIndex]}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.05]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                {productImages.map((img: string, index: number) => (
                  <div 
                    key={index}
                    className={cn(
                      "flex-shrink-0 h-20 w-20 rounded-md overflow-hidden border-2 cursor-pointer snap-start",
                      activeImageIndex === index ? "border-primary" : "border-border"
                    )}
                    onClick={() => setActiveImageIndex(index)}
                  >
                    <img 
                      src={img} 
                      alt={`${product.name} ${index + 1}`} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            <h1 className="text-4xl font-bold tracking-tight text-foreground">{product.name}</h1>
            {product.type && (
              <span className="inline-block rounded-full bg-primary/10 dark:bg-primary/20 text-primary px-3 py-1 text-sm font-medium">
                {product.type}
              </span>
            )}

            {product.description && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="prose prose-sm max-w-none text-muted-foreground"
              >
                <p>{product.description}</p>
              </motion.div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
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
                  <motion.span
                    key={tag}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-full bg-muted text-muted-foreground px-3 py-1 text-sm"
                  >
                    #{tag}
                  </motion.span>
                ))}
              </div>
            )}

            {product.file_url && subscriptionType === 'premium' && (
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="pt-6"
              >
                <Button
                  asChild
                  className="w-full gap-2 transition-all hover:scale-[1.02] bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  <a href={product.file_url} download>
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
              </motion.div>
            )}

            {product.file_url && subscriptionType === 'free' && (
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="pt-6"
              >
                <Button
                  asChild
                  className="w-full gap-2 transition-all hover:scale-[1.02] bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  <Link href="/price">
                    <Download className="h-4 w-4" />
                    Upgrade to Download
                  </Link>
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct, index) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                >
                  <Link
                    href={`/shop/${relatedProduct.id}`}
                    className="block h-full"
                  >
                    <Card className="overflow-hidden group h-full hover:shadow-md transition-all duration-300">
                      {relatedProduct.thumb && (
                        <div className="relative w-full overflow-hidden bg-muted">
                          <div className="aspect-[4/3]">
                            <img
                              src={relatedProduct.thumb}
                              alt={relatedProduct.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                            />
                          </div>
                          {relatedProduct.type && (
                            <div className="absolute top-2 right-2">
                              <motion.span
                                whileHover={{ scale: 1.05 }}
                                className="px-2 py-1 rounded-md text-sm bg-background/80 backdrop-blur-sm border border-primary text-primary"
                              >
                                {relatedProduct.type}
                              </motion.span>
                            </div>
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
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Image modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] w-full rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-2 z-10 bg-background/50 hover:bg-background/70 backdrop-blur-sm" 
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <img 
                src={selectedImage} 
                alt={product.name} 
                className="w-full h-full object-contain"
              />
              
              {/* Navigation controls for modal */}
              {productImages.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {productImages.map((img: string, index: number) => (
                    <button
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        selectedImage === img ? "bg-primary" : "bg-muted"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(img);
                        setActiveImageIndex(index);
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 