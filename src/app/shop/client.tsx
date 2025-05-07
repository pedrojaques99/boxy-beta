'use client'

import Link from 'next/link'
import { useTheme } from '@/lib/theme-context'
import { Product, ShopFilters } from '@/types/shop'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { Loader2 } from 'lucide-react'
import { LikeButton } from '@/components/LikeButton'
import { createClient } from '@/lib/supabase/client'
import { getAuthService } from '@/lib/auth/auth-service'
import { ShopClient as ShopClientComponent } from '@/components/shop/shop-client'
import { FilterMenu } from '@/components/shop/filter-menu'
import { SearchBar } from '@/components/shop/search-bar'
import { Dictionary } from '@/i18n/types'
import { useTranslations } from '@/hooks/use-translations'

interface ShopClientProps {
  t: Dictionary
}

export default function ShopClient({ t }: ShopClientProps) {
  const { t: translations } = useTranslations()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [software, setSoftware] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)
  const ITEMS_PER_PAGE = 20
  const searchParams = useSearchParams()
  const type = searchParams.get('type')
  const isFree = searchParams.get('free') === 'true'
  const supabase = createClient()
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      try {
        // Get unique values for filters
        const fetchUniqueValues = async (column: keyof Product): Promise<string[]> => {
          const { data, error } = await supabase
            .from('products')
            .select(column)
            .not(column, 'is', null)

          if (error) {
            console.error(`Error fetching unique ${column}:`, error)
            return []
          }

          if (!data) return []
          
          const typedData = data as Array<Record<keyof Product, any>>
          return [...new Set(typedData.map(item => {
            const value = item[column]
            return value ? String(value) : ''
          }))].filter(Boolean)
        }

        const [categoriesData, softwareData] = await Promise.all([
          fetchUniqueValues('category'),
          fetchUniqueValues('software')
        ])

        setCategories(categoriesData)
        setSoftware(softwareData)

        // Get initial products
        let query = supabase
          .from('products')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(0, ITEMS_PER_PAGE - 1)

        if (type) {
          query = query.eq('type', type)
        }

        if (isFree) {
          query = query.eq('type', 'free')
        }

        const { data: productsData, error: productsError, count } = await query

        if (productsError) {
          console.error('Error fetching products:', productsError)
          return
        }

        setProducts(productsData || [])
        setHasMore(count ? count > ITEMS_PER_PAGE : false)
      } catch (error) {
        console.error('Error in fetchData:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
    setPage(1) // Reset page when filters change
  }, [type, isFree, supabase])

  // Load more products when scrolling
  const loadMoreProducts = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const nextPage = page + 1
      const start = (nextPage - 1) * ITEMS_PER_PAGE
      const end = start + ITEMS_PER_PAGE - 1

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end)

      if (type) {
        query = query.eq('type', type)
      }

      if (isFree) {
        query = query.eq('type', 'free')
      }

      const { data: newProducts, error, count } = await query

      if (error) {
        console.error('Error loading more products:', error)
        return
      }

      if (newProducts && newProducts.length > 0) {
        setProducts(prev => [...prev, ...newProducts])
        setPage(nextPage)
        setHasMore(count ? count > (nextPage * ITEMS_PER_PAGE) : false)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more products:', error)
    } finally {
      setLoading(false)
    }
  }, [page, loading, hasMore, type, isFree, supabase])

  // Trigger load more when scrolling
  useEffect(() => {
    if (inView && hasMore) {
      loadMoreProducts()
    }
  }, [inView, hasMore, loadMoreProducts])

  const handleFilterChange = async (filters: ShopFilters) => {
    setLoading(true)
    try {
      // Update URL with new filter state
      const params = new URLSearchParams(searchParams.toString())
      
      if (filters.category) {
        params.set('category', filters.category)
      } else {
        params.delete('category')
      }
      
      if (filters.software) {
        params.set('software', filters.software)
      } else {
        params.delete('software')
      }
      
      if (filters.isFree) {
        params.set('free', 'true')
      } else {
        params.delete('free')
      }
      
      // Update URL without full page reload
      window.history.pushState({}, '', `?${params.toString()}`)

      // Use Supabase client for product filtering with pagination
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .range(0, ITEMS_PER_PAGE - 1)

      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.software) {
        query = query.eq('software', filters.software)
      }
      if (type) {
        query = query.eq('type', type)
      }
      if (filters.isFree) {
        query = query.eq('type', 'free')
      }

      query = query.order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) {
        console.error('Error filtering products:', error)
        return
      }

      setProducts(data || [])
      setPage(1)
      setHasMore(count ? count > ITEMS_PER_PAGE : false)
    } catch (error) {
      console.error('Error in handleFilterChange:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (search: string) => {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .or(`name.ilike.%${search}%,description.ilike.%${search}%`)
        .order('created_at', { ascending: false })
        .range(0, ITEMS_PER_PAGE - 1)

      if (type) {
        query = query.eq('type', type)
      }

      if (isFree) {
        query = query.eq('type', 'free')
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error searching products:', error)
        return
      }

      setProducts(data || [])
      setPage(1)
      setHasMore(count ? count > ITEMS_PER_PAGE : false)
    } catch (error) {
      console.error('Error in handleSearch:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!t?.shop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">{t.shop.title}</h1>
      
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
                    {t.shop.viewDetails}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {t.shop.noProducts}
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