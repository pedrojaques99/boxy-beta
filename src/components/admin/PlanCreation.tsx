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
}

export function PlanCreation() {
  const { t } = useTranslations()
  const [result, setResult] = useState<PlanCreationResult | null>(null)

  const handleCreatePlans = async () => {
    try {
      console.log('Iniciando criação de planos...')
      const res = await fetch('/api/pagarme/create-plans', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        const errorData = await res.json()
        console.error('Erro na resposta:', errorData)
        throw new Error(errorData.message || 'Failed to create plans')
      }

      const data = await res.json()
      console.log('Planos criados com sucesso:', data)
      setResult(data)
      toast.success(t?.admin?.plans?.created || 'Plans created successfully!')
    } catch (error) {
      console.error('Erro detalhado:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast.error(errorMessage)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t?.admin?.plans?.title || 'Create Pagar.me plans'}</h2>
      <Button onClick={handleCreatePlans} className="bg-green-600 hover:bg-green-700">
        {t?.admin?.plans?.create || 'Create plans'}
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