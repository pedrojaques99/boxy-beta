'use client'

import { Input } from '@/components/ui/input'
import { Search, X, Loader2 } from 'lucide-react'
import { useEffect, useState, useRef, KeyboardEvent } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  onSearch: (query: string) => void
  t: {
    shop: {
      search: {
        placeholder: string
        recentSearches?: string
        noResults?: string
      }
    }
  }
}

export function SearchBar({ onSearch, t }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    if (debouncedSearchQuery) {
      setIsLoading(true)
      const search = async () => {
        try {
          await onSearch(debouncedSearchQuery)
        } finally {
          setIsLoading(false)
        }
      }
      search()
      
      // Save to recent searches
      if (debouncedSearchQuery.trim()) {
        const updated = [
          debouncedSearchQuery,
          ...recentSearches.filter(s => s !== debouncedSearchQuery)
        ].slice(0, 5)
        setRecentSearches(updated)
        localStorage.setItem('recentSearches', JSON.stringify(updated))
      }
    } else {
      onSearch('')
    }
  }, [debouncedSearchQuery, onSearch])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Close on escape
    if (e.key === 'Escape') {
      setIsFocused(false)
      inputRef.current?.blur()
    }
  }

  const handleClear = () => {
    setSearchQuery('')
    inputRef.current?.focus()
  }

  const handleRecentSearch = (query: string) => {
    setSearchQuery(query)
    inputRef.current?.focus()
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-2xl mx-auto"
    >
      <div className={`
        relative flex items-center transition-all duration-200
        ${isFocused ? 'scale-[1.02]' : 'scale-100'}
      `}>
        <div className="relative w-full">
          <Input
            ref={inputRef}
            type="search"
            placeholder={t.shop.search.placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setTimeout(() => setIsFocused(false), 200)
            }}
            onKeyDown={handleKeyDown}
            className="
              w-full pl-11 pr-11 h-11
              bg-background/50 backdrop-blur-sm
              border-border/50 
              hover:border-border/80
              focus:border-primary/50 focus:ring-1 focus:ring-primary/20
              transition-all duration-200
              text-foreground
            "
          />

          {/* Search/Loading Icon */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </div>

          {/* Clear Button */}
          <AnimatePresence>
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-accent/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Recent searches and suggestions */}
      <AnimatePresence>
        {isFocused && (recentSearches.length > 0 || searchQuery) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="
              absolute top-full left-0 right-0 mt-2 py-2
              bg-background/95 backdrop-blur-sm
              border border-border/50 rounded-lg shadow-lg
              z-[60] divide-y divide-border/50
            "
          >
            {/* Recent searches */}
            {recentSearches.length > 0 && !searchQuery && (
              <div className="pb-2">
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  {t.shop.search.recentSearches || 'Recent searches'}
                </div>
                {recentSearches.map((query, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleRecentSearch(query)}
                    className="w-full px-3 py-1.5 text-sm text-foreground hover:bg-accent/5 text-left flex items-center gap-2 group"
                  >
                    <Search className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                    {query}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Search results */}
            {searchQuery && (
              <div className="pt-2">
                <div className="px-3 py-1.5 text-sm text-muted-foreground">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Searching...
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      {t.shop.search.noResults || 'No results found'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 