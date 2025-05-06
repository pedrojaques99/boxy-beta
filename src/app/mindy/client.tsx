'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FilterMenu } from '@/components/ui/filter-menu'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Resource {
  id: string
  title: string
  url: string
  tags: string[]
  category: string
  subcategory: string
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
          <Card key={resource.id} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader className="relative h-48">
              <Image
                src={`https://image.thum.io/get/${resource.url}`}
                alt={resource.title}
                fill
                className="object-cover rounded-t-lg"
              />
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
                <p>{t('filters.category')}: {resource.category}</p>
                <p>{t('filters.subcategory')}: {resource.subcategory}</p>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Link href={`/mindy/${resource.id}`} className="w-full">
                <Button className="w-full">{t('details.seeDetails')}</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
} 