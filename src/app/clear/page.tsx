"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function ClearCachePage() {
  const router = useRouter()

  useEffect(() => {
    const clearCache = async () => {
      try {
        // Limpar localStorage
        localStorage.clear()
        
        // Limpar sessionStorage
        sessionStorage.clear()
        
        // Tentar limpar cache da aplicação (se suportado)
        if ('caches' in window) {
          const cacheNames = await caches.keys()
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          )
        }
        
        console.log('Cache limpo com sucesso')
        
        // Redirecionar para a home após limpeza
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } catch (error) {
        console.error('Erro ao limpar cache:', error)
        
        // Tentar redirecionar mesmo com erro
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    }
    
    clearCache()
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <h1 className="text-2xl font-bold mb-2">Limpando Cache</h1>
      <p className="text-muted-foreground max-w-md mb-2">
        Removendo dados temporários para garantir o melhor funcionamento da aplicação.
      </p>
      <p className="text-sm text-muted-foreground">
        Você será redirecionado automaticamente em alguns instantes...
      </p>
    </div>
  )
} 