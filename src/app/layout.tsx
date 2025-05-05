import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import "./globals.css"
import { Layout } from "@/components/layout"
import { Providers } from "@/components/providers"
import { cn } from "@/lib/utils"
import { Toaster } from 'react-hot-toast'

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F0F" }
  ]
}

export const metadata: Metadata = {
  title: "Boxy",
  description: "The only need-to-have toolbox for creators and designers",
  other: {
    // Prevenir cache excessivo
    "cache-control": "no-cache, no-store, must-revalidate, max-age=0",
    "pragma": "no-cache",
    "expires": "0"
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        {/* Script para detecção de versão e limpeza de cache */}
        <script src="/clear-cache/force-refresh.js" />
        
        {/* Script para detectar e limpar cookies corrompidos do Supabase */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                // Detectar cookies corrompidos do Supabase
                const cookies = document.cookie.split(';');
                let hasCleaned = false;
                
                cookies.forEach(cookie => {
                  const [name, value] = cookie.split('=').map(s => s.trim());
                  
                  // Verificar se é um cookie do Supabase
                  if (name && (name.includes('supabase') || name.includes('sb-'))) {
                    try {
                      // Tentar validar JSON se começar com {
                      if (value && value.startsWith('{')) {
                        JSON.parse(value);
                      }
                      // Tentar validar base64 se começar com base64-
                      else if (value && value.startsWith('base64-')) {
                        const base64Part = value.substring(7);
                        atob(base64Part);
                      }
                    } catch (e) {
                      // Cookie corrompido, limpar
                      console.warn('Removendo cookie corrompido:', name);
                      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                      hasCleaned = true;
                    }
                  }
                });
                
                // Se limparmos algum cookie, verificar flag para evitar loop de limpeza
                if (hasCleaned && !window.location.pathname.includes('/cookie-repair') && 
                    !window.location.pathname.includes('/auth-recovery')) {
                  const alreadyAttemptedParam = new URLSearchParams(window.location.search).get('cookie_cleaned');
                  
                  if (!alreadyAttemptedParam) {
                    // Apenas redireciona se ainda não tentamos limpar
                    console.log('Limpeza de cookies realizada, redirecionando para recuperação');
                    
                    // Adicionar parâmetro para prevenir loop de redirecionamento
                    window.location.href = '/auth-recovery?cookie_cleaned=true';
                  }
                }
              } catch (err) {
                console.error('Erro ao verificar cookies:', err);
              }
            })();
          `
        }} />
      </head>
      <body
        className={cn(
          GeistSans.className,
          "min-h-screen antialiased",
          "selection:bg-accent selection:text-accent-foreground",
          "scrollbar-thin scrollbar-thumb-accent scrollbar-track-background",
          "theme-transition"
        )}
        style={{
          backgroundColor: "hsl(var(--background))",
          color: "hsl(var(--foreground))"
        }}
      >
        <Providers>
          <Layout>
            <div className="relative flex min-h-screen flex-col">
              {children}
            </div>
          </Layout>
        </Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
