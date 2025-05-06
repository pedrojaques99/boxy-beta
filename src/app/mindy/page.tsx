import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ResourcesClient } from './client'

export const dynamic = 'force-dynamic'

interface Resource {
  id: string
  title: string
  url: string
  tags: string[]
  category: string
  subcategory: string
  created_at: string
  description_pt: string
  description_en: string
}

export default async function ResourcesPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: categories } = await supabase
    .from('resources')
    .select('category')
    .not('category', 'is', null)
    .order('category')

  const { data: subcategories } = await supabase
    .from('resources')
    .select('subcategory')
    .not('subcategory', 'is', null)
    .order('subcategory')

  const { data: software } = await supabase
    .from('resources')
    .select('software')
    .not('software', 'is', null)
    .order('software')

  const filterOptions = {
    category: [...new Set(categories?.map(c => c.category) || [])],
    subcategory: [...new Set(subcategories?.map(s => s.subcategory) || [])],
    software: [...new Set(software?.map(s => s.software) || [])]
  }

  return <ResourcesClient resources={resources || []} filterOptions={filterOptions} />
}
