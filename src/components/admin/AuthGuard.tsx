"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@supabase/auth-helpers-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useTranslations } from '@/hooks/use-translations'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { getAuthService } from '@/lib/auth/auth-service'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const { t } = useTranslations()
  const user = useUser()
  const authService = getAuthService()
  
  const [auth, setAuth] = useState(false)
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Handle tab visibility changes to force re-auth when tab is focused again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        checkAdminAccess(user.id)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  // Check for cached admin status on mount
  useEffect(() => {
    setIsMounted(true)
    
    // First try to recover from any potential cookie issues
    authService.checkAndRepairAuthCookies()
    
    if (user?.id) {
      // First check cached status for quicker initial render
      if (authService.getCachedAdminStatus(user.id)) {
        setAuth(true)
        setIsAdmin(true)
        setIsLoading(false)
      } else {
        // Then verify with server
        checkAdminAccess(user.id)
      }
    } else if (isMounted) {
      // If we're mounted but have no user, stop loading
      setIsLoading(false)
    }
    
    // Set a maximum loading time to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
    }, 5000) // 5 seconds maximum loading time
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [user, isMounted, authService])

  // Core function to check admin access
  const checkAdminAccess = async (userId: string) => {
    if (!userId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Use AuthService to check admin status
      const result = await authService.checkAdminStatus(userId)
      
      setProfileData(result.profile)
      setIsAdmin(result.isAdmin)
      setError(result.error)
      
      if (result.isAdmin) {
        setAuth(true)
        authService.saveCachedAdminStatus(userId, true)
      } else {
        authService.clearCachedAdminStatus()
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsAdmin(false)
      authService.clearCachedAdminStatus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (authService.verifyAdminPassword(password)) {
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
    // Redirect to access-denied page for consistency with middleware
    router.push('/auth/access-denied')
    // Return loading state while redirecting
    return (
      <div className="flex flex-col items-center justify-center p-10 h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <div>{t?.admin?.loading || 'Redirecionando...'}</div>
      </div>
    )
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