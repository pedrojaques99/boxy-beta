"use client"
import { LikeButton } from '@/components/LikeButton'
import { CommentsSection } from '@/components/CommentsSection'
import { useUserId } from '@/lib/auth/useUserId'

export function ResourceSocialClient({ resourceId }: { resourceId: string }) {
  const { userId } = useUserId()
  return (
    <>
      <div className="my-6 flex gap-4 items-center">
        <LikeButton type="resource" id={resourceId} userId={userId} />
      </div>
      <CommentsSection type="resource" id={resourceId} userId={userId} />
    </>
  )
} 