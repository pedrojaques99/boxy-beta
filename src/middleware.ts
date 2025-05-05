import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protege a rota de checkout
  if (req.nextUrl.pathname.startsWith('/checkout')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }

  // Protege a rota de admin explicitamente
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login?redirectTo=/admin', req.url))
    }
    
    try {
      // Check if user has admin role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
        
      if (error || profile?.role !== 'admin') {
        console.error('Admin access denied:', error || 'User is not an admin')
        // Don't redirect, let the client-side handle the display for non-admins
      }
    } catch (error) {
      console.error('Error checking admin status in middleware:', error)
      // Let the client-side handle errors
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
    '/checkout/:path*',
    '/profile/subscription/:path*',
    '/admin/:path*'
  ],
}
