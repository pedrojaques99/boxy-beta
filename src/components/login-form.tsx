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

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

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
  const supabase = createClient()

  // Verificar se já está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (data?.session?.user && !error) {
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
  }, [redirectTo, router, supabase.auth])

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
  })

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed. Please try again.'
      setError({ message: errorMessage, code: 'oauth_error' })
      setIsLoading(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const supabase = createClient()
    setIsEmailLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) throw error
      
      // Redirect will be handled by Supabase's sign-in mechanism
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid email or password'
      setError({ message: errorMessage, code: 'auth_error' })
      setIsEmailLoading(false)
    }
  }

  if (!t) return null // Wait for translations to load

  return (
    <div className={cn('flex flex-col items-center gap-6', className)} {...props}>
      <Card className="bg-transparent backdrop-blur supports-[backdrop-filter]:bg-transparent p-4 w-[400px]">
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
                      <FormLabel className="text-foreground dark:text-white">Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="name@example.com" 
                          type="email" 
                          {...field} 
                          disabled={isEmailLoading}
                          className="bg-background text-foreground dark:text-white placeholder:text-muted-foreground border-input focus-visible:ring-1"
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
                      <FormLabel className="text-foreground dark:text-white">Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••••" 
                          type="password" 
                          {...field} 
                          disabled={isEmailLoading}
                          className="bg-background text-foreground dark:text-white placeholder:text-muted-foreground border-input focus-visible:ring-1"
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
                  disabled={isEmailLoading}
                >
                  {isEmailLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign in with Email'
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
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => handleSocialLogin('github')} 
                className="relative bg-background hover:bg-accent" 
                disabled={isLoading || isEmailLoading}
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Image
                    src="/icons/mdi_github.svg"
                    alt="GitHub"
                    width={20}
                    height={20}
                    className="invert light:invert-0 opacity-80"
                  />
                )}
              </Button>
              <Button 
                onClick={() => handleSocialLogin('google')} 
                className="relative bg-background hover:bg-accent" 
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
              Don&apos;t have an account? Sign up
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
