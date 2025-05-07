'use client';

import Link from 'next/link'
import { useTheme } from '@/lib/theme-context'
import { Product, ShopTranslations } from '@/types/shop'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Dictionary } from '@/i18n/types'
import { useEffect, useState, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { Loader2 } from 'lucide-react'
import { LikeButton } from '@/components/LikeButton'
import { createClient } from '@/lib/supabase/client'

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
 * - Lazy loading with infinite scroll
 */
export function ShopClient({ products: initialProducts, t }: ShopClientProps) {
  // Theme context for dark/light mode
  const { theme } = useTheme()
  
  // Router and search params for URL-based filtering
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Current filter values from URL
  const currentType = searchParams.get('type')
  const currentCategory = searchParams.get('category')
  const currentSoftware = searchParams.get('software')

  // State for pagination and loading
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const ITEMS_PER_PAGE = 20

  // Intersection Observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  /**
   * Fetches more products when scrolling
   */
  const fetchMoreProducts = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const nextPage = page + 1
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', nextPage.toString())
      params.set('limit', ITEMS_PER_PAGE.toString())

      const response = await fetch(`/api/products?${params.toString()}`)
      const data = await response.json()

      if (data.products.length < ITEMS_PER_PAGE) {
        setHasMore(false)
      }

      setProducts(prev => [...prev, ...data.products])
      setPage(nextPage)
    } catch (error) {
      console.error('Error fetching more products:', error)
    } finally {
      setLoading(false)
    }
  }, [page, loading, hasMore, searchParams])

  // Effect to load more products when scrolling
  useEffect(() => {
    if (inView) {
      fetchMoreProducts()
    }
  }, [inView, fetchMoreProducts])

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
    
    // Reset pagination when filters change
    params.set('page', '1')
    params.set('limit', ITEMS_PER_PAGE.toString())
    
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
      <h1 className="mb-8 text-3xl font-bold text-foreground">{t?.shop?.title}</h1>
      
      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="group relative overflow-hidden rounded-lg border bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors"
          >
            <Link href={`/shop/${product.id}`} className="block">
              <div className="aspect-square overflow-hidden">
                  <img
                    src={product.thumb}
                    alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              <div className="p-4">
                <h3 className="font-medium text-lg text-foreground group-hover:text-primary transition-colors">
                    {product.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {product.category}
                    </span>
                  {product.software && (
                      <span className="text-xs font-medium text-muted-foreground">
                        • {product.software}
                      </span>
                    )}
                  </div>
                  <LikeButton type="product" id={product.id} userId={userId} />
                </div>
                <div className="mt-4">
                  <span className="text-sm text-primary group-hover:underline">
                    {t?.shop?.viewDetails}
                </span>
                </div>
              </div>
          </Link>
          </motion.div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {t?.shop?.noProducts}
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      <div ref={ref} className="w-full flex justify-center py-8">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading more products...</span>
          </div>
        )}
      </div>
    </div>
  )
} 