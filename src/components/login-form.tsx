'use client'

import { cn } from '@/lib/utils'
import { getAuthService } from '@/lib/auth/auth-service'
import { handleError } from '@/lib/error-handler'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { useTranslations } from '@/hooks/use-translations'
import { Separator } from '@/components/ui/separator'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface LoginError {
  message: string;
  code?: string;
}

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const { t } = useTranslations()
  const [error, setError] = useState<LoginError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const router = useRouter()
  const authService = getAuthService()

  const formSchema = z.object({
    email: z.string()
      .email(t?.auth?.error?.invalidEmail || 'Invalid email address')
      .min(1, t?.auth?.error?.emailRequired || 'Email is required'),
    password: z.string()
      .min(8, t?.auth?.error?.weakPassword || 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  })

  // Verificar se já está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await authService.isAuthenticated()
        if (isAuthenticated) {
          console.log('Usuário já autenticado, redirecionando...')
          // Se já autenticado e temos um redirect, vamos para lá
          if (redirectTo) {
            router.push(redirectTo)
          } else {
            router.push('/')
          }
        }
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err)
        
        // Verificar se é um erro de cookie JSON inválido
        if (err instanceof Error && 
            (err.message.includes('parse cookie') || 
             err.message.includes('JSON') || 
             err.message.includes('token'))) {
          console.error('Detectado problema com cookie, redirecionando para reparo...')
          window.location.href = '/cookie-repair'
        }
      }
    }
    
    checkAuth()
  }, [redirectTo, router, authService])

  // Get redirectTo from URL if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirectTo')
      if (redirect) {
        setRedirectTo(redirect)
      }
    }
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange', // Enable real-time validation
  })

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    setIsLoading(true)
    setError(null)

    try {
      // The redirectTo parameter for after authentication
      const finalRedirectTo = redirectTo 
        ? `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
        : `${window.location.origin}/auth/callback`;
      
      console.log('Starting OAuth flow with redirectTo:', finalRedirectTo);
      
      // Let the authService handle storing the state in cookies
      const { error } = await authService.signInWithOAuth(provider, finalRedirectTo);
      
      if (error) {
        console.error('OAuth login error:', error);
        throw error;
      }
    } catch (error: unknown) {
      console.error('Social login error:', error);
      const { error: errorMessage } = handleError(error, 'Authentication failed');
      setError({ message: errorMessage, code: 'oauth_error' })
      setIsLoading(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsEmailLoading(true)
    setError(null)

    try {
      // Check for rate limiting
      const { error } = await authService.signInWithPassword(values.email, values.password);
      if (error) throw error;
      
      // Redirect will be handled by Supabase's sign-in mechanism
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t?.auth?.error?.invalidPassword || 'Invalid email or password'
      setError({ message: errorMessage, code: 'auth_error' })
      setIsEmailLoading(false)
    }
  }

  if (!t) return null // Wait for translations to load

  return (
    <div className={cn('flex flex-col items-center gap-6', className)} {...props}>
      <Card className="bg-transparent backdrop-blur supports-[backdrop-filter]:bg-transparent p-6 w-[600px]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">{t.auth.welcome}</CardTitle>
          <CardDescription className="text-muted-foreground">{t.auth.signInToContinue}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground dark:text-white">E-mail</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="seu@email.com" 
                          type="email" 
                          {...field} 
                          disabled={isEmailLoading}
                          className="bg-background/50 text-foreground dark:text-white placeholder:text-muted-foreground/70 border-input focus-visible:ring-1 focus-visible:ring-primary"
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground dark:text-white">Senha</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••••" 
                          type="password" 
                          {...field} 
                          disabled={isEmailLoading}
                          className="bg-background/50 text-foreground dark:text-white placeholder:text-muted-foreground/70 border-input focus-visible:ring-1 focus-visible:ring-primary"
                          autoComplete="current-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error.message}</p>
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90" 
                  disabled={isEmailLoading || !form.formState.isValid}
                >
                  {isEmailLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t.auth.loggingIn}</span>
                    </div>
                  ) : (
                    t.auth.signInWithEmail
                  )}
                </Button>
              </form>
            </Form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t.auth.or}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-4 w-full items-center">
              <Button 
                onClick={() => handleSocialLogin('google')} 
                className="relative bg-background hover:bg-accent w-1/4" 
                variant="outline"
                disabled={isLoading || isEmailLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Image
                    src="/icons/devicon_google.svg"
                    alt="Google"
                    width={20}
                    height={20}
                    title="Google"
                    className="opacity-80"
                  />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/sign-up">
            <Button 
              variant="link" 
              className="px-0 font-normal text-muted-foreground hover:text-foreground" 
              disabled={isLoading || isEmailLoading}
            >
              {t.auth.dontHaveAccount}
            </Button>
          </Link>
        </CardFooter>
        
        {/* Troubleshooting link */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          <Link href="/auth-diagnostics" className="hover:underline">
            {t.auth.troubleshooting.description}
          </Link>
        </div>
      </Card>
    </div>
  )
}
