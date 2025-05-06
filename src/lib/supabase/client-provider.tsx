'use client'

import { createContext, useContext, useState } from 'react'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createClient } from './client'
import { Database } from '@/types/supabase'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  // Create a single instance of the Supabase client
  const [supabaseClient] = useState(() => createClient())

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  )
} 