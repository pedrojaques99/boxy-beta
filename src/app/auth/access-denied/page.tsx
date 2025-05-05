"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "@/hooks/use-translations"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AccessDeniedPage() {
  const { t } = useTranslations()

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {t?.auth?.accessDenied?.title || "Access Denied"}
          </CardTitle>
          <CardDescription>
            {t?.auth?.accessDenied?.description || "You don't have permission to access this page"}
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
        <CardFooter>
          <Link href="/" className="w-full">
            <Button variant="default" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> 
              {t?.auth?.accessDenied?.backHome || "Back to Home"}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
} 