'use client'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { Resource } from '@/types/mindy'
import { useTranslations } from '@/hooks/use-translations'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface ResourceCardProps {
  resource: Resource
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const [imageError, setImageError] = useState(false)
  const { t } = useTranslations()

  const handleImageError = () => {
    setImageError(true)
  }

  const handleFilterClick = (e: React.MouseEvent, type: string, value: string) => {
    e.preventDefault() // Prevent card link click
    // Create new URL with only the clicked filter
    window.location.href = `${window.location.pathname}?${type.toLowerCase()}=${encodeURIComponent(value)}`
  }

  if (!t?.mindy) return null

  return (
    <Link href={`/mindy/${resource.id}`} className="block">
      <Card className="overflow-hidden group h-full">
        <div className="relative w-full h-40 bg-muted overflow-hidden">
          {resource.thumbnail_url && !imageError ? (
            <img
              src={resource.thumbnail_url}
              alt={resource.title}
              loading="lazy"
              width={400}
              height={160}
              onError={handleImageError}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              className="transition-transform duration-300 group-hover:scale-105"
              decoding="async"
              fetchPriority="low"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ImageOff className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
            {resource.title}
          </h2>
          <div className="flex flex-wrap gap-2 mt-2 mb-2">
            {resource.category && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-6 rounded-full bg-secondary/10 hover:bg-secondary/20"
                    onClick={(e) => handleFilterClick(e, 'category', resource.category)}
                  >
                    {resource.category}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t.mindy.details.filterBy.replace('{type}', t.mindy.filters.category)}
                </TooltipContent>
              </Tooltip>
            )}
            {resource.subcategory && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-6 rounded-full bg-muted hover:bg-muted/80"
                    onClick={(e) => handleFilterClick(e, 'subcategory', resource.subcategory)}
                  >
                    {resource.subcategory}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t.mindy.details.filterBy.replace('{type}', t.mindy.filters.subcategory)}
                </TooltipContent>
              </Tooltip>
            )}
            {resource.software && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-6 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
                    onClick={(e) => handleFilterClick(e, 'software', resource.software)}
                  >
                    {resource.software}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t.mindy.details.filterBy.replace('{type}', t.mindy.filters.software)}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {resource.description}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <span className="text-sm font-medium text-primary group-hover:underline text-xs hover:pl-1 transition-all">
            {t.mindy.details.seeDetails}
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
} 