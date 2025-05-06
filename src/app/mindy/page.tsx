import { getDictionary } from '@/i18n'
import { i18n } from '@/i18n/settings'
import { ResourcesClient } from './client'
import { createClient } from '@/lib/supabase/server'

export default async function ResourcesPage() {
  const supabase = await createClient()
  const t = await getDictionary(i18n.defaultLocale)

  // Get unique values for filters
  async function fetchUniqueValues(column: string): Promise<string[]> {
    const { data } = await supabase
      .from('resources')
      .select(column)
      .not(column, 'is', null)
    if (!data) return []
    return [...new Set(data.map((item: any) => item[column]).filter(Boolean))]
  }

  const [categories, subcategories, software] = await Promise.all([
    fetchUniqueValues('category'),
    fetchUniqueValues('subcategory'),
    fetchUniqueValues('software')
  ])

  // Get resources
  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })

  const filterOptions = {
    category: categories as string[],
    subcategory: subcategories as string[],
    software: software as string[]
  }

  return (
    <ResourcesClient resources={resources || []} filterOptions={filterOptions} />
  )
}
