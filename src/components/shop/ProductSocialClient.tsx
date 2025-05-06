"use client"
import { LikeButton } from '@/components/LikeButton'
import { CommentsSection } from '@/components/CommentsSection'
import { useUserId } from '@/lib/auth/useUserId'

export function ProductSocialClient({ productId }: { productId: string }) {
  const userId = useUserId()
  return (
    <>
      <div className="my-6 flex gap-4 items-center">
        <LikeButton type="product" id={productId} userId={userId} />
      </div>
      <CommentsSection type="product" id={productId} userId={userId} />
    </>
  )
} 