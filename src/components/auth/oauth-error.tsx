'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthErrorMessage } from '../ui/auth-error-message'
import { AuthErrorCategory } from '@/lib/auth/auth-errors'

/**
 * Componente para exibir erros específicos de OAuth com sugestões de ação
 */
export function OAuthErrorDisplay() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // Se não houver erro, não renderizar nada
  if (!error) return null
  
  // Mapear o código de erro para uma categoria
  const getErrorCategory = () => {
    switch (error) {
      case 'invalid_request':
      case 'bad_oauth_state':
        return AuthErrorCategory.OAUTH_STATE_INVALID
      
      case 'invalid_token':
      case 'exchange_error':
        return AuthErrorCategory.TOKEN_INVALID
      
      case 'missing_code':
        return AuthErrorCategory.OAUTH_CALLBACK_ERROR
      
      case 'rate_limited':
        return AuthErrorCategory.RATE_LIMITED
      
      default:
        return AuthErrorCategory.UNEXPECTED_ERROR
    }
  }
  
  // Obter um título amigável para o erro
  const getErrorTitle = () => {
    switch (error) {
      case 'invalid_request':
      case 'bad_oauth_state':
        return 'Erro na autenticação'
      
      case 'invalid_token':
      case 'exchange_error':
        return 'Falha na autenticação'
      
      case 'missing_code':
        return 'Informações incompletas'
      
      case 'rate_limited':
        return 'Muitas tentativas'
      
      default:
        return 'Erro inesperado'
    }
  }
  
  // Obter uma sugestão para o usuário
  const getSuggestion = () => {
    switch (error) {
      case 'invalid_request':
      case 'bad_oauth_state':
        return 'Ocorreu um problema com sua autenticação. Por favor, tente novamente com um novo login.'
      
      case 'invalid_token':
      case 'exchange_error':
        return 'Não foi possível validar sua conta. Tente novamente ou use outro método de login.'
      
      case 'missing_code':
        return 'O login não foi completado corretamente. Por favor, tente fazer login novamente.'
      
      case 'rate_limited':
        return 'Muitas tentativas de login. Por favor, aguarde alguns minutos antes de tentar novamente.'
      
      default:
        return errorDescription || 'Ocorreu um erro inesperado. Por favor, tente novamente.'
    }
  }
  
  const handleRetry = () => {
    router.push('/auth/login')
  }
  
  const handleDismiss = () => {
    router.push('/')
  }
  
  return (
    <AuthErrorMessage
      message={getErrorTitle()}
      category={getErrorCategory()}
      code={error}
      suggestion={getSuggestion()}
      onRetry={handleRetry}
      onDismiss={handleDismiss}
      className="max-w-md mx-auto"
    />
  )
}

export default OAuthErrorDisplay 