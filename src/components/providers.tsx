'use client'

import { ThemeProvider } from '@/lib/theme-context'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SupabaseProvider } from '@/lib/supabase/client-provider'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  
  // Garantir que tudo está carregado antes de renderizar
  useEffect(() => {
    // Dar tempo suficiente para a autenticação inicializar
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
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
