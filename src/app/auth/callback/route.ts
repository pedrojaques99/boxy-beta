import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { handleError } from '@/lib/error-handler'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const redirectTo = searchParams.get('redirectTo') || '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  console.log('OAuth callback initiated:', {
    code,
    state,
    error,
    errorDescription,
    redirectTo,
    origin
  })

  // Handle OAuth errors
  if (error) {
    console.error('Erro de autenticação recebido:', { error, errorDescription })
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`)
  }

  // Validate state
  const cookieStore = cookies()
  const storedState = cookieStore.get('oauth_state')?.value
  const stateTimestamp = cookieStore.get('oauth_state_timestamp')?.value

  // Log state validation details
  console.log('State validation details:', {
    receivedState: state,
    storedState,
    stateTimestamp,
    stateAge: stateTimestamp ? Date.now() - parseInt(stateTimestamp) : null
  })

  // Log cookie management
  console.log('Cookie management:', {
    oauthStateCookie: cookieStore.get('oauth_state'),
    oauthStateTimestampCookie: cookieStore.get('oauth_state_timestamp')
  })

  // Enhanced state validation
  if (!state || !storedState) {
    console.error('Missing OAuth state:', { received: state, stored: storedState })
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent('Missing OAuth state')}`)
  }

  if (state !== storedState) {
    console.error('OAuth state mismatch:', { received: state, stored: storedState })
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent('OAuth state mismatch')}`)
  }

  // Check if state is expired (older than 10 minutes)
  if (stateTimestamp) {
    const stateAge = Date.now() - parseInt(stateTimestamp)
    if (stateAge > 10 * 60 * 1000) {
      console.error('OAuth state expired:', { age: stateAge })
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent('OAuth state expired')}`)
    }
  }

  if (!code) {
    console.error('Nenhum código de autorização recebido')
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent('No authorization code received')}`)
  }

  try {
    console.log('Iniciando troca de código por sessão')
    const supabase = await createClient()
    
    // Exchange code for session
    const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Resultado da troca de código:', { 
      success: !authError, 
      error: authError ? authError.message : null,
      userData: data?.user ? {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role
      } : null
    })
    
    if (authError) {
      const { error: errorMessage } = handleError(authError, 'Auth error');
      console.error('Erro ao trocar código por sessão:', errorMessage);
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(errorMessage)}`)
    }

    // Clear the state cookies after successful authentication
    const response = NextResponse.redirect(`${origin}${redirectTo}`)
    response.cookies.delete('oauth_state')
    response.cookies.delete('oauth_state_timestamp')

    // Add debug cookies
    response.cookies.set('auth_debug', 'callback_completed', {
      path: '/',
      maxAge: 60 * 5, // 5 minutes
      httpOnly: false,
      sameSite: 'lax',
      secure: true
    });
    
    response.cookies.set('auth_timestamp', Date.now().toString(), {
      path: '/',
      maxAge: 60 * 5, // 5 minutes
      httpOnly: false,
      sameSite: 'lax',
      secure: true
    });

    // Verificar se é um usuário novo e criar perfil, se necessário
    if (data?.user) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') {
          // Perfil não existe, vamos criar
          console.log('Criando perfil para novo usuário:', data.user.id)
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: data.user.id, 
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '',
                avatar_url: data.user.user_metadata?.avatar_url || '',
                role: 'user'
              }
            ])

          if (insertError) {
            console.error('Erro ao criar perfil:', insertError)
          } else {
            console.log('Perfil criado com sucesso')
          }
        } else {
          console.log('Perfil já existe, login normal')
        }
      } catch (profileError) {
        console.error('Erro ao verificar/criar perfil:', profileError)
      }
    }

    // Get the forwarded host in case we're behind a load balancer
    const forwardedHost = request.headers.get('x-forwarded-host')
    const host = request.headers.get('host')
    
    // Determine the correct base URL
    let baseUrl = origin
    
    // For local development, always use the original origin URL
    const isLocalDevelopment = host?.includes('localhost') || host?.includes('127.0.0.1')
    
    if (process.env.NODE_ENV === 'production' && !isLocalDevelopment) {
      // In production, always use the production domain (but not for localhost)
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boxy-beta.vercel.app'
    } else if (forwardedHost && !isLocalDevelopment) {
      // If we're behind a load balancer, use the forwarded host (but not for localhost)
      baseUrl = `https://${forwardedHost}`
    } else if (host && !isLocalDevelopment) {
      // Fallback to the host header (but not for localhost)
      baseUrl = `https://${host}`
    }
    
    // For localhost, always preserve the original origin
    if (isLocalDevelopment) {
      console.log('Detected localhost environment, preserving original origin:', origin)
      baseUrl = origin
    }

    console.log('Redirecionando para:', `${baseUrl}${redirectTo}`)
    // Redirect to the specified path or homepage
    const redirectResponse = NextResponse.redirect(`${baseUrl}${redirectTo}`)
    
    // Add debug cookies
    redirectResponse.cookies.set('auth_debug', 'callback_completed', {
      path: '/',
      maxAge: 60 * 5, // 5 minutes
      httpOnly: false,
      sameSite: 'lax'
    });
    
    redirectResponse.cookies.set('auth_timestamp', Date.now().toString(), {
      path: '/',
      maxAge: 60 * 5, // 5 minutes
      httpOnly: false,
      sameSite: 'lax'
    });
    
    return redirectResponse
  } catch (error) {
    const { error: errorMessage } = handleError(error, 'Unexpected error in auth callback');
    console.error('Erro inesperado no callback de autenticação:', errorMessage);
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(errorMessage)}`)
  }
} 