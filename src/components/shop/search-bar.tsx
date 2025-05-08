'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2, X } from 'lucide-react'
import { useEffect, useState, useRef, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDebounce } from '@/hooks/use-debounce'
import { Dictionary } from '@/i18n/types'

export interface SearchBarProps {
  onSearch: (query: string) => void
  t: Dictionary
  context: 'products' | 'resources' | 'shop' | 'mindy'
  isLoading?: boolean
}

export function SearchBar({ onSearch, t, context, isLoading: externalLoading }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isInternalLoading, setIsInternalLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedSearchQuery = useDebounce(query, 300)

  const isLoading = externalLoading || isInternalLoading

  useEffect(() => {
    const savedSearches = localStorage.getItem(`recent-${context}-searches`)
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches))
      } catch (error) {
        console.error('Error loading recent searches:', error)
        localStorage.removeItem(`recent-${context}-searches`)
      }
    }
  }, [context])

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchQuery.trim()) {
        onSearch('')
        return
      }

      setIsInternalLoading(true)
      try {
        onSearch(debouncedSearchQuery.trim())
        
        const trimmedQuery = debouncedSearchQuery.trim()
        if (trimmedQuery && !recentSearches.includes(trimmedQuery)) {
          const updated = [trimmedQuery, ...recentSearches].slice(0, 5)
          setRecentSearches(updated)
          localStorage.setItem(`recent-${context}-searches`, JSON.stringify(updated))
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsInternalLoading(false)
      }
    }

    performSearch()
  }, [debouncedSearchQuery, onSearch, context, recentSearches])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('')
      inputRef.current?.blur()
    } else if (e.key === 'Enter') {
      const trimmedQuery = query.trim()
      if (trimmedQuery) {
        onSearch(trimmedQuery)
      }
    }
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
    inputRef.current?.focus()
  }

  const handleRecentSearch = (search: string) => {
    setQuery(search)
    onSearch(search)
    inputRef.current?.focus()
  }

  const getPlaceholder = () => {
    switch (context) {
      case 'resources':
        return t?.mindy?.search?.placeholder
      case 'shop':
      case 'products':
        return t?.shop?.search?.placeholder
      default:
        return 'Search...'
    }
  }

  const getNoResults = () => {
    switch (context) {
      case 'resources':
        return t?.mindy?.search?.noResults
      case 'shop':
      case 'products':
        return t?.shop?.search?.noResults
      default:
        return 'No results found'
    }
  }

  const getRecentSearches = () => {
    switch (context) {
      case 'resources':
        return t?.mindy?.search?.recentSearches
      case 'shop':
      case 'products':
        return t?.shop?.search?.recentSearches
      default:
        return 'Recent searches'
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className={`relative flex items-center transition-all duration-200 ${isFocused ? 'scale-[1.01]' : 'scale-100'}`}>
        <div className="relative w-full">
          <Input
            ref={inputRef}
            type="text"
            placeholder={getPlaceholder()}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            className="w-full pl-11 pr-11 h-11 bg-background/50 backdrop-blur-sm border-border/50 hover:border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 rounded-full [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            disabled={isLoading}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </div>
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isFocused && recentSearches.length > 0 && !query && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 py-2 bg-background/95 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg z-[60]"
          >
            <div className="px-4 py-1.5 text-xs font-medium text-muted-white">
              {getRecentSearches()}
            </div>
            <div className="flex flex-wrap gap-2 p-3">
              {recentSearches.map((search, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleRecentSearch(search)}
                  className="text-sm rounded-full"
                  disabled={isLoading}
                >
                  {search}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
