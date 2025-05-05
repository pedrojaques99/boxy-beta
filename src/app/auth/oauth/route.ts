import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const host = request.headers.get('host')
      const isLocalDevelopment = host?.includes('localhost') || host?.includes('127.0.0.1')
      
      // For localhost, always use original origin
      if (isLocalDevelopment) {
        console.log('Detected localhost environment, preserving original origin:', origin)
        const redirectResponse = NextResponse.redirect(`${origin}${next}`)
        
        // Adicione cookies de debug
        redirectResponse.cookies.set('auth_debug', 'oauth_localhost_completed', {
          path: '/',
          maxAge: 60 * 5, // 5 minutes
          httpOnly: false,
          sameSite: 'lax'
        });
        
        return redirectResponse
      } else if (process.env.NODE_ENV === 'production') {
        // In production, check for forwarded host
        if (forwardedHost) {
          const redirectResponse = NextResponse.redirect(`https://${forwardedHost}${next}`)
          
          // Adicione cookies de debug
          redirectResponse.cookies.set('auth_debug', 'oauth_production_forwarded_completed', {
            path: '/',
            maxAge: 60 * 5, // 5 minutes
            httpOnly: false,
            sameSite: 'lax'
          });
          
          return redirectResponse
        } else {
          // Use the SITE_URL if defined, otherwise fall back to origin
          const productionUrl = process.env.NEXT_PUBLIC_SITE_URL
          const redirectResponse = NextResponse.redirect(`${productionUrl || origin}${next}`)
          
          // Adicione cookies de debug
          redirectResponse.cookies.set('auth_debug', 'oauth_production_url_completed', {
            path: '/',
            maxAge: 60 * 5, // 5 minutes
            httpOnly: false,
            sameSite: 'lax'
          });
          
          return redirectResponse
        }
      } else {
        // Default fallback
        const redirectResponse = NextResponse.redirect(`${origin}${next}`)
        
        // Adicione cookies de debug
        redirectResponse.cookies.set('auth_debug', 'oauth_default_completed', {
          path: '/',
          maxAge: 60 * 5, // 5 minutes
          httpOnly: false,
          sameSite: 'lax'
        });
        
        return redirectResponse
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`)
}
