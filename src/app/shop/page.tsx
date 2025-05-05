'use client';

import { getAuthService } from '@/lib/auth/auth-service'
import { useEffect, useState, Suspense } from 'react'
import { getDictionary } from '@/i18n'
import { i18n } from '@/i18n/settings'
import { ShopClient } from '@/components/shop/shop-client'
import { FilterMenu } from '@/components/shop/filter-menu'
import { Product } from '@/types'
import { SearchBar } from '@/components/shop/search-bar'
import { ProductSkeleton } from '@/components/shop/product-skeleton'
import { useSearchParams } from 'next/navigation'
import { Dictionary } from '@/i18n/types'

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-white"></div>
      </div>
    }>
      <ShopPageContent />
    </Suspense>
  )
}

function ShopPageContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [software, setSoftware] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [t, setT] = useState<Dictionary | null>(null)
  const [page, setPage] = useState(1)
  const authService = getAuthService()
  const searchParams = useSearchParams()
  const type = searchParams.get('type')
  const isFree = searchParams.get('free') === 'true'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      // Get dictionary
      const dictionary = await getDictionary(i18n.defaultLocale)
      setT(dictionary)

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
        
        // Type assertion to handle Supabase response
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
        .select('*')
        .order('created_at', { ascending: false })

      if (type) {
        query = query.eq('type', type)
      }

      if (isFree) {
        query = query.eq('type', 'free')
      }

      const { data: productsData, error: productsError } = await query

      if (productsError) {
        console.error('Error fetching products:', productsError)
        return
      }

      setProducts(productsData || [])
      setLoading(false)
    }

    fetchData()
  }, [type, isFree])

  const handleFilterChange = async (filters: {
    category: string | null
    software: string | null
    sortBy: 'created_at' | 'name'
    sortOrder: 'asc' | 'desc'
    isFree: boolean
  }) => {
    let query = supabase
      .from('products')
      .select('*')

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

    query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' })

    const { data, error } = await query

    if (error) {
      console.error('Error filtering products:', error)
      return
    }

    // Update URL with new filter state
    const params = new URLSearchParams(searchParams.toString())
    if (filters.isFree) {
      params.set('free', 'true')
    } else {
      params.delete('free')
    }
    window.history.pushState({}, '', `?${params.toString()}`)

    setProducts(data || [])
  }

  const handleSearch = async (search: string) => {
    // Implement search functionality
  }

  if (loading || !t) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-white"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-4 mb-8">
        <SearchBar onSearch={handleSearch} t={t} />
        <FilterMenu 
          onFilterChange={handleFilterChange}
          categories={categories}
          software={software}
          isFree={isFree}
        />
      </div>
      {loading ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t.shop.search.noResults}
        </div>
      ) : (
        <ShopClient products={products} t={t} />
      )}
    </div>
  )
}
