import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { handleError } from '@/lib/error-handler'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Always redirect to homepage after successful login
  const next = '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  console.log('Auth callback iniciado:', { code, error, errorDescription })

  // Handle OAuth errors
  if (error) {
    console.error('Erro de autenticação recebido:', { error, errorDescription })
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`)
  }

  if (!code) {
    console.error('Nenhum código de autorização recebido')
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent('No authorization code received')}`)
  }

  try {
    console.log('Iniciando troca de código por sessão')
    const supabase = await createClient()
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
    
    if (process.env.NODE_ENV === 'production') {
      // In production, always use the production domain
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boxy-beta.vercel.app'
    } else if (forwardedHost) {
      // If we're behind a load balancer, use the forwarded host
      baseUrl = `https://${forwardedHost}`
    } else if (host) {
      // Fallback to the host header
      baseUrl = `https://${host}`
    }

    console.log('Redirecionando para:', `${baseUrl}/`)
    // Redirect to homepage
    return NextResponse.redirect(`${baseUrl}/`)
  } catch (error) {
    const { error: errorMessage } = handleError(error, 'Unexpected error in auth callback');
    console.error('Erro inesperado no callback de autenticação:', errorMessage);
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(errorMessage)}`)
  }
} 