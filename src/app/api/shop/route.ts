import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const software = searchParams.get('software')

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build the query
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })

    // Apply filters if they exist
    if (type) {
      query = query.eq('type', type)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (software) {
      query = query.eq('software', software)
    }

    // Add pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    // Execute the query
    const { data: products, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      products,
      total: count,
      page,
      limit,
      hasMore: count ? offset + limit < count : false
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
} 