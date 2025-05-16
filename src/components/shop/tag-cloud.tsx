import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Dictionary } from '@/i18n/types'

interface TagCloudProps {
  tags: {
    type: 'type' | 'category' | 'software' | 'status' | 'tags'
    value: string
    count: number
  }[]
  activeFilters: {
    type?: string
    category?: string
    software?: string
    status?: string
    tags?: string
  }
  onTagClick: (type: 'type' | 'category' | 'software' | 'status' | 'tags', value: string) => void
  t: Dictionary
}

export function TagCloud({ tags, activeFilters, onTagClick, t }: TagCloudProps) {
  // Validate and clean tags
  const validTags = tags.filter(tag => 
    tag && 
    typeof tag.value === 'string' && 
    tag.value.trim() !== '' && 
    typeof tag.count === 'number' && 
    tag.count > 0
  )

  const getTagLabel = (type: string, value: string) => {
    if (!value) return ''
    if (type === 'status') {
      return value === 'free' ? t?.shop?.filters?.free : t?.shop?.filters?.premium
    }
    if (type === 'type') {
      return t?.shop?.filters?.[value as keyof typeof t.shop.filters] || value
    }
    return value
  }

  // If no valid tags, show a message
  if (validTags.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No filters available
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {validTags.map((tag) => {
        const isActive = activeFilters[tag.type as keyof typeof activeFilters] === tag.value
        return (
          <motion.div
            key={`${tag.type}-${tag.value}-${tag.count}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            layout
          >
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                "flex items-center gap-1.5 py-1 px-3",
                isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                tag.type === 'type' && "border-secondary-foreground/20",
                tag.type === 'category' && "border-muted-foreground/20",
                tag.type === 'software' && "border-primary/20",
                tag.type === 'status' && "border-stone-400/20",
                tag.type === 'tags' && "border-blue-400/20"
              )}
              onClick={() => onTagClick(tag.type, tag.value)}
            >
              {getTagLabel(tag.type, tag.value)}
              <span className="text-xs opacity-60">({tag.count})</span>
            </Badge>
          </motion.div>
        )
      })}
    </div>
  )
} 