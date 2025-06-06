'use client'

import { SearchBar } from '@/components/shop/search-bar'
import { useState, useEffect, useCallback, useRef } from 'react'
import { LikeButton } from '@/components/LikeButton'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Resource, ResourcesResponse, SearchResponse } from '@/types/mindy'
import { useTranslations } from '@/hooks/use-translations'
import { Dictionary } from '@/i18n/types'
import { useDebounce } from '@/hooks/use-debounce'
import { ResourceCard } from '@/components/mindy/resource-card'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { HeroSection } from '@/components/ui/hero-section'
import { getAuthService } from '@/lib/auth/auth-service'
import { useAuth } from '@/hooks/use-auth'

interface FilterOption {
  type: 'category' | 'subcategory' | 'software'
  value: string
  count: number
}

interface ResourceFilter {
  category?: string
  subcategory?: string
  software?: string
}

interface MindyClientProps {
  t: Dictionary
}

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

export default function MindyClient() {
  const { t } = useTranslations()
  const [resources, setResources] = useState<Resource[]>([])
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const observerTarget = useRef<HTMLDivElement>(null)
  const authService = getAuthService()

  // Fetch unique filter values
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const { data: resources, error } = await supabase
          .from('resources')
          .select('category, subcategory, software')

        if (error) throw error

        const options: FilterOption[] = []
        const counts = {
          category: {} as Record<string, number>,
          subcategory: {} as Record<string, number>,
          software: {} as Record<string, number>
        }

        resources?.forEach((resource: ResourceFilter) => {
          if (resource.category) {
            counts.category[resource.category] = (counts.category[resource.category] || 0) + 1
          }
          if (resource.subcategory) {
            counts.subcategory[resource.subcategory] = (counts.subcategory[resource.subcategory] || 0) + 1
          }
          if (resource.software) {
            counts.software[resource.software] = (counts.software[resource.software] || 0) + 1
          }
        })

        // Sort by count and then alphabetically
        const sortByCountAndName = (a: FilterOption, b: FilterOption) => {
          if (b.count === a.count) {
            return a.value.localeCompare(b.value)
          }
          return b.count - a.count
        }

        // Add all options to a single array
        Object.entries(counts.category).forEach(([value, count]) => {
          options.push({ type: 'category', value, count })
        })
        Object.entries(counts.subcategory).forEach(([value, count]) => {
          options.push({ type: 'subcategory', value, count })
        })
        Object.entries(counts.software).forEach(([value, count]) => {
          options.push({ type: 'software', value, count })
        })

        // Sort all options together
        setFilterOptions(options.sort(sortByCountAndName))
      } catch (error) {
        console.error('Error fetching filter options:', error)
      }
    }

    fetchFilterOptions()
  }, [supabase])

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await fetchResources()
      } catch (error) {
        console.error('Error fetching initial data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [user])

  // Cache key generation
  const getCacheKey = (search?: string) => {
    const category = searchParams.get('category')
    const subcategory = searchParams.get('subcategory')
    const software = searchParams.get('software')
    return `mindy-resources:${search || ''}:${category || ''}:${subcategory || ''}:${software || ''}:${page}`
  }

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore])

  // Fetch resources with caching
  const fetchResources = async (search?: string, currentPage = 1) => {
    try {
      setIsLoadingMore(currentPage > 1)
      if (currentPage === 1) setIsLoading(true)

      const cacheKey = getCacheKey(search)
      const cachedData = sessionStorage.getItem(cacheKey)

      if (cachedData) {
        const { resources: cachedResources, timestamp } = JSON.parse(cachedData)
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          if (currentPage === 1) {
            setResources(cachedResources)
          } else {
            setResources(prev => [...prev, ...cachedResources])
          }
          setHasMore(cachedResources.length === 12) // Assuming 12 items per page
          return
        }
      }

      let url = '/api/mindy'
      const params = new URLSearchParams()

      params.append('page', currentPage.toString())
      params.append('limit', '12')

      const category = searchParams.get('category')
      const subcategory = searchParams.get('subcategory')
      const software = searchParams.get('software')

      if (category) params.append('category', category)
      if (subcategory) params.append('subcategory', subcategory)
      if (software) params.append('software', software)

      if (search?.trim()) {
        url = `/api/mindy/search?q=${encodeURIComponent(search.trim())}&${params.toString()}`
      } else {
        url = `${url}?${params.toString()}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch resources')
      const data = await response.json()

      // Cache the results
      sessionStorage.setItem(cacheKey, JSON.stringify({
        resources: data.resources,
        timestamp: Date.now()
      }))

      if (currentPage === 1) {
        setResources(data.resources)
      } else {
        setResources(prev => [...prev, ...data.resources])
      }
      setHasMore(data.resources.length === 12)
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
      setIsSearching(false)
    }
  }

  // Reset pagination when filters or search change
  useEffect(() => {
    setPage(1)
    setResources([])
    fetchResources(debouncedSearch, 1)
  }, [debouncedSearch, searchParams])

  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchResources(debouncedSearch, page)
    }
  }, [page])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleClearAll = useCallback(() => {
    setSearchQuery('')
    router.push('/mindy') // Clear URL params
  }, [router])

  const handleFilterClick = useCallback((type: string, value: string) => {
    const currentFilter = searchParams.get(type)
    if (currentFilter === value) {
      // If clicking the same filter, remove it
      router.push('/mindy')
    } else {
      // If clicking a different filter, apply it
      router.push(`/mindy?${type}=${encodeURIComponent(value)}`)
    }
  }, [router, searchParams])

  const hasFilters = searchParams.get('category') || searchParams.get('subcategory') || searchParams.get('software')
  const showClearButton = searchQuery || hasFilters

  // Early return with loading animation
  if (!t?.mindy) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          className="animate-pulse space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </motion.div>
      </div>
    )
  }

  const activeFilter = searchParams.get('category') || searchParams.get('subcategory') || searchParams.get('software')

  return (
    <>
      <HeroSection
        title={t.mindy.title}
        subtitle={t.mindy.description || "Access our curated collection of mindfulness resources and tools to enhance your well-being journey."}
      />
      
      <div className="container mx-auto px-4">
        {/* Search Section with Elevated Card */}
        <motion.div 
          className="-mt-8 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50">
            <div className="flex gap-3 items-center mb-6">
              <div className="flex-1">
                <SearchBar
                  onSearch={handleSearch}
                  t={t}
                  context="mindy"
                  isLoading={isSearching}
                />
              </div>
              <AnimatePresence>
                {showClearButton && (
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

            <motion.div 
              className="flex flex-wrap gap-2"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {filterOptions.map((option, index) => (
                <motion.div
                  key={`${option.type}-${option.value}`}
                  variants={filterVariants}
                  style={{
                    // Slight size variation for visual hierarchy
                    scale: 1 - (index * 0.02),
                    opacity: 1 - (index * 0.02)
                  }}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      'cursor-pointer hover:bg-accent/50 transition-all duration-200',
                      'hover:scale-105',
                      searchParams.get(option.type) === option.value && 'bg-accent',
                      // Slight size variation for visual hierarchy
                      index < 5 ? 'text-sm' : 'text-xs'
                    )}
                    onClick={() => handleFilterClick(option.type, option.value)}
                  >
                    {option.value}
                    <span className="ml-1 opacity-60">({option.count})</span>
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Results Section */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
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
                key="resources"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {resources.length > 0 ? (
                  resources.map((resource) => (
                    <motion.div
                      key={resource.id}
                      variants={itemVariants}
                    >
                      <ResourceCard
                        resource={resource}
                      />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    variants={itemVariants}
                    className="col-span-full text-center py-8 text-muted-foreground"
                  >
                    {t.mindy.noResults}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Load More Trigger */}
        {!isLoading && hasMore && (
          <div
            ref={observerTarget}
            className="flex justify-center items-center py-8"
          >
            {isLoadingMore && <Loader2 className="h-6 w-6 animate-spin" />}
          </div>
        )}
      </div>
    </>
  )
}