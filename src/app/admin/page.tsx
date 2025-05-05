"use client"

import { AuthGuard } from '@/components/admin/AuthGuard'
import { useTranslations } from '@/hooks/use-translations'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoIcon, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Suspense, useState, useEffect } from 'react'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'

// Lazy load the components with proper error handling
const PlanCreation = dynamic(() => import('@/components/admin/PlanCreation').then(mod => mod.PlanCreation), {
  loading: () => <div className="flex items-center space-x-2 p-4 rounded">
    <Loader2 className="h-5 w-5 animate-spin" />
    <span>Carregando criação de planos...</span>
  </div>,
  ssr: false
})

const PlansList = dynamic(() => import('@/components/admin/PlansList').then(mod => mod.PlansList), {
  loading: () => <div className="flex items-center space-x-2 p-4 rounded">
    <Loader2 className="h-5 w-5 animate-spin" />
    <span>Carregando lista de planos...</span>
  </div>,
  ssr: false
})

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="p-4 border border-red-200 rounded bg-red-50">
      <Alert variant="destructive">
        <AlertTitle>Ocorreu um erro ao carregar o componente</AlertTitle>
        <AlertDescription>
          {error.message}
          <div className="mt-2">
            <Button onClick={resetErrorBoundary} variant="outline" size="sm">
              Tentar novamente
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default function AdminPage() {
  const { t } = useTranslations()
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando painel administrativo...</span>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t?.admin?.title || 'Admin Dashboard'}</h1>
          <div className="space-x-4">
            <Link href="/admin/crud">
              <Button variant="outline">
                {t?.admin?.products?.title || 'Manage Products'}
              </Button>
            </Link>
          </div>
        </div>
        
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Acesso admin</AlertTitle>
          <AlertDescription>
            Se você está vendo esta página, sua conta tem permissões de administrador configuradas corretamente.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="plans">Gerenciar Planos</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Planos Pagar.me</CardTitle>
                <CardDescription>
                  Crie e gerencie planos para assinaturas na plataforma Pagar.me.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <Suspense fallback={<div className="animate-pulse h-10 bg-gray-200 rounded" />}>
                    <PlanCreation />
                  </Suspense>
                </ErrorBoundary>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Planos existentes</CardTitle>
                <CardDescription>
                  Visualize e gerencie os planos existentes na plataforma Pagar.me.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <Suspense fallback={<div className="animate-pulse h-32 bg-gray-200 rounded" />}>
                    <PlansList />
                  </Suspense>
                </ErrorBoundary>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>
                  Visualize e gerencie os usuários do sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Este recurso será implementado em breve.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>
                  Gerencie as configurações do sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Este recurso será implementado em breve.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}
