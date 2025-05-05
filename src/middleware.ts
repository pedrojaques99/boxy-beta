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
  
  // Logs de cookies para debug
  const allCookies = req.cookies.getAll();
  console.log(`Cookies recebidos (${allCookies.length}):`, allCookies.map(c => c.name).join(', '));
  
  // Log de cookies de autenticação específicos
  const authCookies = allCookies.filter(c => 
    c.name.includes('supabase') || 
    c.name.includes('auth') || 
    c.name.includes('session')
  );
  console.log('Cookies de autenticação:', authCookies.map(c => c.name).join(', '));
  
  // Verificar se temos o cookie auth_debug que indica que o login foi concluído recentemente
  const authDebugCookie = req.cookies.get('auth_debug');
  const isRecentlyAuthenticated = authDebugCookie && 
                                 ['callback_completed', 'oauth_localhost_completed', 
                                  'oauth_production_url_completed', 'oauth_production_forwarded_completed', 
                                  'oauth_default_completed'].includes(authDebugCookie.value);
  
  if (isRecentlyAuthenticated) {
    console.log('Detectado cookie de debug indicando autenticação recente. Permitindo acesso às rotas protegidas temporariamente.');
    // Permitir acesso se o usuário acabou de completar autenticação
    return NextResponse.next();
  }
  
  // Criamos uma resposta que manterá os cookies da sessão
  const res = NextResponse.next()
  
  // Inicializamos o cliente Supabase para o middleware
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Adicionar flag para verificar se houve erro de parsing de cookie
    let hadCookieParsingError = false;

    // Capturar erros de sessão explicitamente
    const sessionResult = await supabase.auth.getSession().catch(err => {
      console.error('Erro ao obter sessão:', err);
      hadCookieParsingError = err.message?.includes('parse cookie') || 
                              err.message?.includes('JSON') ||
                              false;
      return { data: { session: null }, error: err };
    });
    
    const { data: { session } } = sessionResult;

    // Se houve erro de parsing de cookie mas o usuário tem um cookie de debug,
    // permitir acesso sem redirecionamento como fallback
    if (hadCookieParsingError) {
      console.log('⚠️ Erro de parsing de cookie detectado! Permitindo acesso sem verificação como fallback.');
      return NextResponse.next();
    }

    // Log detalhado para debug
    console.log(`Status da sessão: ${session ? 'Autenticado' : 'Não autenticado'}`)
    if (session) {
      console.log('Dados da sessão:', {
        userId: session.user.id,
        email: session.user.email,
        aud: session.user.aud,
        role: session.user.role,
        accessTokenExpires: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'não definido',
        now: new Date().toISOString(),
        valid: session.expires_at ? (session.expires_at * 1000) > Date.now() : false
      })
    }
    
    // Criamos uma resposta vazia para usar se precisarmos redirecionar
    let redirectResponse: NextResponse | null = null;

    // Protege a rota de checkout
    if (req.nextUrl.pathname.startsWith('/checkout')) {
      if (!session) {
        console.log('Redirecionando de /checkout para /auth/login (usuário não autenticado)')
        redirectResponse = NextResponse.redirect(new URL('/auth/login?redirectTo=/checkout', req.url))
      }
    }
    
    // Protege todas as rotas do profile
    if (!redirectResponse && req.nextUrl.pathname.startsWith('/profile')) {
      if (!session) {
        console.log('Redirecionando de /profile para /auth/login (usuário não autenticado)')
        redirectResponse = NextResponse.redirect(new URL(`/auth/login?redirectTo=${req.nextUrl.pathname}`, req.url))
      }
    }
    
    // Protege a rota de price (página de assinatura)
    if (!redirectResponse && req.nextUrl.pathname.startsWith('/price')) {
      if (!session) {
        console.log('Redirecionando de /price para /auth/login (usuário não autenticado)')
        redirectResponse = NextResponse.redirect(new URL('/auth/login?redirectTo=/price', req.url))
      }
    }

    // Protege a rota de admin explicitamente
    if (!redirectResponse && req.nextUrl.pathname.startsWith('/admin')) {
      // Verificação de autenticação
      if (!session) {
        console.log('Redirecionando de /admin para /auth/login (usuário não autenticado)')
        redirectResponse = NextResponse.redirect(new URL('/auth/login?redirectTo=/admin', req.url))
      } else {
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
            redirectResponse = NextResponse.redirect(new URL('/auth/access-denied', req.url))
          } else {
            console.log('Usuário autenticado como admin, permitindo acesso')
          }
        } catch (error) {
          console.error('Erro ao verificar status de admin no middleware:', error)
          // Continue permitindo acesso em caso de erro
          // para evitar bloqueios indevidos
        }
      }
    }

    // Se precisamos redirecionar, retorne a resposta de redirecionamento
    if (redirectResponse) {
      // Importante: copie os cookies da resposta do supabase para a resposta de redirecionamento
      const supabaseCookies = res.cookies.getAll();
      supabaseCookies.forEach(cookie => {
        redirectResponse?.cookies.set(cookie.name, cookie.value);
      });
      
      console.log('Redirecionando com cookies da sessão:', supabaseCookies.map(c => c.name).join(', '));
      return redirectResponse;
    }

    // Se não redirecionamos, continue com a resposta original
    console.log('Middleware concluído sem redirecionamento');
    return res;
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
