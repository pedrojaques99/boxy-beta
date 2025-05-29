'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { useState, useCallback } from 'react'
import { ImageOff, ArrowRight } from 'lucide-react'
import { Resource } from '@/types/mindy'
import { useTranslations } from '@/hooks/use-translations'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ResourceCardProps {
  resource: Resource
  priority?: boolean
}

const badgeStyles = cn(
  "h-6 px-3 rounded-full border border-muted-foreground/20",
  "bg-transparent hover:bg-muted/10",
  "text-muted-foreground hover:text-foreground",
  "transition-colors duration-200",
  "hover:border-muted-foreground/40"
)

export function ResourceCard({ resource, priority = false }: ResourceCardProps) {
  const [imageError, setImageError] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const { t } = useTranslations()

  const handleImageError = () => {
    setImageError(true)
  }

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovering) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [isHovering]);

  const handleFilterClick = (e: React.MouseEvent, type: string, value: string) => {
    e.preventDefault() // Prevent card link click
    // Create new URL with only the clicked filter
    window.location.href = `${window.location.pathname}?${type.toLowerCase()}=${encodeURIComponent(value)}`
  }

  if (!t?.mindy) return null

  return (
    <Link href={`/mindy/${resource.id}`} className="block">
      <Card 
        className={cn(
          "rounded-lg bg-card text-card-foreground shadow-sm backdrop-blur-sm",
          "transition-all duration-300",
          "hover:shadow-md",
          "before:absolute before:inset-0 before:rounded-lg before:pointer-events-none",
          "overflow-hidden group h-full relative transition-transform duration-500 ease-in-out hover:scale-[1.01]"
        )}
        style={{
          '--xPos': `${position.x}px`,
          '--yPos': `${position.y}px`
        } as React.CSSProperties}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="relative w-full aspect-[2/1] bg-muted overflow-hidden">
          {resource.thumbnail_url && !imageError ? (
            <Image
              src={resource.thumbnail_url}
              alt={resource.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              quality={80}
              className="object-cover transition-transform duration-300"
              onError={handleImageError}
              loading={priority ? 'eager' : 'lazy'}
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkMjU1LS0yMi4qLjgyPjA+OjU8PkM5QklCR1JTUzE1PkNhaUpKWlL/2wBDAR"
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
                    variant="outline"
                    size="sm"
                    className={badgeStyles}
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
                    variant="outline"
                    size="sm"
                    className={badgeStyles}
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
                    variant="outline"
                    size="sm"
                    className={badgeStyles}
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
          <span className="text-sm font-medium text-primary group-hover:underline text-xs hover:pl-1 transition-all flex items-center gap-1">
            {t.mindy.details.seeDetails}
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
} 