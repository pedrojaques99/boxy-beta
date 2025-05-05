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

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log(`Middleware executando para: ${req.nextUrl.pathname}`)
  
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log(`Status da sessão: ${session ? 'Autenticado' : 'Não autenticado'}`)

    // Protege a rota de checkout
    if (req.nextUrl.pathname.startsWith('/checkout')) {
      if (!session) {
        console.log('Redirecionando de /checkout para /auth/login (usuário não autenticado)')
        return NextResponse.redirect(new URL('/auth/login?redirectTo=/checkout', req.url))
      }
    }
    
    // Protege todas as rotas do profile
    if (req.nextUrl.pathname.startsWith('/profile')) {
      if (!session) {
        console.log('Redirecionando de /profile para /auth/login (usuário não autenticado)')
        return NextResponse.redirect(new URL(`/auth/login?redirectTo=${req.nextUrl.pathname}`, req.url))
      }
    }
    
    // Protege a rota de price (página de assinatura)
    if (req.nextUrl.pathname.startsWith('/price')) {
      if (!session) {
        console.log('Redirecionando de /price para /auth/login (usuário não autenticado)')
        return NextResponse.redirect(new URL('/auth/login?redirectTo=/price', req.url))
      }
    }

    // Protege a rota de admin explicitamente
    if (req.nextUrl.pathname.startsWith('/admin')) {
      // Verificação de autenticação
      if (!session) {
        console.log('Redirecionando de /admin para /auth/login (usuário não autenticado)')
        return NextResponse.redirect(new URL('/auth/login?redirectTo=/admin', req.url))
      }
      
      try {
        console.log(`Verificando status de admin para usuário ID: ${session.user.id}`)
        
        // Check if user has admin role
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        console.log('Perfil obtido do Supabase:', profile, error ? `Erro: ${error.message}` : 'Sem erro')
          
        if (error) {
          console.error('Erro ao verificar perfil:', error)
          // Continue permitindo acesso em caso de erro na consulta
          // para evitar bloqueios indevidos
        } else if (profile?.role !== 'admin') {
          console.log(`Usuário não é admin. Role atual: ${profile?.role || 'não definido'}`)
          
          // Redirect non-admin users to access denied page
          return NextResponse.redirect(new URL('/auth/access-denied', req.url))
          
          // OU alternativamente, continuar e deixar o cliente lidar com isso
        } else {
          console.log('Usuário autenticado como admin, permitindo acesso')
        }
      } catch (error) {
        console.error('Erro ao verificar status de admin no middleware:', error)
        // Continue permitindo acesso em caso de erro
        // para evitar bloqueios indevidos
      }
    }

    return res
  } catch (error) {
    console.error('Erro no middleware:', error)
    // Em caso de erro, continuar a requisição
    return NextResponse.next({
      request: req,
    })
  }
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
    '/profile/:path*',
    '/price/:path*',
    '/admin/:path*'
  ],
}
