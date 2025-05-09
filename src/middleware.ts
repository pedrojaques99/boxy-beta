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

// Supported image content types
const supportedContentTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
}

export async function middleware(req: NextRequest) {
  // Create a response object that we can modify
  let res = NextResponse.next()

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
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
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
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
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

    // Handle image optimization for /mindy and /shop routes
    const { pathname } = req.nextUrl
    if (pathname.startsWith('/mindy') || pathname.startsWith('/shop')) {
      // Add cache headers
      res = NextResponse.next()
      
      // Cache successful requests for 1 hour at the edge, 1 day in the browser
      res.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=3600, stale-while-revalidate=604800')
      
      // Add security headers
      res.headers.set('X-Content-Type-Options', 'nosniff')
      res.headers.set('X-Frame-Options', 'DENY')
      res.headers.set('X-XSS-Protection', '1; mode=block')
      
      return res
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all protected routes and auth routes:
     * - /profile/*
     * - /checkout/*
     * - /price/*
     * - /admin/*
     * - /auth/*
     */
    '/profile/:path*',
    '/checkout/:path*',
    '/price/:path*',
    '/admin/:path*',
    '/auth/:path*',
    '/mindy/:path*',
    '/shop/:path*',
  ],
}
