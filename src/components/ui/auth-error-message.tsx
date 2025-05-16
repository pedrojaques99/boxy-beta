'use client'

import React, { useState } from 'react'
import { AlertCircle, AlertTriangle, HelpCircle, Info, RefreshCw, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from './alert'
import { Button } from './button'
import { AuthErrorCategory } from '@/lib/auth/auth-errors'

interface AuthErrorMessageProps {
  message: string
  category?: AuthErrorCategory
  code?: string
  suggestion?: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

/**
 * Componente que exibe mensagens de erro de autenticação com instruções úteis
 * e ações possíveis para o usuário resolver o problema.
 */
export function AuthErrorMessage({
  message,
  category,
  code,
  suggestion,
  onRetry,
  onDismiss,
  className
}: AuthErrorMessageProps) {
  const [dismissed, setDismissed] = useState(false)
  
  // Se o componente foi descartado, não renderizar nada
  if (dismissed) return null
  
  // Determinar o tipo de alerta com base na categoria
  const getAlertVariant = () => {
    if (!category) return 'default'
    
    switch (category) {
      case AuthErrorCategory.INVALID_CREDENTIALS:
      case AuthErrorCategory.USER_NOT_FOUND:
        return 'default'
        
      case AuthErrorCategory.SESSION_EXPIRED:
      case AuthErrorCategory.TOKEN_EXPIRED:
      case AuthErrorCategory.OAUTH_ERROR:
      case AuthErrorCategory.COOKIE_ERROR:
        return 'default'
        
      case AuthErrorCategory.NETWORK_ERROR:
      case AuthErrorCategory.SERVER_ERROR:
      case AuthErrorCategory.RATE_LIMITED:
        return 'destructive'
        
      case AuthErrorCategory.SECURITY_ERROR:
        return 'destructive'
        
      default:
        return 'default'
    }
  }
  
  // Obter o ícone apropriado para o tipo de erro
  const getIcon = () => {
    if (!category) return Info
    
    switch (category) {
      case AuthErrorCategory.INVALID_CREDENTIALS:
      case AuthErrorCategory.USER_NOT_FOUND:
        return Info
        
      case AuthErrorCategory.SESSION_EXPIRED:
      case AuthErrorCategory.TOKEN_EXPIRED:
      case AuthErrorCategory.OAUTH_ERROR:
      case AuthErrorCategory.COOKIE_ERROR:
        return AlertTriangle
        
      case AuthErrorCategory.NETWORK_ERROR:
      case AuthErrorCategory.SERVER_ERROR:
      case AuthErrorCategory.RATE_LIMITED:
        return AlertCircle
        
      case AuthErrorCategory.SECURITY_ERROR:
        return AlertCircle
        
      default:
        return HelpCircle
    }
  }
  
  // Lidar com a ação de dispensar o alerta
  const handleDismiss = () => {
    setDismissed(true)
    if (onDismiss) onDismiss()
  }
  
  // Obter sugestão de ação padrão se nenhuma for fornecida
  const getDefaultSuggestion = () => {
    if (!category) return 'Por favor, tente novamente ou entre em contato com o suporte.'
    
    switch (category) {
      case AuthErrorCategory.INVALID_CREDENTIALS:
        return 'Verifique seu email e senha e tente novamente.'
        
      case AuthErrorCategory.USER_NOT_FOUND:
        return 'Este usuário não existe. Verifique seu email ou crie uma nova conta.'
        
      case AuthErrorCategory.SESSION_EXPIRED:
      case AuthErrorCategory.TOKEN_EXPIRED:
        return 'Sua sessão expirou. Por favor, faça login novamente.'
        
      case AuthErrorCategory.NETWORK_ERROR:
        return 'Verifique sua conexão de internet e tente novamente.'
        
      case AuthErrorCategory.RATE_LIMITED:
        return 'Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.'
        
      default:
        return 'Por favor, tente novamente ou entre em contato com o suporte.'
    }
  }
  
  const Icon = getIcon()
  const alertVariant = getAlertVariant()
  const actionSuggestion = suggestion || getDefaultSuggestion()
  
  return (
    <Alert variant={alertVariant} className={`my-4 ${className || ''}`}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="font-medium">{message}</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{actionSuggestion}</p>
        
        {/* Botões de ação */}
        <div className="mt-3 flex flex-wrap gap-2">
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry} 
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Tentar novamente
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss} 
            className="flex items-center gap-1 ml-auto"
          >
            <X className="h-3 w-3" />
            Dispensar
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Versão mais simples do componente de erro de autenticação
 */
export function SimpleAuthError({ message, onDismiss }: { message: string, onDismiss?: () => void }) {
  return (
    <AuthErrorMessage 
      message={message}
      onDismiss={onDismiss}
    />
  )
} 