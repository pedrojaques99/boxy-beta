'use client'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { Resource } from '@/types/mindy'

export function ResourceCard({ resource }: { resource: Resource }) {
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

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
              <span className="rounded-full bg-secondary/10 text-secondary-foreground px-3 py-1 text-xs font-medium">
                {resource.category}
              </span>
            )}
            {resource.subcategory && (
              <span className="rounded-full bg-muted text-muted-foreground px-3 py-1 text-xs font-medium">
                {resource.subcategory}
              </span>
            )}
            {resource.software && (
              <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
                {resource.software}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {resource.description}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <span className="text-sm font-medium text-primary group-hover:underline text-xs hover:pl-1 transition-all">
            Ver detalhes
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
} 