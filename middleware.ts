import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { i18n } from '@/i18n/settings'

// Get the preferred locale, similar to above or using a different method
function getLocale(request: NextRequest) {
  const acceptLanguage = request.headers.get('accept-language')
  if (!acceptLanguage) return i18n.defaultLocale
  
  const preferredLocale = acceptLanguage
    .split(',')[0]
    .split('-')
    .join('-')
    
  return i18n.locales.includes(preferredLocale as any) 
    ? preferredLocale 
    : i18n.defaultLocale
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // Handle Supabase Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check if the user is authenticated for protected routes
    if (
      !user &&
      !request.nextUrl.pathname.startsWith('/login') &&
      !request.nextUrl.pathname.startsWith('/auth')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    // Handle i18n: Add locale to headers for server components
    const locale = getLocale(request)
    response.headers.set('x-locale', locale)

    return response
  } catch (error) {
    console.error('Error in middleware:', error)
    return response
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 