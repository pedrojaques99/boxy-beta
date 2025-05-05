"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "@/hooks/use-translations"
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AccessDeniedPage() {
  const { t } = useTranslations()
  const router = useRouter()

  const handleTryAgain = () => {
    // Clear any session storage items that might be causing the issue
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_authenticated')
      sessionStorage.removeItem('admin_user_id')
    }
    
    // Refresh the current page
    router.refresh()
    
    // Try navigating to admin dashboard 
    setTimeout(() => {
      router.push('/admin/dashboard')
    }, 100)
  }

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {t?.auth?.accessDenied?.title || "Acesso Negado"}
          </CardTitle>
          <CardDescription>
            {t?.auth?.accessDenied?.description || "Você não tem permissão para acessar esta página"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Admin Access Required</AlertTitle>
            <AlertDescription>
              To access the admin area, your account must have administrator privileges.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>If you believe you should have access to this page, please contact the system administrator.</p>
            <p className="mt-2">Your account needs the <strong>admin</strong> role in the database. Contact support with your account email to request elevated permissions.</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleTryAgain}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> 
            Tentar Novamente
          </Button>
          
          <Link href="/" className="w-full">
            <Button variant="default" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> 
              {t?.auth?.accessDenied?.backHome || "Voltar para o Início"}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
} 