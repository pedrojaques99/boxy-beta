'use client';

import Link from 'next/link'
import { useTheme } from '@/lib/theme-context'
import { Product } from '@/types'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Dictionary } from '@/i18n/types'

/**
 * Props interface for the ShopClient component
 * @param products - Array of products to display
 * @param t - Translation dictionary
 */
interface ShopClientProps {
  products: Product[]
  t: Dictionary
}

/**
 * ShopClient Component
 * 
 * Displays a Pinterest-style grid of products with filtering capabilities.
 * Features:
 * - Responsive column layout
 * - Product filtering by type, category, and software
 * - Hover animations
 * - Interactive tags
 * - Image optimization
 */
export function ShopClient({ products, t }: ShopClientProps) {
  // Theme context for dark/light mode
  const { theme } = useTheme()
  
  // Router and search params for URL-based filtering
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Current filter values from URL
  const currentType = searchParams.get('type')
  const currentCategory = searchParams.get('category')
  const currentSoftware = searchParams.get('software')

  /**
   * Handles filter button clicks
   * Toggles filter values in the URL
   * @param key - Filter type ('type', 'category', or 'software')
   * @param value - Filter value to set
   */
  const handleFilterClick = (key: 'type' | 'category' | 'software', value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const currentValue = searchParams.get(key)
    
    // Toggle filter: remove if already active, add if not
    if (currentValue === value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/shop?${params.toString()}`)
  }

  /**
   * Checks if a filter is currently active
   * @param key - Filter type
   * @param value - Filter value to check
   * @returns boolean indicating if the filter is active
   */
  const isTagActive = (key: 'type' | 'category' | 'software', value: string) => {
    return searchParams.get(key) === value
  }

  return (
    <div className="container mx-auto py-8">
      {/* Page Title */}
      <h1 className="mb-8 text-3xl font-bold text-foreground">{t.shop.title}</h1>
      
      {/* Product Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/shop/${product.id}`}
            className="block break-inside-avoid"
          >
            {/* Product Card */}
            <Card className="overflow-hidden group h-full">
              {/* Product Image */}
              {product.thumb && (
                <div className="relative w-full overflow-hidden bg-muted">
                  <img
                    src={product.thumb}
                    alt={product.name}
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Type Badge */}
                  {product.type && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 1 }}
                      onClick={(e) => {
                        e.preventDefault()
                        handleFilterClick('type', product.type!)
                      }}
                      className={`absolute top-2 right-2 px-2 py-1 rounded-md text-sm transition-all ${
                        isTagActive('type', product.type)
                          ? 'bg-primary/20 text-primary-foreground shadow-md text-xs'
                          : 'bg-background/20 border border-primary/20 text-primary hover:bg-primary/10 text-xs'
                      }`}
                    >
                      {product.type}
                    </motion.button>
                  )}
                </div>
              )}
              
              {/* Product Content */}
              <CardContent className="p-4">
                {/* Product Name */}
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {product.name}
                  </h2>
                </div>
                {/* Product Description */}
                {product.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}
                {/* Category and Software Tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {/* Category Tag */}
                  {product.category && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 1 }}
                      onClick={(e) => {
                        e.preventDefault()
                        handleFilterClick('category', product.category!)
                      }}
                      className={`rounded-full px-2 py-1 text-xs transition-all border border-stone-800 hover:border-stone-600 ${
                        isTagActive('category', product.category)
                          ? 'bg-secondary text-secondary-foreground shadow-md text-xs'
                          : 'bg-secondary/10 dark:bg-secondary/20 text-secondary-foreground hover:bg-secondary/20 dark:hover:bg-secondary/30 text-xs'
                      }`}
                    >
                      {product.category}
                    </motion.button>
                  )}
                  {/* Software Tag */}
                  {product.software && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 1 }}
                      onClick={(e) => {
                        e.preventDefault()
                        handleFilterClick('software', product.software!)
                      }}
                      className={`rounded-full px-2 py-1 text-xs transition-all border border-stone-800 hover:border-stone-600 ${
                        isTagActive('software', product.software)
                          ? 'bg-secondary text-secondary-foreground shadow-md text-xs'
                          : 'bg-background border border-secondary text-secondary-foreground hover:bg-secondary/10 text-xs'
                      }`}
                    >
                      {product.software}
                    </motion.button>
                  )}
                </div>
                
                {/* Additional Tags */}
                {product.tags && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {product.tags.map((tag) => (
                      <motion.button
                        key={tag}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.preventDefault()
                          handleFilterClick('category', tag)
                        }}
                        className={`rounded-full px-2 py-1 text-xs transition-all ${
                          isTagActive('category', tag)
                            ? 'bg-muted text-foreground shadow-md'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        #{tag}
                      </motion.button>
                    ))}
                  </div>
                )}
              </CardContent>

              {/* View Details Link */}
              <CardFooter className="p-4 pt-0">
                <span className="text-sm font-medium text-primary group-hover:underline text-xs hover:pl-1 transition-all">
                  {t.shop.viewDetails}
                </span>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
} 