import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()

  if (!query) {
    return NextResponse.json({ resources: [] })
  }

  const { data, error } = await supabase
    .from('resources')
    .select('id, title, url, thumbnail_url, description, category, subcategory, software')
    .textSearch('search_vector', query, {
      type: 'plain',
      config: 'portuguese'
    })
    .limit(20)

  if (error) {
    console.error('🔴 Error fetching resources:', error)
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }

  return NextResponse.json({ resources: data })
}
