'use client'

import { SearchBar } from '@/components/shop/search-bar'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Dictionary } from '@/i18n/types'

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

export default function MindyPage() {
  const t = useTranslations()
  const [resources, setResources] = useState<Resource[]>([])

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
            <h3 className="font-semibold">{resource.title}</h3>
            <p className="text-sm text-muted-foreground">{resource.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
