"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

interface LikeButtonProps {
  type: 'resource' | 'product'
  id: string
  userId?: string | null
}

export function LikeButton({ type, id, userId }: LikeButtonProps) {
  const supabase = createClient()
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)

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
    <button onClick={toggleLike} disabled={!userId} className={`px-2 py-1 rounded ${liked ? 'bg-red-200' : 'bg-gray-100'}`}>
      ❤️ {count}
    </button>
  )
} 