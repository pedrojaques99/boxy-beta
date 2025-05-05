'use client'

import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useState } from 'react'
import { createClient } from './client'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  // Create a single instance of the Supabase client
  const [supabaseClient] = useState(() => createClient())

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  )
} 