import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent('No authorization code received')}`)
  }

  try {
    const supabase = await createClient()
    const { error: authError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(authError.message)}`)
    }

    // Get the forwarded host in case we're behind a load balancer
    const forwardedHost = request.headers.get('x-forwarded-host')
    const host = request.headers.get('host')
    
    // Determine the correct base URL
    let baseUrl = origin
    
    if (process.env.NODE_ENV === 'production') {
      // In production, always use the production domain
      baseUrl = 'https://boxy-beta.vercel.app'
    } else if (forwardedHost) {
      // If we're behind a load balancer, use the forwarded host
      baseUrl = `https://${forwardedHost}`
    } else if (host) {
      // Fallback to the host header
      baseUrl = `https://${host}`
    }

    // Ensure next path starts with a slash
    const nextPath = next.startsWith('/') ? next : `/${next}`

    return NextResponse.redirect(`${baseUrl}${nextPath}`)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent('An unexpected error occurred')}`)
  }
} 