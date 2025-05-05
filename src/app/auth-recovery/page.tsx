'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AuthRecoveryPage() {
  const [status, setStatus] = useState<'checking' | 'clean' | 'redirecting'>('checking')
  const [countdown, setCountdown] = useState(5)
  const router = useRouter()

  // Verificar se os cookies foram limpos
  useEffect(() => {
    const checkCookies = () => {
      try {
        const cookies = document.cookie.split(';')
        const hasSupabaseCookies = cookies.some(cookie => {
          const name = cookie.split('=')[0].trim()
          return name.includes('supabase') || name.includes('sb-')
        })
        
        if (hasSupabaseCookies) {
          console.log('Ainda existem cookies Supabase. Redirecionando para limpeza.')
          router.push('/cookie-repair')
        } else {
          console.log('Cookies limpos com sucesso!')
          setStatus('clean')
          
          // Iniciar contagem regressiva para o redirecionamento
          let count = 5
          const timer = setInterval(() => {
            count--
            setCountdown(count)
            if (count <= 0) {
              clearInterval(timer)
              setStatus('redirecting')
              router.push('/auth/login')
            }
          }, 1000)
          
          return () => clearInterval(timer)
        }
      } catch (err) {
        console.error('Erro ao verificar cookies:', err)
      }
    }
    
    checkCookies()
  }, [router])

  const goToLogin = () => {
    router.push('/auth/login')
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Recuperação da Autenticação</CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'checking' ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-center">Verificando estado dos cookies...</p>
            </div>
          ) : status === 'clean' ? (
            <div className="space-y-6">
              <Alert className="bg-success/20 border-success">
                <CheckCircle className="h-5 w-5 text-success mr-2" />
                <AlertTitle>Cookies limpos com sucesso</AlertTitle>
                <AlertDescription>
                  Os cookies problemáticos foram removidos. Agora você precisa fazer login novamente.
                </AlertDescription>
              </Alert>
              
              <div className="p-4 border rounded-md bg-muted/50">
                <h3 className="font-medium mb-2">O que aconteceu?</h3>
                <p className="text-sm text-muted-foreground">
                  Seus cookies de autenticação estavam corrompidos, o que impedia o funcionamento correto do sistema.
                  Nós removemos os cookies corrompidos. Para acessar o sistema novamente, você precisará fazer login.
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Redirecionando automaticamente em <span className="font-bold">{countdown}</span> segundos...
                </p>
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-linear rounded-full" 
                    style={{ width: `${(countdown / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-center">Redirecionando para a página de login...</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <Button
            onClick={goToLogin}
            disabled={status === 'redirecting'}
          >
            Ir para Login Agora
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 