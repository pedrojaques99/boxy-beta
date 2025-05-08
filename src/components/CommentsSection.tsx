"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Send, MessageSquare } from 'lucide-react'
import { useTranslations } from '@/hooks/use-translations'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

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
  profiles?: {
    name: string
    avatar_url: string | null
  }
}

export function CommentsSection({ type, id, userId }: CommentsSectionProps) {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const { t, locale } = useTranslations()

  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (name, avatar_url)
        `)
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
      .select(`
        *,
        profiles:user_id (name, avatar_url)
      `)
      .eq(type === 'resource' ? 'resource_id' : 'product_id', id)
      .order('created_at', { ascending: false })
    setComments(data || [])
    setLoading(false)
  }

  if (!t?.mindy) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">{t.mindy.details.comments}</h2>
      </div>

      {userId ? (
        <div className="flex gap-4 bg-muted/30 p-4 rounded-lg">
          <Avatar className="w-10 h-10 border-2 border-background">
            <AvatarImage src={undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">U</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder={t.mindy.details.writeComment}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] mb-2 bg-background"
              disabled={loading}
            />
            <Button 
              onClick={addComment}
              disabled={loading || !content.trim()}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {t.mindy.details.submitComment}
            </Button>
          </div>
        </div>
      ) : comments.length > 0 && (
        <div className="flex items-center justify-center gap-4 p-6 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">{t.auth.signInToContinue}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/auth">{t.navigation.signIn}</Link>
          </Button>
        </div>
      )}

      <AnimatePresence>
        <motion.div className="space-y-4">
          {comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors"
            >
              <Avatar className="w-10 h-10 border-2 border-background">
                <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {comment.profiles?.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-foreground">
                    {comment.profiles?.name || comment.user_id.slice(0, 6)}
                  </div>
                  <time className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat(locale, { 
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    }).format(new Date(comment.created_at))}
                  </time>
                </div>
                <p className="text-muted-foreground leading-relaxed">{comment.content}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
} 