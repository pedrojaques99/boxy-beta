import { createClient } from '@/lib/supabase/server'
import { ResourcesClient } from './client'
import { getTranslations } from 'next-intl/server'
import { Database } from '@/types/supabase'
import { ErrorBoundary } from '@/components/error-boundary'

console.log('[MINDY] Início do arquivo page.tsx')

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ResourceRow = Database['public']['Tables']['resources']['Row']

async function fetchUniqueValues(table: string, column: keyof ResourceRow): Promise<string[]> {
  try {
    console.log(`[MINDY] fetchUniqueValues: table=${table}, column=${column}`)
    const supabase = await createClient()
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .not(column, 'is', null)
      .eq('approved', true)
    
    if (error) {
      console.error(`[MINDY] Error fetching unique ${column} values:`, error)
      return []
    }
    
    if (!data || !Array.isArray(data)) {
      console.warn(`[MINDY] fetchUniqueValues: No data for ${column}`)
      return []
    }
    
    // Type assertion to ensure we're working with the correct type
    const typedData = data as Array<Pick<ResourceRow, typeof column>>
    const result = [...new Set(typedData.map(item => String(item[column])))] as string[]
    console.log(`[MINDY] fetchUniqueValues: result for ${column}:`, result)
    return result
  } catch (error) {
    console.error(`[MINDY] Error in fetchUniqueValues for ${column}:`, error)
    return []
  }
}

export default async function ResourcesPage() {
  console.log('[MINDY] ResourcesPage: início')
  let t
  try {
    t = await getTranslations('mindy')
    console.log('[MINDY] Traduções carregadas')
  } catch (err) {
    console.error('[MINDY] Erro ao carregar traduções:', err)
    throw err
  }
  
  try {
    const supabase = await createClient()
    console.log('[MINDY] Supabase client criado')

    // Fetch resources with error handling
    const { data: resourcesData, error: resourcesError } = await supabase
      .from('resources')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false })

    if (resourcesError) {
      console.error('[MINDY] Erro ao buscar resources:', resourcesError)
      throw new Error('Failed to fetch resources')
    }

    if (!resourcesData || !Array.isArray(resourcesData)) {
      console.error('[MINDY] Dados de resources inválidos:', resourcesData)
      throw new Error('Invalid resources data received')
    }

    console.log('[MINDY] Resources recebidos:', resourcesData.length)

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

    console.log('[MINDY] Resources transformados:', resources.length)

    // Fetch filter options with error handling
    const [categories, subcategories, software] = await Promise.all([
      fetchUniqueValues('resources', 'category'),
      fetchUniqueValues('resources', 'subcategory'),
      fetchUniqueValues('resources', 'software')
    ])

    console.log('[MINDY] Filtros carregados:', { categories, subcategories, software })

    const filterOptions = {
      category: categories,
      subcategory: subcategories,
      software: software
    }

    console.log('[MINDY] Antes de retornar ResourcesClient')
    // return (
    //   <ErrorBoundary>
    //     <ResourcesClient 
    //       resources={resources} 
    //       filterOptions={filterOptions}
    //     />
    //   </ErrorBoundary>
    // )
    return <div>Testando Mindy</div>
  } catch (error) {
    console.error('[MINDY] Erro no ResourcesPage:', error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground">
            {t && t('errors.loadingError')}
          </p>
        </div>
      </div>
    )
  }
}
