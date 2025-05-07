'use client'

import { SearchBar } from '@/components/shop/search-bar'
import { useState, useEffect, useCallback } from 'react'
import { LikeButton } from '@/components/LikeButton'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Resource, ResourcesResponse, SearchResponse } from '@/types/mindy'
import { useTranslations } from '@/hooks/use-translations'
import { Dictionary } from '@/i18n/types'
import { useDebounce } from '@/hooks/use-debounce'
import { ResourceCard } from '@/components/mindy/resource-card'

interface MindyClientProps {
  t: Dictionary
}

export default function MindyClient({ t }: MindyClientProps) {
  const [resources, setResources] = useState<Resource[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const supabase = createClient()

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [userResponse, resourcesResponse] = await Promise.all([
          supabase.auth.getUser(),
          fetch('/api/mindy')
        ])

        const { data: { user } } = userResponse
        setUserId(user?.id || null)

        if (!resourcesResponse.ok) throw new Error('Failed to fetch resources')
        const data: ResourcesResponse = await resourcesResponse.json()
        setResources(data.resources)
      } catch (error) {
        console.error('Error fetching initial data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [supabase])

  // Debounced search effect
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearch.trim()) {
        const response = await fetch('/api/mindy')
        if (!response.ok) throw new Error('Failed to fetch resources')
        const data: ResourcesResponse = await response.json()
        setResources(data.resources)
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/mindy/search?q=${encodeURIComponent(debouncedSearch.trim())}`)
        if (!response.ok) throw new Error('Search failed')
        const data: SearchResponse = await response.json()
        setResources(data.resources)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }

    performSearch()
  }, [debouncedSearch])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // Early return if translations are not loaded
  if (!t?.mindy) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t.mindy.title}</h1>
      <SearchBar 
        onSearch={handleSearch} 
        t={t} 
        context="resources"
        isLoading={isLoading || isSearching}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
        {resources.length === 0 && !isLoading && !isSearching && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {t.mindy.search.noResults}
          </div>
        )}
      </div>
    </div>
  )
}