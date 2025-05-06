'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FilterMenu } from '@/components/ui/filter-menu'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

interface Resource {
  id: string
  title: string
  url: string
  tags: string[]
  category: string
  subcategory: string
  software: string
  created_at: string
  description_pt: string
  description_en: string
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

export function ResourcesClient({ resources, filterOptions }: ResourcesClientProps) {
  const t = useTranslations('mindy')
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get('category')
  const currentSubcategory = searchParams.get('subcategory')
  const currentSoftware = searchParams.get('software')

  const handleFilterClick = (key: 'category' | 'subcategory' | 'software', value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const currentValue = searchParams.get(key)
    
    if (currentValue === value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/mindy?${params.toString()}`)
  }

  const isTagActive = (key: 'category' | 'subcategory' | 'software', value: string) => {
    return searchParams.get(key) === value
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <Link key={resource.id} href={`/mindy/${resource.id}`}>
            <Card className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader className="relative h-48">
                <Image
                  src={`https://image.thum.io/get/${resource.url}`}
                  alt={resource.title}
                  fill
                  className="object-cover rounded-t-lg"
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
                <h2 className="text-xl font-semibold mb-2">{resource.title}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {resource.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
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
                          ? 'bg-secondary text-secondary-foreground shadow-md text-xs'
                          : 'bg-secondary/10 dark:bg-secondary/20 text-secondary-foreground hover:bg-secondary/20 dark:hover:bg-secondary/30 text-xs'
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
                          ? 'bg-secondary text-secondary-foreground shadow-md text-xs'
                          : 'bg-background border border-secondary text-secondary-foreground hover:bg-secondary/10 text-xs'
                      }`}
                    >
                      {resource.software}
                    </motion.button>
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
    </div>
  )
} 