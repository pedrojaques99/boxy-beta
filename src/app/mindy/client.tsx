'use client'

import { SearchBar } from '@/components/shop/search-bar'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { Dictionary } from '@/i18n/types'
import { LikeButton } from '@/components/LikeButton'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Resource = {
  id: string
  title: string
  url: string
  thumbnail_url: string
  description: string
  category: string
  subcategory: string
  software: string
}

export default function MindyClient() {
  const t = useTranslations()
  const [resources, setResources] = useState<Resource[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

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
        const data = await resourcesResponse.json()
        setResources(data.resources)
      } catch (error) {
        console.error('Error fetching initial data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [supabase])

  const handleSearch = async (query: string) => {
    try {
      const response = await fetch(`/api/mindy/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      setResources(data.resources)
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('mindy.title')}</h1>
      <SearchBar 
        onSearch={handleSearch} 
        t={t as unknown as Dictionary} 
        context="resources" 
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {resources.map((resource) => (
          <div key={resource.id} className="p-4 border rounded-lg">
            <Link href={`/mindy/${resource.id}`}>
              <h3 className="font-semibold hover:text-primary transition-colors">{resource.title}</h3>
            </Link>
            <p className="text-sm text-muted-foreground">{resource.description}</p>
            <div className="mt-4 flex items-center gap-4">
              <LikeButton type="resource" id={resource.id} userId={userId} />
              <Link 
                href={`/mindy/${resource.id}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t('mindy.details.seeDetails')}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 