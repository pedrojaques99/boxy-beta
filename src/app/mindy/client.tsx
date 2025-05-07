'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FilterMenu } from '@/components/ui/filter-menu'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface Resource {
  id: string
  title: string
  url: string
  thumbnail_url: string | null
  tags: string[]
  category: string
  subcategory: string
  software: string | null
  created_at: string
  description: string
  description_en: string | null
  price_model: string | null
  featured: boolean
  approved: boolean
}

interface FilterOptions {
  category: string[]
  subcategory: string[]
  software: string[]
}

interface ResourcesClientProps {
  resources: Resource[]
  filterOptions: FilterOptions
}

const ITEMS_PER_PAGE = 9

export function ResourcesClient({ resources = [], filterOptions = { category: [], subcategory: [], software: [] } }: ResourcesClientProps) {
  try {
    console.log('[MINDY][CLIENT] Renderizando ResourcesClient')
    console.log('[MINDY][CLIENT] Props recebidas:', { resources, filterOptions })
    const t = useTranslations('mindy')
    const router = useRouter()
    const searchParams = useSearchParams()
    const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const observerTarget = useRef<HTMLDivElement>(null)

    const currentCategory = searchParams.get('category')
    const currentSubcategory = searchParams.get('subcategory')
    const currentSoftware = searchParams.get('software')

    console.log('[MINDY][CLIENT] searchParams:', {
      currentCategory,
      currentSubcategory,
      currentSoftware
    })

    const handleFilterClick = useCallback((key: 'category' | 'subcategory' | 'software', value: string | null) => {
      if (!value) return
      const params = new URLSearchParams(searchParams.toString())
      const currentValue = searchParams.get(key)
      if (currentValue === value) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.push(`/mindy?${params.toString()}`)
    }, [searchParams, router])

    const isTagActive = useCallback((key: 'category' | 'subcategory' | 'software', value: string) => {
      return searchParams.get(key) === value
    }, [searchParams])

    // Memoize filtered resources with null checks
    const filteredResources = useMemo(() => {
      if (!Array.isArray(resources)) return []
      return resources.filter(resource => {
        if (!resource) return false
        if (currentCategory && resource.category !== currentCategory) return false
        if (currentSubcategory && resource.subcategory !== currentSubcategory) return false
        if (currentSoftware && resource.software !== currentSoftware) return false
        return true
      })
    }, [resources, currentCategory, currentSubcategory, currentSoftware])

    console.log('[MINDY][CLIENT] filteredResources:', filteredResources.length)

    // Loading state for images
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

    const handleImageLoad = useCallback((id: string) => {
      if (!id) return
      setLoadedImages(prev => new Set(prev).add(id))
    }, [])

    // Intersection Observer for infinite scroll
    useEffect(() => {
      if (!observerTarget.current) return
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && !isLoading && visibleItems < filteredResources.length) {
            setIsLoading(true)
            setTimeout(() => {
              setVisibleItems(prev => Math.min(prev + ITEMS_PER_PAGE, filteredResources.length))
              setIsLoading(false)
            }, 500)
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(observerTarget.current)
      return () => observer.disconnect()
    }, [visibleItems, filteredResources.length, isLoading])

    const visibleResources = filteredResources.slice(0, visibleItems)
    console.log('[MINDY][CLIENT] visibleResources:', visibleResources.length)

    // Safe image URL generation
    const getImageUrl = useCallback((resource: Resource) => {
      if (resource.thumbnail_url) return resource.thumbnail_url
      if (resource.url) return `https://image.thum.io/get/${resource.url}`
      return '/images/placeholder.jpg'
    }, [])

    if (error) {
      console.error('[MINDY][CLIENT] error state:', error)
      return (
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <FilterMenu 
            options={filterOptions} 
            labels={{
              category: t('filters.category'),
              subcategory: t('filters.subcategory'),
              software: t('filters.software')
            }}
          />
        </div>

        {!filteredResources.length ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('noResults')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleResources.map((resource) => (
                <Link key={resource.id} href={`/mindy/${resource.id}`}>
                  <Card className="flex flex-col hover:shadow-lg transition-shadow">
                    <CardHeader className="relative h-48">
                      {!loadedImages.has(resource.id) && (
                        <Skeleton className="absolute inset-0" />
                      )}
                      <Image
                        src={getImageUrl(resource)}
                        alt={resource.title || 'Resource image'}
                        fill
                        loading="lazy"
                        className={`object-cover rounded-t-lg transition-opacity duration-300 ${
                          loadedImages.has(resource.id) ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={() => handleImageLoad(resource.id)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/images/placeholder.jpg'
                        }}
                      />
                      {resource.category && (
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 1 }}
                          onClick={(e) => {
                            e.preventDefault()
                            handleFilterClick('category', resource.category)
                          }}
                          className={`absolute top-2 right-2 px-2 py-1 rounded-md text-sm transition-all ${
                            isTagActive('category', resource.category)
                              ? 'bg-primary/20 text-primary-foreground shadow-md text-xs'
                              : 'bg-background/20 border border-primary/20 text-primary hover:bg-primary/10 text-xs'
                          }`}
                        >
                          {resource.category}
                        </motion.button>
                      )}
                    </CardHeader>
                    <CardContent className="flex-grow p-6">
                      <h2 className="text-xl font-semibold mb-2 line-clamp-2">{resource.title || 'Untitled'}</h2>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {resource.description_en || resource.description || 'No description available'}
                      </p>
                      <div className="text-sm text-gray-600 flex flex-wrap gap-2">
                        {resource.subcategory && (
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 1 }}
                            onClick={(e) => {
                              e.preventDefault()
                              handleFilterClick('subcategory', resource.subcategory)
                            }}
                            className={`rounded-full px-2 py-1 text-xs transition-all border border-stone-800 hover:border-stone-600 ${
                              isTagActive('subcategory', resource.subcategory)
                                ? 'bg-secondary text-secondary-foreground shadow-md'
                                : 'bg-secondary/10 dark:bg-secondary/20 text-secondary-foreground hover:bg-secondary/20 dark:hover:bg-secondary/30'
                            }`}
                          >
                            {resource.subcategory}
                          </motion.button>
                        )}
                        {resource.software && (
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 1 }}
                            onClick={(e) => {
                              e.preventDefault()
                              handleFilterClick('software', resource.software)
                            }}
                            className={`rounded-full px-2 py-1 text-xs transition-all border border-stone-800 hover:border-stone-600 ${
                              isTagActive('software', resource.software)
                                ? 'bg-secondary text-secondary-foreground shadow-md'
                                : 'bg-background border border-secondary text-secondary-foreground hover:bg-secondary/10'
                            }`}
                          >
                            {resource.software}
                          </motion.button>
                        )}
                        {resource.price_model && (
                          <span className="rounded-full px-2 py-1 text-xs bg-primary/10 text-primary">
                            {resource.price_model}
                          </span>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-6 pt-0">
                      <Button className="w-full">{t('details.seeDetails')}</Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-center mt-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            
            {/* Observer target */}
            <div ref={observerTarget} className="h-10" />
          </>
        )}
      </div>
    )
  } catch (err) {
    console.error('[MINDY][CLIENT] ERRO DE RENDERIZAÇÃO:', err)
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de renderização</AlertTitle>
          <AlertDescription>{String(err)}</AlertDescription>
        </Alert>
      </div>
    )
  }
} 