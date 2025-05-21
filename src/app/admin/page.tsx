"use client"

import { AuthGuard } from '@/components/admin/AuthGuard'
import { useTranslations } from '@/hooks/use-translations'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoIcon, Loader2, Users, Download, Package, Layers, ListChecks } from 'lucide-react'
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
  const [isFocused, setIsFocused] = useState(true)
  
  // Handle focus/blur events to detect tab switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsFocused(true)
        // Force remount of page components when coming back to tab
        setIsMounted(false)
        setTimeout(() => setIsMounted(true), 100)
      } else {
        setIsFocused(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Initial mount
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 500) // Give enough time for auth to initialize
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearTimeout(timer)
    }
  }, [])

  // Check if we've loaded the page previously in this session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasVisitedBefore = sessionStorage.getItem('admin_page_loaded') === 'true'
      
      if (!hasVisitedBefore) {
        // First time visit in this session, mark it
        sessionStorage.setItem('admin_page_loaded', 'true')
      } else if (!isMounted) {
        // Already visited before, immediately set mounted
        setIsMounted(true)
      }
    }
  }, [isMounted])

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
        </div>
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Acesso admin</AlertTitle>
          <AlertDescription>
            Se você está vendo esta página, sua conta tem permissões de administrador configuradas corretamente.
          </AlertDescription>
        </Alert>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/crud">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Package className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-lg">Produtos</div>
                <div className="text-sm text-muted-foreground text-center">Gerencie todos os produtos da plataforma.</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/plans">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <ListChecks className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-lg">Planos</div>
                <div className="text-sm text-muted-foreground text-center">Crie e gerencie planos de assinatura.</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/downloads">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Download className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-lg">Downloads</div>
                <div className="text-sm text-muted-foreground text-center">Veja e gerencie os downloads realizados.</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/subscribers">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Users className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-lg">Assinantes</div>
                <div className="text-sm text-muted-foreground text-center">Acompanhe todos os assinantes da plataforma.</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/resources">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Layers className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-lg">Recursos</div>
                <div className="text-sm text-muted-foreground text-center">Gerencie recursos e materiais extras.</div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AuthGuard>
  )
}
