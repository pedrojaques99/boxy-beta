'use client'

import { useEffect, useState } from 'react'
import { getAuthService } from '@/lib/auth/auth-service'
import { AuthGuard } from '@/components/admin/AuthGuard'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [hasCookieError, setHasCookieError] = useState(false)
  
  // Verificar se há erros de cookie no carregamento
  useEffect(() => {
    const checkCookieErrors = async () => {
      try {
        // Chamar diretamente para testar se a leitura de cookies funciona
        const authService = getAuthService()
        await authService.getSession()
      } catch (err) {
        // Se o erro for específico de cookies JSON corrompidos
        if (err instanceof Error && 
            (err.message.includes('parse cookie') || 
             err.message.includes('JSON') || 
             err.message.includes('token'))) {
          console.error('Erro de cookie detectado:', err)
          setHasCookieError(true)
          
          // Redirecionar para a página de reparo
          window.location.href = '/cookie-repair'
        }
      }
    }
    
    checkCookieErrors()
  }, [])
  
  // Se detectamos problema com cookie, exibir mensagem temporária enquanto redirecionamos
  if (hasCookieError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Problema detectado nos cookies</h1>
        <p className="text-center mb-4">
          Encontramos um problema com os cookies de autenticação. 
          Você será redirecionado para a página de reparo.
        </p>
        <div className="h-2 w-48 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  )
} 