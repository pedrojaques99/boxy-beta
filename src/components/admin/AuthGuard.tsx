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

  const supabase = createClient()
  const SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || 'boxy123'

  // First useEffect to handle mounted state
  useEffect(() => {
    setIsMounted(true)
    
    // Set a maximum loading time to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
    }, 10000) // 10 seconds maximum loading time
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    if (!isMounted) return
    
    let mounted = true

    const checkAdminStatus = async () => {
      if (!user) {
        if (mounted) {
          setIsLoading(false)
          setError('Usuário não está autenticado')
        }
        return
      }

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          
        clearTimeout(timeoutId)

        if (!mounted) return

        if (profileError) {
          setError(`Erro ao buscar perfil: ${profileError.message}`)
          setIsAdmin(false)
          setProfileData(null)
        } else {
          setProfileData(profile)
          setIsAdmin(profile?.role === 'admin')
          if (profile?.role === 'admin') {
            setAuth(true)
          }
        }
      } catch (error) {
        if (!mounted) return
        setError(`Erro ao verificar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        setIsAdmin(false)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    checkAdminStatus()

    return () => {
      mounted = false
    }
  }, [user, supabase, isMounted])

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