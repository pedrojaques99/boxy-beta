'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'

interface Resource {
  id: string
  title: string
  url: string
  tags: string[]
  category: string
  subcategory: string
  description_pt: string
  description_en: string
  created_by: string
  profiles?: {
    name: string
    avatar_url: string | null
  }
}

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
  const t = useTranslations('mindy')
  const locale = useLocale()
  const description = locale === 'pt-BR' ? resource.description_pt : resource.description_en

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="relative h-64">
              <Image
                src={`https://image.thum.io/get/${resource.url}`}
                alt={resource.title}
                fill
                className="object-cover rounded-t-lg"
              />
            </CardHeader>
            <CardContent className="p-6">
              <h1 className="text-3xl font-bold mb-4">{resource.title}</h1>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {resource.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="prose max-w-none mb-8">
                <h2 className="text-xl font-semibold mb-2">{t('details.description')}</h2>
                <p className="mb-6">{description}</p>
              </div>

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={resource.profiles?.avatar_url || undefined} />
                    <AvatarFallback>{resource.profiles?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <span>{t('details.createdBy')} {resource.profiles?.name}</span>
                </div>
                <Button asChild>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    {t('details.visitResource')}
                  </a>
                </Button>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">{t('details.comments')}</h2>
                <div className="space-y-4">
                  {comments?.map((comment: Comment) => (
                    <div key={comment.id} className="flex gap-4">
                      <Avatar>
                        <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                        <AvatarFallback>{comment.profiles?.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{comment.profiles?.name}</div>
                        <p className="text-gray-600">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">{t('details.relatedResources')}</h2>
              <div className="space-y-4">
                {relatedResources?.map((related: Resource) => (
                  <Link key={related.id} href={`/mindy/${related.id}`}>
                    <div className="flex gap-4 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <div className="relative w-20 h-20">
                        <Image
                          src={`https://image.thum.io/get/${related.url}`}
                          alt={related.title}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{related.title}</h3>
                        <p className="text-sm text-gray-600">{related.category}</p>
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