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
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    
    // Determine the correct base URL
    const baseUrl = forwardedHost 
      ? `${protocol}://${forwardedHost}`
      : origin

    // Ensure next path starts with a slash
    const nextPath = next.startsWith('/') ? next : `/${next}`

    return NextResponse.redirect(`${baseUrl}${nextPath}`)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent('An unexpected error occurred')}`)
  }
} 