'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.search)
        if (error) throw error
        
        router.push('/')
      } catch (error) {
        console.error('Error handling auth callback:', error)
        router.push('/auth/login?error=auth-callback-failed')
      }
    }

    handleCallback()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Processing login...</h1>
        <p className="text-muted-foreground">Please wait while we complete your authentication.</p>
      </div>
    </div>
  )
} 