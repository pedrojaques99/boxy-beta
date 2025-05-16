import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'
import { AuthErrorCategory } from '@/lib/auth/auth-errors'

// Tipos de erro OAuth mais comuns para melhor diagnóstico
const OAUTH_ERROR_TYPES = {
  INVALID_REQUEST: 'invalid_request',
  BAD_OAUTH_STATE: 'bad_oauth_state',
  INVALID_TOKEN: 'invalid_token',
  MISSING_CODE: 'missing_code',
  EXCHANGE_ERROR: 'exchange_error',
  UNEXPECTED: 'unexpected'
};

// Função para registrar erros com detalhes consistentes
function logOAuthError(type: string, details: any) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [OAuth Error] [${type}]`, details);
  
  // Aqui poderia ser adicionada integração com serviço externo de monitoramento
  // como Sentry, LogRocket, etc.
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  // Registrar informações de diagnóstico para qualquer chamada à rota
  console.log('OAuth callback received', { 
    hasCode: !!code, 
    hasError: !!error,
    referer: request.headers.get('referer'),
    origin: origin 
  });

  // Se há erro do provedor OAuth, registrar e redirecionar para página de erro
  if (error) {
    const errorType = error === OAUTH_ERROR_TYPES.BAD_OAUTH_STATE ? 
      AuthErrorCategory.OAUTH_STATE_INVALID : 
      AuthErrorCategory.OAUTH_CALLBACK_ERROR;
    
    logOAuthError(errorType, {
      error, 
      errorDescription,
      origin,
      referer: request.headers.get('referer'),
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`);
  }

  // Process code exchange if present
  if (code) {
    const supabase = await createClient()
    
    try {
      console.log('Exchanging code for session...');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        logOAuthError(OAUTH_ERROR_TYPES.EXCHANGE_ERROR, {
          errorMessage: error.message,
          errorCode: error.status,
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(OAUTH_ERROR_TYPES.EXCHANGE_ERROR)}&error_description=${encodeURIComponent(error.message)}`);
      }
      
      // Successfully authenticated, redirect based on environment
      const forwardedHost = request.headers.get('x-forwarded-host')
      const host = request.headers.get('host')
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      const isLocalDevelopment = host?.includes('localhost') || host?.includes('127.0.0.1')
      
      // Determine the correct base URL for redirect
      let baseUrl = origin
      
      if (isLocalDevelopment) {
        console.log('Local development detected, using origin:', origin)
        baseUrl = origin
      } else if (process.env.NODE_ENV === 'production') {
        if (forwardedHost) {
          baseUrl = `${protocol}://${forwardedHost}`
          console.log('Production with forwarded host, using:', baseUrl)
        } else if (process.env.NEXT_PUBLIC_SITE_URL) {
          baseUrl = process.env.NEXT_PUBLIC_SITE_URL
          console.log('Production with SITE_URL, using:', baseUrl)
        }
      }
      
      // Add debug info to the response
      const redirectUrl = `${baseUrl}${next}`
      console.log('OAuth authentication successful, redirecting to:', redirectUrl)
      
      const response = NextResponse.redirect(redirectUrl)
      
      // Add debug cookies with short expiry
      response.cookies.set('auth_success', 'true', {
        path: '/',
        maxAge: 60 * 5, // 5 minutes
        httpOnly: false,
        sameSite: 'lax'
      })
      
      // Adicionar um cookie com timestamp para análise
      response.cookies.set('auth_timestamp', Date.now().toString(), {
        path: '/',
        maxAge: 60 * 5, // 5 minutes
        httpOnly: false,
        sameSite: 'lax'
      })
      
      return response
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      
      logOAuthError(OAUTH_ERROR_TYPES.UNEXPECTED, {
        error: errorMessage,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(OAUTH_ERROR_TYPES.UNEXPECTED)}&error_description=${encodeURIComponent(errorMessage)}`);
    }
  }

  // No code or error, redirect to login page with error
  logOAuthError(OAUTH_ERROR_TYPES.MISSING_CODE, {
    searchParams: Object.fromEntries(searchParams.entries()),
    timestamp: new Date().toISOString()
  });
  
  return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(OAUTH_ERROR_TYPES.MISSING_CODE)}`);
}
