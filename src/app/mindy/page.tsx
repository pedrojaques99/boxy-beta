import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/supabase'
import { ResourcesClient } from './client'

console.log('[MINDY] Início do arquivo page.tsx')

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ResourceRow = Pick<Database['public']['Tables']['resources']['Row'], 'id' | 'title' | 'description'>

export default async function ResourcesPage() {
  const supabase = await createClient()
  const { data: resourcesData, error } = await supabase
    .from('resources')
    .select('id, title, description')
    .eq('approved', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[MINDY] Erro ao buscar resources:', error)
    return <div className="container mx-auto px-4 py-8">Erro ao carregar recursos.</div>
  }

  if (!resourcesData || !Array.isArray(resourcesData)) {
    return <div className="container mx-auto px-4 py-8">Nenhum recurso encontrado.</div>
  }

  return <ResourcesClient resources={resourcesData} />
}
