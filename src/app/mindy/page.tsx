import { ResourcesClient } from './client'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/supabase'

type DbResource = {
  id: string
  title: string
  category: string
  subcategory: string
  software: string | null
  description: string | null
  description_en: string | null
  url: string
  thumbnail_url: string | null
  created_at: string | null
  updated_at: string | null
  price_model: string | null
  featured: boolean | null
  created_by: string | null
  tags: string[] | null
  approved: boolean | null
}

interface Resource {
  id: string
  title: string
  url: string
  thumbnail_url: string | null
  tags: string[]
  category: string
  subcategory: string
  software: string | null
  created_at: string
  description: string
  description_en: string | null
  price_model: string | null
  featured: boolean
  approved: boolean
}

interface FilterOptions {
  category: string[]
  subcategory: string[]
  software: string[]
}

export default async function ResourcesPage() {
  const supabase = await createClient()
  let resources: Resource[] = []
  let filterOptions: FilterOptions = { category: [], subcategory: [], software: [] }
  let error = null

  try {
    // Fetch only approved resources
    const { data: resourcesData, error: resourcesError } = await supabase
      .from('resources')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false })

    if (resourcesError) throw resourcesError

    if (!resourcesData || !Array.isArray(resourcesData) || resourcesData.length === 0) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground text-center">No approved resources available.</p>
        </div>
      )
    }

    // Transform database resources to component resources with validation
    resources = resourcesData
      .filter((resource): resource is DbResource => {
        return (
          resource !== null &&
          typeof resource === 'object' &&
          typeof resource.id === 'string' &&
          typeof resource.title === 'string' &&
          typeof resource.url === 'string' &&
          typeof resource.category === 'string' &&
          typeof resource.subcategory === 'string'
        )
      })
      .map((resource: DbResource) => ({
        id: String(resource.id),
        title: String(resource.title),
        url: String(resource.url),
        thumbnail_url: resource.thumbnail_url || null,
        tags: Array.isArray(resource.tags) ? resource.tags : [],
        category: String(resource.category),
        subcategory: String(resource.subcategory),
        software: resource.software || null,
        created_at: resource.created_at || new Date().toISOString(),
        description: resource.description || '',
        description_en: resource.description_en || null,
        price_model: resource.price_model || null,
        featured: Boolean(resource.featured),
        approved: true // Since we're only fetching approved resources
      }))

    // Fetch filter options with error handling
    const fetchUniqueValues = async (column: keyof Pick<DbResource, 'category' | 'subcategory' | 'software'>): Promise<string[]> => {
      try {
        const { data, error } = await supabase
          .from('resources')
          .select(column)
          .eq('approved', true) // Only get options from approved resources
          .not(column, 'is', null)
        
        if (error) throw error
        
        if (!data || !Array.isArray(data)) return []

        return [...new Set(data
          .map((item: any) => {
            const value = item?.[column]
            return value ? String(value) : null
          })
          .filter((value): value is string => value !== null)
        )]
      } catch (err) {
        console.error(`Error fetching ${column}:`, err)
        return []
      }
    }

    const [categories, subcategories, software] = await Promise.all([
      fetchUniqueValues('category'),
      fetchUniqueValues('subcategory'),
      fetchUniqueValues('software'),
    ])

    filterOptions = {
      category: categories,
      subcategory: subcategories,
      software: software,
    }
  } catch (e) {
    console.error('Error loading resources:', e)
    error = 'Failed to load resources. Please try again later.'
  }

  return (
    <div className="min-h-screen bg-background">
      {error && (
        <div className="text-destructive text-center py-4 px-4 bg-destructive/10 rounded-lg mx-4 my-4">
          {error}
        </div>
      )}
      <ResourcesClient
        resources={resources}
        filterOptions={filterOptions}
      />
    </div>
  )
}
