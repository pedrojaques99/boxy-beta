'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { handleError } from '@/lib/error-handler'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSocialLoading, setIsSocialLoading] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      
      toast.success('Check your email to confirm your account')
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      const { error: errorMessage } = handleError(error, 'Error during sign up');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignUp = async (provider: 'github' | 'google') => {
    const supabase = createClient()
    setIsSocialLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      const { error: errorMessage } = handleError(error, 'Error during social sign up');
      toast.error(errorMessage);
      setIsSocialLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">Create an account</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your email and password to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      disabled={isLoading}
                      className="bg-background text-foreground dark:text-white placeholder:text-muted-foreground border-input focus-visible:ring-1"
                      {...field}
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
                      type="password"
                      autoCapitalize="none"
                      autoComplete="new-password"
                      autoCorrect="off"
                      disabled={isLoading}
                      className="bg-background text-foreground dark:text-white placeholder:text-muted-foreground border-input focus-visible:ring-1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-white">Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoCapitalize="none"
                      autoComplete="new-password"
                      autoCorrect="off"
                      disabled={isLoading}
                      className="bg-background text-foreground dark:text-white placeholder:text-muted-foreground border-input focus-visible:ring-1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account'
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
            onClick={() => handleSocialSignUp('github')} 
            className="relative bg-background hover:bg-accent" 
            disabled={isSocialLoading || isLoading}
            variant="outline"
          >
            {isSocialLoading ? (
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
            onClick={() => handleSocialSignUp('google')} 
            className="relative bg-background hover:bg-accent" 
            variant="outline"
            disabled={isSocialLoading || isLoading}
          >
            {isSocialLoading ? (
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
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link href="/auth/login">
          <Button 
            variant="link" 
            className="px-0 font-normal text-muted-foreground hover:text-foreground" 
            disabled={isLoading || isSocialLoading}
          >
            Already have an account? Sign in
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
