'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useState } from 'react'
import { useTranslations } from '@/hooks/use-translations'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const { t } = useTranslations()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/protected`,
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  if (!t) return null // Wait for translations to load

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t.auth.welcome}</CardTitle>
          <CardDescription>{t.auth.signInToContinue}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {error && <p className="text-sm text-destructive-500">{error}</p>}
            <Button 
              onClick={() => handleSocialLogin('github')} 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? t.auth.loggingIn : t.auth.continueWithGithub}
            </Button>
            <Button 
              onClick={() => handleSocialLogin('google')} 
              className="w-full" 
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? t.auth.loggingIn : t.auth.continueWithGoogle}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
