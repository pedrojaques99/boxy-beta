'use client'

import { Product } from '@/types/shop'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useInView } from 'react-intersection-observer'
import { Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SearchBar } from '@/components/shop/search-bar'
import { useTranslations } from '@/hooks/use-translations'
import { ProductCard } from '@/components/shop/product-card'
import { TagCloud } from '@/components/shop/tag-cloud'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { HeroSection } from '@/components/ui/hero-section'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

const filterVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  }
}

// Types
type Filter = {
  category: string
  software: string
  type: string
}

const ITEMS_PER_PAGE = 20

export default function ShopClient() {
  // 1. All hooks declarations
  const { t } = useTranslations() || { t: null }
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [tagCounts, setTagCounts] = useState<{
    type: { value: string; count: number }[]
    category: { value: string; count: number }[]
    software: { value: string; count: number }[]
    status: { value: string; count: number }[]
  }>({
    type: [],
    category: [],
    software: [],
    status: []
  })
  const [tagLoading, setTagLoading] = useState(true)
  const [tagError, setTagError] = useState<string | null>(null)
  const [showOnlyFree, setShowOnlyFree] = useState(false)
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  // 2. All derived state
  const currentType = searchParams.get('type')
  const currentCategory = searchParams.get('category')
  const currentSoftware = searchParams.get('software')
  const isFreeFilter = searchParams.get('type') === 'free'
  const hasActiveFilters = Boolean(
    currentType || 
    currentCategory || 
    currentSoftware ||
    showOnlyFree ||
    searchQuery
  )

  // 3. All memoized values
  const activeFilters: Filter = useMemo(() => ({
    type: currentType || 'all',
    category: currentCategory || 'all',
    software: currentSoftware || 'all'
  }), [currentType, currentCategory, currentSoftware])

  const tags = useMemo(() => {
    return [
      ...tagCounts.type.map(tag => ({ type: 'type' as const, ...tag })),
      ...tagCounts.category.map(tag => ({ type: 'category' as const, ...tag })),
      ...tagCounts.software.map(tag => ({ type: 'software' as const, ...tag })),
    ]
  }, [tagCounts])

  // 4. All callbacks
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setPage(1)
  }, [])

  const handleClearAll = useCallback(() => {
    const params = new URLSearchParams()
    params.set('limit', ITEMS_PER_PAGE.toString())
    router.push(`/shop?${params.toString()}`)
    setSearchQuery('')
    setShowOnlyFree(false)
  }, [router])

  const handleFreeFilterChange = useCallback((checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (checked) {
      params.set('type', 'free')
    } else {
      params.delete('type')
    }
    router.push(`/shop?${params.toString()}`)
    setShowOnlyFree(checked)
  }, [router, searchParams])

  const handleTagClick = useCallback((type: 'type' | 'category' | 'software' | 'status', value: string) => {
    if (type === 'status') return
    
    const params = new URLSearchParams(searchParams.toString())
    const currentValue = params.get(type)
    
    if (currentValue === value) {
      params.delete(type)
    } else {
      params.set(type, value)
    }
    
    params.delete('page')
    params.set('limit', ITEMS_PER_PAGE.toString())
    
    router.push(`/shop?${params.toString()}`)
  }, [router, searchParams])

  const buildFilteredQuery = useCallback((start: number, end: number) => {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end)

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    }

    if (currentType) {
      query = query.eq('type', currentType)
    }
    if (currentCategory) {
      query = query.eq('category', currentCategory)
    }
    if (currentSoftware) {
      query = query.eq('software', currentSoftware)
    }

    return query
  }, [searchQuery, currentType, currentCategory, currentSoftware, supabase])

  const loadMoreProducts = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const nextPage = page + 1
      const start = (nextPage - 1) * ITEMS_PER_PAGE
      const end = start + ITEMS_PER_PAGE - 1

      const { data: newProducts, error, count } = await buildFilteredQuery(start, end)

      if (error) {
        console.error('Error loading more products:', error)
        return
      }

      if (newProducts && newProducts.length > 0) {
        setProducts(prev => {
          const uniqueNewProducts = newProducts.filter(
            (newProduct: Product) => !prev.some(existingProduct => existingProduct.id === newProduct.id)
          )
          return [...prev, ...uniqueNewProducts]
        })
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
  }, [page, loading, hasMore, buildFilteredQuery])

  // 5. All effects
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    setShowOnlyFree(isFreeFilter)
  }, [isFreeFilter])

  useEffect(() => {
    const fetchTagCounts = async () => {
      setTagLoading(true)
      setTagError(null)
      try {
        const fetchDistinctValues = async (column: string) => {
          const { data, error } = await supabase
            .from('products')
            .select(column)
            .not(column, 'is', null)

          if (error) throw error

          const counts = data.reduce((acc: Record<string, number>, item: any) => {
            const value = item[column]
            if (value && typeof value === 'string') {
              acc[value] = (acc[value] || 0) + 1
            }
            return acc
          }, {})

          return Object.entries(counts)
            .filter(([value]) => value)
            .map(([value, count]) => ({
              value,
              count: count as number
            }))
        }

        const [typeData, categoryData, softwareData] = await Promise.all([
          fetchDistinctValues('type'),
          fetchDistinctValues('category'),
          fetchDistinctValues('software')
        ])

        setTagCounts({
          type: typeData,
          category: categoryData,
          software: softwareData,
          status: []
        })
      } catch (error) {
        console.error('Error in fetchTagCounts:', error)
        setTagError('Failed to load filters. Please try again.')
        setTagCounts({
          type: [],
          category: [],
          software: [],
          status: []
        })
      } finally {
        setTagLoading(false)
      }
    }

    fetchTagCounts()
  }, [supabase])

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      try {
        setPage(1)
        const { data: productsData, error: productsError, count } = await buildFilteredQuery(0, ITEMS_PER_PAGE - 1)

        if (productsError) {
          console.error('Error fetching products:', productsError)
          return
        }

        const uniqueProducts = productsData?.reduce((acc: Product[], current: Product) => {
          const exists = acc.find(item => item.id === current.id)
          if (!exists) {
            acc.push(current)
          }
          return acc
        }, []) || []

        setProducts(uniqueProducts)
        setHasMore(count ? count > ITEMS_PER_PAGE : false)
      } catch (error) {
        console.error('Error in fetchData:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [buildFilteredQuery])

  useEffect(() => {
    if (inView) {
      loadMoreProducts()
    }
  }, [inView, loadMoreProducts])

  // Early return with loading animation if translations are not loaded
  if (!t?.shop) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <>
      <HeroSection
        title={t.shop.title}
        description={t.shop.description}
        pattern="none"
        variant="shop"
      />
      
      <div className="container mx-auto py-8">
        <motion.div 
          className="mb-8 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Search Bar and Clear Filters */}
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <SearchBar 
                onSearch={handleSearch}
                t={t}
                context="shop"
                isLoading={loading}
              />
            </div>
            <AnimatePresence>
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleClearAll}
                    className="shrink-0 h-11 w-11"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Free Filter and Tag Cloud */}
          <motion.div 
            className="flex items-center gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div 
              className="flex items-center gap-2 min-w-fit"
              variants={filterVariants}
            >
              <Checkbox
                id="free-filter"
                checked={showOnlyFree}
                onCheckedChange={handleFreeFilterChange}
              />
              <Label
                htmlFor="free-filter"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t.shop.filters.free}
              </Label>
            </motion.div>

            {/* Tag Cloud */}
            <motion.div 
              className="flex-1"
              variants={filterVariants}
            >
              {tagError ? (
                <div className="text-sm text-destructive">{tagError}</div>
              ) : tagLoading ? (
                <div className="flex gap-2">
                  <div className="h-8 bg-muted rounded w-16 animate-pulse"></div>
                  <div className="h-8 bg-muted rounded w-20 animate-pulse"></div>
                  <div className="h-8 bg-muted rounded w-24 animate-pulse"></div>
                </div>
              ) : (
                <TagCloud
                  tags={tags}
                  activeFilters={activeFilters}
                  onTagClick={handleTagClick}
                  t={t}
                />
              )}
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Product Grid */}
        <AnimatePresence mode="wait">
          {loading && !products.length ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center py-12"
            >
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </motion.div>
          ) : (
            <motion.div
              key="products"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {products.length > 0 ? (
                products.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={itemVariants}
                  >
                    <ProductCard
                      product={product}
                      onFilterClick={handleTagClick}
                      isTagActive={(key, value) => activeFilters[key] === value}
                      showFooterLink={true}
                      viewDetailsText={t.shop.viewDetails}
                      userId={userId}
                    />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  variants={itemVariants}
                  className="col-span-full text-center py-8 text-muted-foreground"
                >
                  {t.shop.noProducts}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading More Indicator */}
        <div ref={ref} className="w-full flex justify-center py-8">
          <AnimatePresence>
            {loading && products.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading more products...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}