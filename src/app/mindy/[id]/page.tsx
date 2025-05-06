import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

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

export default async function ResourcePage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  const { data: resource } = await supabase
    .from('resources')
    .select(`
      *,
      profiles:created_by (name, avatar_url)
    `)
    .eq('id', params.id)
    .single()

  if (!resource) {
    notFound()
  }

  const { data: relatedResources } = await supabase
    .from('resources')
    .select('*')
    .or(`category.eq.${resource.category},subcategory.eq.${resource.subcategory}`)
    .neq('id', resource.id)
    .limit(3)

  const { data: comments } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id (name, avatar_url)
    `)
    .eq('resource_id', params.id)
    .order('created_at', { ascending: false })

  const { data: likes } = await supabase
    .from('likes')
    .select('*')
    .eq('resource_id', params.id)

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
                <h2 className="text-xl font-semibold mb-2">Description (PT)</h2>
                <p className="mb-6">{resource.description_pt}</p>
                
                <h2 className="text-xl font-semibold mb-2">Description (EN)</h2>
                <p className="mb-6">{resource.description_en}</p>
              </div>

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={resource.profiles?.avatar_url || undefined} />
                    <AvatarFallback>{resource.profiles?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <span>Created by {resource.profiles?.name}</span>
                </div>
                <Button asChild>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    Visit Resource
                  </a>
                </Button>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Comments</h2>
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
              <h2 className="text-xl font-semibold mb-4">Related Resources</h2>
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