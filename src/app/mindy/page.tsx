'use client';

import { getDictionary } from '@/i18n'
import { i18n } from '@/i18n/settings'
import { ResourcesClient } from './client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, Suspense } from 'react'
import { Dictionary } from '@/i18n/types'

interface Resource {
  id: string
  title: string
  url: string
  tags: string[]
  description: string
  description_en: string
  category: string
  subcategory: string
  software: string
  created_at: string
}

interface FilterOptions {
  category: string[]
  subcategory: string[]
  software: string[]
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-white"></div>
      </div>
    }>
      <ResourcesPageContent />
    </Suspense>
  )
}

function ResourcesPageContent() {
  const [resources, setResources] = useState<Resource[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    category: [],
    subcategory: [],
    software: []
  })
  const [loading, setLoading] = useState(true)
  const [t, setT] = useState<Dictionary | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Get dictionary
        const dictionary = await getDictionary(i18n.defaultLocale)
        setT(dictionary)

        // Get unique values for filters
        const fetchUniqueValues = async (column: keyof Resource): Promise<string[]> => {
          const { data, error } = await supabase
            .from('resources')
            .select(column)
            .not(column, 'is', null)

          if (error) {
            console.error(`Error fetching unique ${column}:`, error)
            return []
          }

          if (!data) return []
          return [...new Set(data.map((item: Record<string, any>) => String(item[column])).filter(Boolean))] as string[]
        }

        const [categories, subcategories, software] = await Promise.all([
          fetchUniqueValues('category'),
          fetchUniqueValues('subcategory'),
          fetchUniqueValues('software')
        ])

        setFilterOptions({
          category: categories,
          subcategory: subcategories,
          software: software
        })

        // Get resources
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false })

        if (resourcesError) {
          console.error('Error fetching resources:', resourcesError)
          return
        }

        setResources(resourcesData || [])
      } catch (error) {
        console.error('Error in fetchData:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  if (loading || !t) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-white"></div>
      </div>
    )
  }

  return (
    <ResourcesClient resources={resources} filterOptions={filterOptions} />
  )
}
