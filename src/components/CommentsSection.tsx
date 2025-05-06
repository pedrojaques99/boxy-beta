"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

interface CommentsSectionProps {
  type: 'resource' | 'product'
  id: string
  userId?: string | null
}

interface Comment {
  id: string
  user_id: string
  content: string
  created_at: string
}

export function CommentsSection({ type, id, userId }: CommentsSectionProps) {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq(type === 'resource' ? 'resource_id' : 'product_id', id)
        .order('created_at', { ascending: false })
      setComments(data || [])
    }
    fetchComments()
  }, [id, supabase, type])

  const addComment = async () => {
    if (!userId || !content.trim()) return
    setLoading(true)
    await supabase.from('comments').insert({
      user_id: userId,
      [type === 'resource' ? 'resource_id' : 'product_id']: id,
      content
    })
    setContent('')
    // Refresh comments
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq(type === 'resource' ? 'resource_id' : 'product_id', id)
      .order('created_at', { ascending: false })
    setComments(data || [])
    setLoading(false)
  }

  return (
    <div className="my-4">
      <h3 className="font-semibold mb-2">Comments</h3>
      {userId && (
        <div className="flex gap-2 mb-4">
          <input
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Add a comment..."
            className="border px-2 py-1 rounded flex-1"
            disabled={loading}
          />
          <button onClick={addComment} disabled={loading || !content.trim()} className="px-2 py-1 bg-blue-200 rounded">
            Post
          </button>
        </div>
      )}
      <ul className="space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="border-b pb-1 text-sm">
            <b>{c.user_id.slice(0, 6)}</b>: {c.content}
          </li>
        ))}
      </ul>
    </div>
  )
} 