import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()

  if (!query) {
    return NextResponse.json({ resources: [] })
  }

  try {
    // First try searching using the search_vector
    let { data: vectorResults, error: vectorError } = await supabase
      .from('resources')
      .select('id, title, url, thumbnail_url, description, category, subcategory, software')
      .textSearch('search_vector', query, {
        type: 'websearch',
        config: 'portuguese'
      })
      .limit(20)

    if (vectorError) {
      console.error('Vector search error:', vectorError)
    }

    // If no results from vector search or error, try fallback search
    if (!vectorResults?.length) {
      const { data: fallbackResults, error: fallbackError } = await supabase
        .from('resources')
        .select('id, title, url, thumbnail_url, description, category, subcategory, software')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,software.ilike.%${query}%`)
        .limit(20)

      if (fallbackError) {
        console.error('Fallback search error:', fallbackError)
        return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
      }

      return NextResponse.json({ resources: fallbackResults || [] })
    }

    return NextResponse.json({ resources: vectorResults })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}
