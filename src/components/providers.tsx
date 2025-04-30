'use client'

import { ThemeProvider } from '@/lib/theme-context'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient())

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      <ThemeProvider>
        <TooltipProvider>
          {children}
          <Toaster position="top-center" />
        </TooltipProvider>
      </ThemeProvider>
    </SessionContextProvider>
  )
}
