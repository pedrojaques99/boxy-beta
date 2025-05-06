import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { ResourceDetailClient } from './client'
import { LikeButton } from '@/components/LikeButton'
import { CommentsSection } from '@/components/CommentsSection'
import { useUserId } from '@/lib/auth/useUserId'
import { Suspense } from 'react'
import { ResourceSocialClient } from '@/components/mindy/ResourceSocialClient'

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
    <>
      <ResourceDetailClient
        resource={resource}
        relatedResources={relatedResources || []}
        comments={comments || []}
        likes={likes || []}
      />
      <Suspense fallback={null}>
        <ResourceSocialClient resourceId={resource.id} />
      </Suspense>
    </>
  )
} 