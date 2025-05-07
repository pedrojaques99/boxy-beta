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
    // Just pass through to the actual page
    return NextResponse.next()
  }
  
  // For other routes, continue normal processing
  return NextResponse.next()
} 