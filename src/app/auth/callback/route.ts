import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get the forwarded host in case we're behind a load balancer
      const forwardedHost = request.headers.get('x-forwarded-host')
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
      
      // Determine the correct base URL
      const baseUrl = forwardedHost 
        ? `${protocol}://${forwardedHost}`
        : origin

      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
} 