'use client'

import { ThemeProvider } from '@/lib/theme-context'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => createPagesBrowserClient({
    cookieOptions: {
      name: 'sb-auth-token',
      lifetime: 60 * 60 * 24 * 7, // 1 week
      domain: process.env.NEXT_PUBLIC_SITE_URL,
      sameSite: 'lax',
      path: '/'
    }
  }))

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
