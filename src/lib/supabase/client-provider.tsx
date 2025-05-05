'use client'

import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import { getSupabaseEnv } from './env'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  // Usar diretamente o createPagesBrowserClient para evitar problemas de SSR
  const [supabaseClient] = useState(() => {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()
    return createPagesBrowserClient({
      supabaseUrl,
      supabaseKey: supabaseAnonKey
    })
  })

  // Log para ajudar a depurar problemas de sessão
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabaseClient.auth.getSession()
        if (error) {
          console.error('Erro ao obter sessão:', error)
        } else {
          console.log('Sessão obtida com sucesso:', data.session?.user ? 'Usuário autenticado' : 'Sem usuário')
          if (data.session?.user) {
            console.log('Dados do usuário:', {
              id: data.session.user.id,
              email: data.session.user.email,
              role: data.session.user.role
            })
          }
        }
      } catch (err) {
        console.error('Erro inesperado ao verificar sessão:', err)
      }
    }
    
    checkSession()
  }, [supabaseClient])

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  )
} 