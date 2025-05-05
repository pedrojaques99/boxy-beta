'use client'

import { ThemeProvider } from '@/lib/theme-context'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SupabaseProvider } from '@/lib/supabase/client-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <ThemeProvider>
        <TooltipProvider>
          {children}
          <Toaster position="top-center" />
        </TooltipProvider>
      </ThemeProvider>
    </SupabaseProvider>
  )
}
