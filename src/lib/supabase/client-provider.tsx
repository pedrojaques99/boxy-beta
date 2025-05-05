'use client'

import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  // Usar a mesma instância do cliente já criada em lib/supabase/client.ts
  const [supabaseClient] = useState(() => createClient())

  // Log para ajudar a depurar problemas de sessão
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabaseClient.auth.getSession()
        if (error) {
          console.error('Erro ao obter sessão:', error)
        } else {
          console.log('Sessão obtida com sucesso:', data.session?.user ? 'Usuário autenticado' : 'Sem usuário')
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