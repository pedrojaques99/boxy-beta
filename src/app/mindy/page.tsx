import { createClient } from '@/lib/supabase/server'
import { ResourcesClient } from './client'
import { cookies } from 'next/headers'
import { getTranslations } from 'next-intl/server'
import { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ResourceRow = Database['public']['Tables']['resources']['Row']

async function fetchUniqueValues(table: string, column: keyof ResourceRow): Promise<string[]> {
  try {
    const cookieStore = cookies()
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .not(column, 'is', null)
      .eq('approved', true)
    
    if (error) {
      console.error(`Error fetching unique ${column} values:`, error)
      return []
    }
    
    if (!data || !Array.isArray(data)) {
      return []
    }
    
    // Type assertion to ensure we're working with the correct type
    const typedData = data as Array<Pick<ResourceRow, typeof column>>
    return [...new Set(typedData.map(item => String(item[column])))].filter(Boolean)
  } catch (error) {
    console.error(`Error in fetchUniqueValues for ${column}:`, error)
    return []
  }
}

export default async function ResourcesPage() {
  const t = await getTranslations('mindy')
  
  try {
    const cookieStore = cookies()
    const supabase = await createClient()

    // Fetch resources with error handling
    const { data: resourcesData, error: resourcesError } = await supabase
      .from('resources')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false })

    if (resourcesError) {
      console.error('Error fetching resources:', resourcesError)
      throw new Error('Failed to fetch resources')
    }

    if (!resourcesData || !Array.isArray(resourcesData)) {
      throw new Error('Invalid resources data received')
    }

    // Transform and validate resources data
    const resources = resourcesData.map(resource => ({
      id: resource.id,
      title: resource.title,
      url: resource.url,
      thumbnail_url: resource.thumbnail_url,
      tags: resource.tags || [],
      category: resource.category,
      subcategory: resource.subcategory,
      software: resource.software,
      created_at: resource.created_at,
      description: resource.description,
      description_en: resource.description_en,
      price_model: resource.price_model,
      featured: resource.featured,
      approved: resource.approved
    }))

    // Fetch filter options with error handling
    const [categories, subcategories, software] = await Promise.all([
      fetchUniqueValues('resources', 'category'),
      fetchUniqueValues('resources', 'subcategory'),
      fetchUniqueValues('resources', 'software')
    ])

    const filterOptions = {
      category: categories,
      subcategory: subcategories,
      software: software
    }

    return (
      <ResourcesClient 
        resources={resources} 
        filterOptions={filterOptions}
      />
    )
  } catch (error) {
    console.error('Error in ResourcesPage:', error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground">
            {t('errors.loadingError')}
          </p>
        </div>
      </div>
    )
  }
}
