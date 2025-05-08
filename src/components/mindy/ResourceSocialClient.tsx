"use client"
import { LikeButton } from '@/components/LikeButton'
import { CommentsSection } from '@/components/CommentsSection'
import { useUserId } from '@/lib/auth/useUserId'
import { useTranslations } from '@/hooks/use-translations'
import { Button } from '@/components/ui/button'
import { Heart, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export function ResourceSocialClient({ resourceId }: { resourceId: string }) {
  const { userId } = useUserId()
  const { t } = useTranslations()

  if (!t?.navigation) return null

  if (!userId) {
    return (
      <div className="my-6 space-y-6">
        <div className="flex flex-col items-center justify-center gap-4 p-8 bg-muted/30 rounded-lg text-center">
          <p className="text-lg text-muted-foreground">
            {t.auth.signInToContinue}
          </p>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/auth">
                <Heart className="w-4 h-4" />
                {t.navigation.signIn}
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <Link href="/auth">
                <MessageSquare className="w-4 h-4" />
                {t.navigation.getStarted}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="my-6 flex gap-4 items-center">
        <LikeButton type="resource" id={resourceId} userId={userId} />
      </div>
      <CommentsSection type="resource" id={resourceId} userId={userId} />
    </>
  )
} 