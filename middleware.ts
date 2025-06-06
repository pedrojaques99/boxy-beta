/**
 * Middleware for authentication and authorization
 * 
 * This middleware protects routes that require authentication:
 * - /profile/* - User profile and settings
 * - /price/* - Subscription pricing and management
 * - /checkout/* - Payment processing
 * - /admin/* - Admin dashboard (also requires admin role)
 * 
 * When a user tries to access a protected route without authentication,
 * they are redirected to the login page with the original URL as a redirectTo parameter.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware';
import { i18n } from './src/i18n/settings';

// Create the next-intl middleware
const intlMiddleware = createIntlMiddleware({
  locales: i18n.locales,
  defaultLocale: i18n.defaultLocale,
  localePrefix: 'as-needed'
});

export async function middleware(req: NextRequest) {
  // Skip all logic for 404 and not-found routes to prevent reload loop
  if (
    req.nextUrl.pathname === '/404' ||
    req.nextUrl.pathname === '/not-found'
  ) {
    return NextResponse.next();
  }

  // Handle internationalization first
  const response = intlMiddleware(req);
  
  // Skip auth check for the OAuth callback and other auth-related paths
  // This prevents interference with the OAuth flow
  if (
    req.nextUrl.pathname.startsWith('/auth/oauth') || 
    req.nextUrl.pathname === '/auth/callback' ||
    req.nextUrl.pathname.includes('callback')
  ) {
    return response;
  }
  
  // Create the Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Create an auth service to use
  const authService = supabase.auth

  try {
    // Get the session - this refresh the session if needed
    const { data: { session } } = await authService.getSession()

    // Handle protected routes
    const isAuthRoute = req.nextUrl.pathname.startsWith('/auth')
    const isPublicRoute = 
      req.nextUrl.pathname === '/' || 
      req.nextUrl.pathname.startsWith('/_next') ||
      req.nextUrl.pathname.startsWith('/api') ||
      req.nextUrl.pathname.startsWith('/public')
    
    // Check for routes that require authentication
    const needsAuth = 
      req.nextUrl.pathname.startsWith('/profile') ||
      req.nextUrl.pathname.startsWith('/checkout') ||
      req.nextUrl.pathname.startsWith('/price')
      
    // Check for admin routes
    const needsAdmin = req.nextUrl.pathname.startsWith('/admin')
    
    // If user is not authenticated and the route needs auth, redirect to login
    if (needsAuth && !session) {
      const redirectUrl = new URL('/auth/login', req.url)
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Handle admin access
    if (needsAdmin) {
      if (!session) {
        const redirectUrl = new URL('/auth/login', req.url)
        redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
      
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
        
      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/auth/access-denied', req.url))
      }
    }
    
    // If user is authenticated and trying to access login/signup, redirect to profile
    if (session && isAuthRoute && 
        (req.nextUrl.pathname === '/auth/login' || req.nextUrl.pathname === '/auth/signup')) {
      return NextResponse.redirect(new URL('/profile', req.url))
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all routes except for:
     * - API routes
     * - /_next (Next.js internals)
     * - /_vercel (Vercel internals)
     * - /_static (static files)
     * - /favicon.ico, /sitemap.xml, /robots.txt (static files)
     */
    '/((?!api|_next|_vercel|_static|favicon.ico|sitemap.xml|robots.txt).*)'
  ],
} 