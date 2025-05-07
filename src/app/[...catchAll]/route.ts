import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: Request, 
  { params }: { params: { catchAll: string[] } }
) {
  const path = params.catchAll.join('/')
  
  // If this is a mindy or shop route, handle it dynamically
  if (path === 'mindy' || path === 'shop') {
    // Redirect to the actual page
    return NextResponse.redirect(new URL(`/${path}`, request.url))
  }
  
  // For other routes, return a 404 response
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
} 