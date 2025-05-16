'use client'

import { useEffect, useState } from 'react'
import { User, Session, AuthError, SupabaseClient } from '@supabase/supabase-js'
import { getAuthService } from '@/lib/auth/auth-service'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { AuthErrorCategory } from '@/lib/auth/auth-errors'

export interface UserSession {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  redirectToLogin: (redirectTo?: string) => void
  userProfile: any | null
  userSubscription: any | null
  isAdmin: boolean
  refreshUser: () => Promise<void>
}

/**
 * Hook centralizado para gerenciar autenticação, usando o AuthService
 * Substitui useUser e outros hooks relacionados a autenticação
 */
export function useAuth(): UserSession {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [userSubscription, setUserSubscription] = useState<any | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const authService = getAuthService()
  const router = useRouter()
  const pathname = usePathname()

  // Função para buscar dados do usuário
  const fetchUserData = async () => {
    try {
      setLoading(true)
      const { data, error } = await authService.getUser()
      
      if (error) {
        console.error('Error fetching user:', error)
        setUser(null)
        return
      }
      
      setUser(data.user)
      
      // Se temos um usuário, buscar perfil e assinatura
      if (data.user?.id) {
        try {
          const profile = await authService.getUserProfile(data.user.id)
          setUserProfile(profile)
          
          // Verificar se é admin
          if (profile?.role === 'admin') {
            setIsAdmin(true)
          } else {
            const { isAdmin: adminStatus } = await authService.checkAdminStatus(data.user.id)
            setIsAdmin(adminStatus)
          }
          
          // Buscar assinatura
          const subscription = await authService.getUserSubscription(data.user.id)
          setUserSubscription(subscription)
        } catch (err) {
          console.error('Error fetching user profile or subscription:', err)
        }
      }
    } catch (err) {
      console.error('Error in fetchUserData:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Buscar dados do usuário na inicialização
  useEffect(() => {
    let mounted = true
    let authStateUnsubscribe: (() => void) | null = null
    
    const setupAuth = async () => {
      try {
        // Verificar se temos uma sessão válida
        const { data: { session }, error: sessionError } = await authService.getSession()
        
        if (sessionError) {
          // Se o erro for relacionado a sessão expirada, limpar dados
          const errorMessage = typeof sessionError === 'object' && sessionError !== null
            ? 'message' in sessionError
              ? String((sessionError as { message: string }).message)
              : String(sessionError)
            : String(sessionError)
          
          if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
            setUser(null)
            setUserProfile(null)
            setUserSubscription(null)
            setIsAdmin(false)
          }
          
          throw sessionError
        }
        
        if (session?.user && mounted) {
          setUser(session.user)
          fetchUserData()
        } else if (mounted) {
          setUser(null)
          setLoading(false)
        }
      } catch (err) {
        console.error('Error checking auth state:', err)
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    setupAuth()
    
    // Configurar listener para mudanças de autenticação
    try {
      // Safely check if getClient method exists
      const clientMethod = (authService as any).getClient
      if (typeof clientMethod === 'function') {
        const client = clientMethod.call(authService) as SupabaseClient
        
        if (client && client.auth) {
          const { data: { subscription } } = client.auth.onAuthStateChange(
            async (event: string, session: Session | null) => {
              if (mounted) {
                setUser(session?.user ?? null)
                
                if (session?.user) {
                  fetchUserData()
                } else {
                  setUserProfile(null)
                  setUserSubscription(null)
                  setIsAdmin(false)
                }
              }
            }
          )
          
          authStateUnsubscribe = () => subscription.unsubscribe()
        }
      } else {
        console.warn('AuthService.getClient method not available, auth state changes will not be monitored')
      }
    } catch (err) {
      console.error('Error setting up auth state listener:', err)
    }
    
    return () => {
      mounted = false
      if (authStateUnsubscribe) {
        authStateUnsubscribe()
      }
    }
  }, [])
  
  /**
   * Efetuar logout
   */
  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await authService.signOut()
      
      if (error) {
        throw error
      }
      
      setUser(null)
      setUserProfile(null)
      setUserSubscription(null)
      setIsAdmin(false)
      
      // Verificar se estamos em uma rota protegida e redirecionar
      if (pathname?.startsWith('/profile') || 
          pathname?.startsWith('/admin') || 
          pathname?.startsWith('/checkout')) {
        router.push('/')
      } else {
        router.refresh()
      }
      
    } catch (err) {
      console.error('Error signing out:', err)
      toast.error('Erro ao sair. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }
  
  /**
   * Redirecionar para página de login
   */
  const redirectToLogin = (redirectTo?: string) => {
    const currentPath = redirectTo || pathname || '/'
    authService.redirectToAuthPage(router, currentPath)
  }
  
  /**
   * Atualizar dados do usuário sob demanda
   */
  const refreshUser = async () => {
    await fetchUserData()
  }
  
  return {
    user,
    loading,
    isAuthenticated: !!user,
    signOut,
    redirectToLogin,
    userProfile,
    userSubscription,
    isAdmin,
    refreshUser
  }
} 