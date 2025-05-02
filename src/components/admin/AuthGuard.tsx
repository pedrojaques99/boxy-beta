import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@supabase/auth-helpers-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useTranslations } from '@/hooks/use-translations'

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

  const supabase = createClient()
  const SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || 'boxy123'

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        setIsAdmin(profile?.role === 'admin')
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === SECRET) {
      setAuth(true)
      toast.success(t?.admin?.auth?.success || 'Successfully authenticated!')
    } else {
      toast.error(t?.admin?.auth?.error || 'Incorrect password')
    }
  }

  if (!t) {
    return <div className="p-10">Loading translations...</div>
  }

  if (isLoading) {
    return <div className="p-10">{t?.admin?.loading || 'Loading...'}</div>
  }

  if (!user) {
    return <div className="p-10">{t?.admin?.loading || 'Loading...'}</div>
  }

  if (!isAdmin) {
    return <div className="p-10">{t?.admin?.auth?.error || 'You are not authorized to access this page'}</div>
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