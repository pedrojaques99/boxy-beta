import { getDictionary } from '@/i18n'
import { i18n } from '@/i18n/settings'
import { ResourcesClient } from './client'
import { createClient } from '@/lib/supabase/server'
import { Dictionary } from '@/i18n/types'

export default async function ResourcesPage() {
  const supabase = await createClient()
  let resources: any[] = []
  let filterOptions: { category: string[]; subcategory: string[]; software: string[] } = { category: [], subcategory: [], software: [] }
  let error = null

  try {
    // Fetch resources
    const { data: resourcesData, error: resourcesError } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })

    if (resourcesError) throw resourcesError

    // Defensive mapping
    resources = (resourcesData || []).map((resource: any) => ({
      id: String(resource.id),
      title: String(resource.title || ''),
      url: String(resource.url || ''),
      tags: Array.isArray(resource.tags)
        ? resource.tags.filter(Boolean)
        : typeof resource.tags === 'string'
          ? resource.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : [],
      category: String(resource.category || ''),
      subcategory: String(resource.subcategory || ''),
      software: String(resource.software || ''),
      created_at: String(resource.created_at || ''),
      description: String(resource.description || ''),
      description_en: String(resource.description_en || ''),
    }))

    // Fetch filter options
    const fetchUniqueValues = async (column: string): Promise<string[]> => {
      const { data, error } = await supabase
        .from('resources')
        .select(column)
        .not(column, 'is', null)
      if (error) return []
      return [...new Set((data || []).map((item: any) => String(item[column])).filter(Boolean))]
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
    error = 'Failed to load resources.'
  }

  // const t: Dictionary = await getDictionary(i18n.defaultLocale)

  return (
    <div>
      {error && (
        <div className="text-red-500 text-center py-4">{error}</div>
      )}
      <ResourcesClient
        resources={Array.isArray(resources) ? resources : []}
        filterOptions={filterOptions}
      />
    </div>
  )
}
