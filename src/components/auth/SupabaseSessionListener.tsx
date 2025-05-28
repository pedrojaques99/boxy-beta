'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SupabaseSessionListener() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { subscription } = supabase.auth.onAuthStateChange(() => {
      router.refresh()
    })

    return () => subscription?.unsubscribe?.()
  }, [router])

  return null
}
