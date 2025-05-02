"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useTranslations } from '@/hooks/use-translations'

interface PlanCreationResult {
  success: boolean
  plans?: {
    id: string
    name: string
  }[]
  error?: string
  details?: any
}

export function PlanCreation() {
  const { t } = useTranslations()
  const [result, setResult] = useState<PlanCreationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreatePlans = async () => {
    try {
      setIsLoading(true)
      console.log('Iniciando criação de planos...')
      
      const res = await fetch('/api/pagarme/create-plans', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await res.json()
      console.log('Resposta da API:', data)

      if (!res.ok) {
        console.error('Erro na resposta:', data)
        throw new Error(data.error || 'Failed to create plans')
      }

      setResult(data)
      toast.success(t?.admin?.plans?.created || 'Plans created successfully!')
    } catch (error) {
      console.error('Erro detalhado:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setResult({
        success: false,
        error: errorMessage,
        details: error
      })
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t?.admin?.plans?.title || 'Create Pagar.me plans'}</h2>
      <Button 
        onClick={handleCreatePlans} 
        className="bg-green-600 hover:bg-green-700"
        disabled={isLoading}
      >
        {isLoading 
          ? (t?.admin?.plans?.creating || 'Creating plans...') 
          : (t?.admin?.plans?.create || 'Create plans')
        }
      </Button>
      {result && (
        <Card>
          <CardContent className="p-4">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 