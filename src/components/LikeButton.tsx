"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface LikeButtonProps {
  type: 'resource' | 'product'
  id: string
  userId?: string | null
}

export function LikeButton({ type, id, userId }: LikeButtonProps) {
  const supabase = createClient()
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const fetchLikes = async () => {
      const { data: likes } = await supabase
        .from('likes')
        .select('id, user_id')
        .eq(type === 'resource' ? 'resource_id' : 'product_id', id)
      setCount(likes?.length || 0)
      setLiked(!!likes?.find((like: any) => like.user_id === userId))
    }
    fetchLikes()
  }, [id, userId, supabase, type])

  const toggleLike = async () => {
    if (!userId) return
    
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 700)

    if (liked) {
      await supabase.from('likes').delete()
        .eq('user_id', userId)
        .eq(type === 'resource' ? 'resource_id' : 'product_id', id)
      setLiked(false)
      setCount(count - 1)
    } else {
      await supabase.from('likes').insert({
        user_id: userId,
        [type === 'resource' ? 'resource_id' : 'product_id']: id
      })
      setLiked(true)
      setCount(count + 1)
    }
  }

  return (
    <Button
      onClick={toggleLike}
      disabled={!userId}
      variant="ghost"
      size="icon"
      className={cn(
        "group relative hover:bg-transparent p-0 h-8 w-8",
        !userId && "cursor-not-allowed opacity-50"
      )}
    >
      <AnimatePresence>
        <motion.div
          key={`heart-${liked}-${isAnimating}`}
          initial={{ scale: 1 }}
          animate={isAnimating ? {
            scale: [1, 1.5, 0.8, 1.1, 1],
            rotate: [0, -10, 10, -5, 0]
          } : { scale: 1 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-all duration-300",
              liked ? "fill-red-500 stroke-red-500" : "stroke-foreground/60 group-hover:stroke-foreground/80",
              "group-hover:scale-110"
            )}
          />
        </motion.div>
      </AnimatePresence>
      {count > 0 && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -bottom-1 -right-1 text-xs font-medium text-muted-foreground"
        >
          {count}
        </motion.span>
      )}
    </Button>
  )
} 