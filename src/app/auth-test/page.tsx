'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Check, X, AlertCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AuthTestPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [cookies, setCookies] = useState<string[]>([])
  const [authCookies, setAuthCookies] = useState<string[]>([])
  const [testResults, setTestResults] = useState<Array<{name: string, status: 'success' | 'error' | 'loading', message: string}>>([])
  const router = useRouter()
  const supabase = createClient()

  // Verifica o status da sessão
  useEffect(() => {
    const checkSession = async () => {
      setTestResults(prev => [...prev, {
        name: 'Verificando sessão',
        status: 'loading',
        message: 'Verificando se existe uma sessão válida...'
      }])

      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          setSessionStatus('error')
          setSessionInfo(error)
          setTestResults(prev => {
            const newResults = [...prev]
            const index = newResults.findIndex(r => r.name === 'Verificando sessão')
            if (index !== -1) {
              newResults[index] = {
                name: 'Verificando sessão',
                status: 'error',
                message: `Erro ao verificar sessão: ${error.message}`
              }
            }
            return newResults
          })
        } else {
          setSessionStatus('success')
          setSessionInfo(data)
          setTestResults(prev => {
            const newResults = [...prev]
            const index = newResults.findIndex(r => r.name === 'Verificando sessão')
            if (index !== -1) {
              newResults[index] = {
                name: 'Verificando sessão',
                status: data.session ? 'success' : 'error',
                message: data.session 
                  ? `Sessão encontrada. User ID: ${data.session.user.id}` 
                  : 'Nenhuma sessão ativa encontrada!'
              }
            }
            return newResults
          })
        }
      } catch (err) {
        console.error(err)
        setSessionStatus('error')
        setSessionInfo(err)
        setTestResults(prev => {
          const newResults = [...prev]
          const index = newResults.findIndex(r => r.name === 'Verificando sessão')
          if (index !== -1) {
            newResults[index] = {
              name: 'Verificando sessão',
              status: 'error',
              message: `Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
            }
          }
          return newResults
        })
      }
    }

    checkSession()
  }, [supabase.auth])

  // Verifica cookies
  useEffect(() => {
    setTestResults(prev => [...prev, {
      name: 'Verificando cookies',
      status: 'loading',
      message: 'Analisando cookies disponíveis...'
    }])

    try {
      // Obter todos os cookies
      const allCookies = document.cookie.split(';').map(c => c.trim())
      setCookies(allCookies)
      
      // Filtrar cookies relacionados à autenticação
      const authRelatedCookies = allCookies.filter(c => 
        c.toLowerCase().includes('supabase') || 
        c.toLowerCase().includes('auth') || 
        c.toLowerCase().includes('session')
      )
      setAuthCookies(authRelatedCookies)

      setTestResults(prev => {
        const newResults = [...prev]
        const index = newResults.findIndex(r => r.name === 'Verificando cookies')
        if (index !== -1) {
          newResults[index] = {
            name: 'Verificando cookies',
            status: authRelatedCookies.length > 0 ? 'success' : 'error',
            message: authRelatedCookies.length > 0 
              ? `${authRelatedCookies.length} cookies de autenticação encontrados` 
              : 'Nenhum cookie de autenticação encontrado!'
          }
        }
        return newResults
      })
    } catch (err) {
      console.error(err)
      setTestResults(prev => {
        const newResults = [...prev]
        const index = newResults.findIndex(r => r.name === 'Verificando cookies')
        if (index !== -1) {
          newResults[index] = {
            name: 'Verificando cookies',
            status: 'error',
            message: `Erro ao analisar cookies: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
          }
        }
        return newResults
      })
    }
  }, [])

  // Testa acesso a rotas protegidas
  const testProtectedRoute = async (path: string) => {
    const testName = `Testando acesso a ${path}`
    
    setTestResults(prev => [...prev, {
      name: testName,
      status: 'loading',
      message: `Tentando acessar rota protegida ${path}...`
    }])

    try {
      const response = await fetch(path, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
        redirect: 'manual',
      })

      // Analisar resultado
      const result = {
        status: response.status,
        ok: response.ok,
        redirected: response.redirected,
        url: response.url,
      }

      // Verificar se foi redirecionado para login (o que indica um problema)
      const wasRedirectedToLogin = response.redirected && 
        (response.url.includes('/auth/login') || response.url.includes('/login'))

      setTestResults(prev => {
        const newResults = [...prev]
        const index = newResults.findIndex(r => r.name === testName)
        if (index !== -1) {
          newResults[index] = {
            name: testName,
            status: wasRedirectedToLogin ? 'error' : 'success',
            message: wasRedirectedToLogin 
              ? `Redirecionado para login! Status: ${response.status}` 
              : `Acesso bem-sucedido. Status: ${response.status}`
          }
        }
        return newResults
      })
    } catch (err) {
      console.error(`Erro ao testar ${path}:`, err)
      setTestResults(prev => {
        const newResults = [...prev]
        const index = newResults.findIndex(r => r.name === testName)
        if (index !== -1) {
          newResults[index] = {
            name: testName,
            status: 'error',
            message: `Erro ao testar rota: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
          }
        }
        return newResults
      })
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      window.location.reload()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const login = () => {
    router.push('/auth/login?redirectTo=/auth-test')
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Teste de Autenticação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Status da Sessão</h3>
              {sessionStatus === 'loading' ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Verificando sessão...</span>
                </div>
              ) : sessionStatus === 'success' ? (
                <Alert variant={sessionInfo?.session ? 'default' : 'destructive'}>
                  {sessionInfo?.session ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      <AlertTitle>Autenticado</AlertTitle>
                      <AlertDescription>
                        ID: {sessionInfo.session.user.id}<br />
                        Email: {sessionInfo.session.user.email}<br />
                        Role: {sessionInfo.session.user.role || 'Não definido'}
                      </AlertDescription>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <AlertTitle>Não Autenticado</AlertTitle>
                      <AlertDescription>
                        Nenhuma sessão ativa encontrada.
                      </AlertDescription>
                    </>
                  )}
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <X className="h-4 w-4 mr-2" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>
                    {JSON.stringify(sessionInfo)}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Cookies de Autenticação ({authCookies.length})</h3>
              {authCookies.length > 0 ? (
                <div className="bg-muted p-3 rounded-md overflow-auto max-h-40">
                  <ul className="list-disc pl-5 space-y-1">
                    {authCookies.map((cookie, i) => (
                      <li key={i} className="text-sm font-mono">{cookie}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertTitle>Nenhum Cookie de Autenticação</AlertTitle>
                  <AlertDescription>
                    Não foram encontrados cookies relacionados à autenticação.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Resultados dos Testes</h3>
              <div className="space-y-2">
                {testResults.map((result, i) => (
                  <Alert 
                    key={i} 
                    variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : undefined}
                    className={result.status === 'loading' ? 'border border-muted' : ''}
                  >
                    {result.status === 'loading' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : result.status === 'success' ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    <AlertTitle>{result.name}</AlertTitle>
                    <AlertDescription>{result.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-between">
          <div className="flex gap-2">
            <Button onClick={() => testProtectedRoute('/profile')}>
              Testar /profile
            </Button>
            <Button onClick={() => testProtectedRoute('/admin')}>
              Testar /admin
            </Button>
            <Button onClick={() => testProtectedRoute('/price')}>
              Testar /price
            </Button>
          </div>
          <div className="flex gap-2">
            {sessionInfo?.session ? (
              <Button variant="destructive" onClick={logout}>
                Logout
              </Button>
            ) : (
              <Button variant="default" onClick={login}>
                Login
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico e Soluções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!sessionInfo?.session && (
              <Alert>
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertTitle>Sem sessão ativa</AlertTitle>
                <AlertDescription>
                  Você não está autenticado. Clique no botão Login para iniciar sessão.
                </AlertDescription>
              </Alert>
            )}

            {sessionInfo?.session && authCookies.length === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertTitle>Problema crítico de cookies</AlertTitle>
                <AlertDescription>
                  Sua sessão está ativa, mas não foram encontrados cookies de autenticação.
                  Isso pode indicar um problema com o armazenamento de cookies.
                </AlertDescription>
              </Alert>
            )}

            {sessionInfo?.session && authCookies.length > 0 && testResults.some(r => r.status === 'error' && r.name.startsWith('Testando acesso')) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertTitle>Problema de middleware</AlertTitle>
                <AlertDescription>
                  Sua sessão está ativa e os cookies existem, mas você está sendo redirecionado ao tentar acessar rotas protegidas.
                  Isso indica um problema no middleware que não está reconhecendo corretamente sua sessão.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Informações para debug:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>URL atual: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</li>
                <li>Navegador: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</li>
                <li>Modo: {process.env.NODE_ENV}</li>
                <li>Total de cookies: {cookies.length}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 