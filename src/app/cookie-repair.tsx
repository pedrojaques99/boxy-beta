'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Check, X, AlertCircle, Loader2 } from 'lucide-react'

export default function CookieRepairPage() {
  const [problems, setProblems] = useState<{
    corruptedCookies: string[],
    invalidJson: string[],
    nonStandardBase64: string[]
  }>({
    corruptedCookies: [],
    invalidJson: [],
    nonStandardBase64: []
  })
  const [repairStatus, setRepairStatus] = useState<'idle' | 'scanning' | 'repairing' | 'success' | 'error'>('idle')
  const [log, setLog] = useState<string[]>([])

  // Adicionar nova entrada ao log
  const addLog = (message: string) => {
    setLog(prev => [...prev, `[${new Date().toISOString().substring(11, 19)}] ${message}`])
  }

  // Verificar cookies
  const scanCookies = () => {
    setRepairStatus('scanning')
    addLog('Iniciando verificação de cookies...')
    
    try {
      const allCookies = document.cookie.split(';').map(c => c.trim())
      const corruptedCookies: string[] = []
      const invalidJson: string[] = []
      const nonStandardBase64: string[] = []
      
      allCookies.forEach(cookie => {
        const [name, value] = cookie.split('=').map(s => s.trim())
        
        // Verificar se o cookie contém JSON
        if (value && (name.includes('supabase') || name.includes('sb-'))) {
          try {
            // Tentar decodificar se for Base64
            if (value.startsWith('base64-')) {
              const base64Part = value.substring(7) // remover 'base64-'
              try {
                // Verificar se é base64 válido
                atob(base64Part)
              } catch (e) {
                nonStandardBase64.push(name)
                corruptedCookies.push(name)
                addLog(`Cookie ${name} tem Base64 inválido`)
              }
            } else {
              // Tentar parse como JSON direto
              try {
                JSON.parse(value)
              } catch (e) {
                invalidJson.push(name)
                corruptedCookies.push(name)
                addLog(`Cookie ${name} tem JSON inválido`)
              }
            }
          } catch (e) {
            corruptedCookies.push(name)
            addLog(`Erro ao analisar cookie ${name}`)
          }
        }
      })
      
      setProblems({
        corruptedCookies,
        invalidJson,
        nonStandardBase64
      })
      
      if (corruptedCookies.length === 0) {
        addLog('Nenhum problema de cookie encontrado!')
      } else {
        addLog(`Encontrados ${corruptedCookies.length} cookies com problemas.`)
      }
      
      setRepairStatus('idle')
    } catch (err) {
      addLog(`Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      setRepairStatus('error')
    }
  }
  
  // Limpar apenas cookies corrompidos
  const repairLimitedCookies = () => {
    setRepairStatus('repairing')
    addLog('Iniciando reparo apenas dos cookies corrompidos...')
    
    try {
      if (problems.corruptedCookies.length > 0) {
        problems.corruptedCookies.forEach(cookieName => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          addLog(`Removido cookie corrompido: ${cookieName}`)
        })
        
        addLog('Reparo seletivo concluído! A página será recarregada...')
        setRepairStatus('success')
        
        // Recarregar a página após 2 segundos
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        addLog('Nenhum cookie corrompido específico encontrado para reparar.')
        setRepairStatus('idle')
      }
    } catch (err) {
      addLog(`Erro ao reparar cookies seletivamente: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      setRepairStatus('error')
    }
  }
  
  // Limpar cookies corrompidos
  const repairCookies = () => {
    setRepairStatus('repairing')
    addLog('Iniciando reparo de cookies...')
    
    try {
      // Limpar todos os cookies do Supabase
      const allCookies = document.cookie.split(';')
      
      // Primeiro tentar limpar apenas os corrompidos
      if (problems.corruptedCookies.length > 0) {
        problems.corruptedCookies.forEach(cookieName => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          addLog(`Removido cookie corrompido: ${cookieName}`)
        })
      } else {
        // Se não encontramos corruptos específicos, limpar todos relacionados ao Supabase
        allCookies.forEach(cookie => {
          const name = cookie.split('=')[0].trim()
          if (name.includes('supabase') || name.includes('sb-')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
            addLog(`Removido cookie Supabase: ${name}`)
          }
        })
      }
      
      // Limpar também localStorage relacionado ao Supabase para começar do zero
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key)
            addLog(`Removido item localStorage: ${key}`)
          }
        })
      } catch (e) {
        addLog(`Aviso: Não foi possível limpar localStorage: ${e instanceof Error ? e.message : 'Erro desconhecido'}`)
      }
      
      addLog('Reparo concluído! Você será redirecionado para a página de login...')
      setRepairStatus('success')
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        window.location.href = '/auth/login'
      }, 3000)
    } catch (err) {
      addLog(`Erro ao reparar cookies: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      setRepairStatus('error')
    }
  }
  
  // Verificar cookies automaticamente ao carregar
  useEffect(() => {
    scanCookies()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Reparo de Cookies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Alert 
              variant={problems.corruptedCookies.length > 0 ? "destructive" : "default"}
              className="mb-4"
            >
              {problems.corruptedCookies.length > 0 ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertTitle>Problemas detectados</AlertTitle>
                  <AlertDescription>
                    Foram encontrados {problems.corruptedCookies.length} cookies corrompidos que podem estar causando problemas de autenticação.
                  </AlertDescription>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  <AlertTitle>Nenhum problema encontrado</AlertTitle>
                  <AlertDescription>
                    Não foram detectados cookies corrompidos. Se você ainda está enfrentando problemas de autenticação, você pode tentar limpar todos os cookies relacionados ao Supabase.
                  </AlertDescription>
                </>
              )}
            </Alert>
            
            {problems.corruptedCookies.length > 0 && (
              <div className="bg-muted p-3 rounded-md">
                <h3 className="text-md font-medium mb-2">Cookies com problemas:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {problems.corruptedCookies.map((cookie, i) => (
                    <li key={i} className="text-sm font-mono">{cookie}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-medium mb-2">Log de Operações</h3>
              <div className="bg-black text-white font-mono p-4 rounded-md text-sm h-[200px] overflow-y-auto">
                {log.map((entry, i) => (
                  <div key={i}>{entry}</div>
                ))}
                {repairStatus === 'scanning' && (
                  <div className="flex items-center mt-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Verificando cookies...</span>
                  </div>
                )}
                {repairStatus === 'repairing' && (
                  <div className="flex items-center mt-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Reparando cookies...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 justify-between">
          <div className="flex gap-2">
            <Button 
              onClick={scanCookies} 
              disabled={repairStatus === 'scanning' || repairStatus === 'repairing'}
              variant="outline"
            >
              {repairStatus === 'scanning' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verificando...
                </>
              ) : 'Verificar Cookies'}
            </Button>
            
            <Button 
              onClick={repairLimitedCookies}
              disabled={repairStatus === 'scanning' || repairStatus === 'repairing'}
              variant="secondary"
            >
              Limpar Apenas Corrompidos
            </Button>
          </div>
          
          <Button 
            onClick={repairCookies} 
            disabled={repairStatus === 'scanning' || repairStatus === 'repairing'}
            variant="destructive"
          >
            {repairStatus === 'repairing' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Reparando...
              </>
            ) : 'Limpar Todos os Cookies'}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Se você continuar enfrentando problemas após limpar os cookies, entre em contato com o suporte técnico.</p>
        <p className="mt-2">
          <a href="/auth/login" className="underline hover:text-primary">Voltar para o login</a> | 
          <a href="/auth-test" className="underline hover:text-primary ml-2">Página de teste de autenticação</a>
        </p>
      </div>
    </div>
  )
} 