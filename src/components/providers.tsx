'use client'

import { ThemeProvider } from '@/lib/theme-context'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SupabaseProvider } from '@/lib/supabase/client-provider'
import { SupabaseSessionListener } from '@/components/auth/SupabaseSessionListener'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <SupabaseSessionListener />
      <ThemeProvider>
        <TooltipProvider>
          {children}
          <Toaster position="top-center" />
        </TooltipProvider>
      </ThemeProvider>
    </SupabaseProvider>
  )
}
