import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()

  if (!query) {
    return NextResponse.json({ products: [] })
  }

  const { data, error } = await supabase
    .from('products')
    .select('id, name, thumb, description, category, software')
    .textSearch('search_vector', query, {
      type: 'plain',
      config: 'portuguese'
    })
    .limit(20)

  if (error) {
    console.error('🔴 Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }

  return NextResponse.json({ products: data })
}