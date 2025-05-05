"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@supabase/auth-helpers-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useTranslations } from '@/hooks/use-translations'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const { t } = useTranslations()
  const user = useUser()
  const [auth, setAuth] = useState(false)
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [hasCheckedSessionStorage, setHasCheckedSessionStorage] = useState(false)

  const supabase = createClient()
  const SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || 'boxy123'

  // Handle tab visibility changes to force re-auth when tab is focused again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Force re-check when coming back to tab
        checkAdminStatus(user.id)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  // Initial mount and session storage check
  useEffect(() => {
    setIsMounted(true)
    
    if (typeof window !== 'undefined' && !hasCheckedSessionStorage) {
      // Check if we have the admin status cached in session storage
      const cachedAdminStatus = sessionStorage.getItem('admin_authenticated')
      const cachedUserId = sessionStorage.getItem('admin_user_id')
      
      if (cachedAdminStatus === 'true' && user && cachedUserId === user.id) {
        // Use cached admin status to avoid flickering
        setAuth(true)
        setIsAdmin(true)
        setIsLoading(false)
        setHasCheckedSessionStorage(true)
      } else {
        // Clear any stale values
        sessionStorage.removeItem('admin_authenticated')
        sessionStorage.removeItem('admin_user_id')
      }
    }
    
    // Set a maximum loading time to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
    }, 10000) // 10 seconds maximum loading time
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [user, hasCheckedSessionStorage])

  // Handle admin status check when user changes
  useEffect(() => {
    if (!isMounted || !user) {
      if (isMounted && !user) {
        setIsLoading(false)
        setError('Usuário não está autenticado')
      }
      return
    }
    
    // If we already validated from session storage, skip the check
    if (hasCheckedSessionStorage && auth && isAdmin) {
      return
    }

    // On mount or when user changes, check admin status
    checkAdminStatus(user.id)

  }, [user, isMounted, hasCheckedSessionStorage, auth, isAdmin])

  // Function to check admin status
  const checkAdminStatus = async (userId: string) => {
    if (!userId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Checking admin status for user:', userId)
      
      // Force browser to refresh supabase client on each attempt
      const freshSupabase = createClient()
      
      const { data: profile, error: profileError } = await freshSupabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        
      if (profileError) {
        console.error('Profile fetch error:', profileError)
        setError(`Erro ao buscar perfil: ${profileError.message}`)
        setIsAdmin(false)
        setProfileData(null)
        
        // Clear session storage
        sessionStorage.removeItem('admin_authenticated')
        sessionStorage.removeItem('admin_user_id')
      } else {
        console.log('Profile data fetched:', profile)
        setProfileData(profile)
        const isUserAdmin = profile?.role === 'admin'
        setIsAdmin(isUserAdmin)
        
        if (isUserAdmin) {
          setAuth(true)
          
          // Store in session storage
          sessionStorage.setItem('admin_authenticated', 'true')
          sessionStorage.setItem('admin_user_id', userId)
        } else {
          // Clear session storage
          sessionStorage.removeItem('admin_authenticated')
          sessionStorage.removeItem('admin_user_id')
        }
      }
    } catch (error) {
      console.error('Admin check error:', error)
      setError(`Erro ao verificar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setIsAdmin(false)
      
      // Clear session storage
      sessionStorage.removeItem('admin_authenticated')
      sessionStorage.removeItem('admin_user_id')
    } finally {
      setIsLoading(false)
      setHasCheckedSessionStorage(true)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === SECRET) {
      setAuth(true)
      toast.success(t?.admin?.auth?.success || 'Successfully authenticated!')
    } else {
      toast.error(t?.admin?.auth?.error || 'Incorrect password')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <div>{t?.admin?.loading || 'Verificando permissões...'}</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-10">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso negado</AlertTitle>
          <AlertDescription>
            Você precisa estar logado para acessar esta página.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/auth/login')}>
          Fazer login
        </Button>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-10">
        <div className="mb-5 text-red-600 font-bold">{t?.admin?.auth?.error || 'Você não tem permissão para acessar esta página'}</div>
        
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>Detalhes do usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>ID:</strong> {user.id}</div>
            <div><strong>Role:</strong> <span className="text-red-600">{profileData?.role || 'não definido'}</span></div>
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro na verificação</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="p-3 bg-yellow-50 rounded border border-yellow-200 mt-4">
              <p className="text-sm">Para que seu usuário tenha acesso administrativo, execute esta query no Supabase:</p>
              <pre className="bg-gray-100 p-2 rounded text-xs mt-2 overflow-auto">
                UPDATE profiles SET role = 'admin' WHERE id = '{user.id}';
              </pre>
            </div>
          </CardContent>
        </Card>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Para acessar esta página, seu perfil deve ter a role &quot;admin&quot; na tabela &quot;profiles&quot; do Supabase.
            Contacte o administrador do sistema para solicitar acesso.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!auth) {
    return (
      <Card className="p-10 max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t?.admin?.auth?.title || 'Administrative Area'}</CardTitle>
          <CardDescription>{t?.admin?.auth?.description || 'Enter the administrator password to continue'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder={t?.admin?.auth?.password?.placeholder || 'Enter admin password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full">
              {t?.admin?.auth?.submit || 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
} 