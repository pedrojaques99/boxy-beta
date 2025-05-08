'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ImageOff, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from '@/hooks/use-translations'
import { Resource } from '@/types/mindy'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles?: {
    name: string
    avatar_url: string | null
  }
}

interface ResourceDetailClientProps {
  resource: Resource
  relatedResources: Resource[]
  comments: Comment[]
  likes: { id: string; user_id: string }[]
}

export function ResourceDetailClient({
  resource,
  relatedResources,
  comments,
  likes,
}: ResourceDetailClientProps) {
  const { t, locale } = useTranslations()
  const description = locale === 'pt-BR' ? resource.description : resource.description_en
  const [mainImageError, setMainImageError] = useState(false)
  const [relatedImagesError, setRelatedImagesError] = useState<Record<string, boolean>>({})

  if (!t?.mindy) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-muted rounded w-full mb-2"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  const handleMainImageError = () => {
    setMainImageError(true)
  }

  const handleRelatedImageError = (resourceId: string) => {
    setRelatedImagesError(prev => ({ ...prev, [resourceId]: true }))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="relative h-[400px] bg-muted overflow-hidden p-0">
              {resource.thumbnail_url && !mainImageError ? (
                <img
                  src={resource.thumbnail_url}
                  alt={resource.title}
                  onError={handleMainImageError}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <ImageOff className="w-16 h-16 text-muted-foreground opacity-50" />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">{resource.title}</h1>
                <Button asChild variant="default">
                  <a 
                    href={resource.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t.mindy.details.visitResource}
                  </a>
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {resource.category && (
                  <Badge variant="outline" className="text-foreground/80">
                    {resource.category}
                  </Badge>
                )}
                {resource.subcategory && (
                  <Badge variant="outline" className="text-foreground/80">
                    {resource.subcategory}
                  </Badge>
                )}
                {resource.software && (
                  <Badge variant="outline" className="text-foreground/80">
                    {resource.software}
                  </Badge>
                )}
                {resource.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="prose max-w-none mb-8 text-muted-foreground">
                <h2 className="text-xl font-semibold text-foreground mb-2">{t.mindy.details.description}</h2>
                <p className="leading-relaxed">{description}</p>
              </div>

              <Separator className="my-8" />

              <div className="flex items-center gap-3 mb-6">
                <Avatar>
                  <AvatarImage src={resource.profiles?.avatar_url || undefined} />
                  <AvatarFallback>{resource.profiles?.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{resource.profiles?.name}</div>
                  <div className="text-sm text-muted-foreground">{t.mindy.details.createdBy}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-6 sticky top-4">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">{t.mindy.details.relatedResources}</h2>
              <div className="space-y-4">
                {relatedResources?.map((related: Resource) => (
                  <Link key={related.id} href={`/mindy/${related.id}`}>
                    <div className="flex gap-4 hover:bg-muted/50 p-2 rounded-lg transition-colors group">
                      <div className="relative w-20 h-20 bg-muted rounded overflow-hidden">
                        {related.thumbnail_url && !relatedImagesError[related.id] ? (
                          <img
                            src={related.thumbnail_url}
                            alt={related.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={() => handleRelatedImageError(related.id)}
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="w-6 h-6 text-muted-foreground opacity-50" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium group-hover:text-primary transition-colors">
                          {related.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{related.category}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 