"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useTranslations } from '@/hooks/use-translations'
import { AlertCircle, CheckCircle, InfoIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Plan {
  id: string
  name: string
  interval?: string
  status: string
}

interface PlanCreationResult {
  success: boolean
  plans?: Plan[]
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
      
      <Alert className="mb-4">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Informação importante</AlertTitle>
        <AlertDescription>
          Este recurso cria planos no Pagar.me utilizando a API V5. Certifique-se de que a variável PAGARME_API_KEY está configurada no arquivo .env.
        </AlertDescription>
      </Alert>
      
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
        <Card className={result.success ? "border-green-500" : "border-red-500"}>
          <CardHeader className={result.success ? "bg-green-50" : "bg-red-50"}>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="text-green-500 h-5 w-5" />
                  <span>Planos criados com sucesso</span>
                </>
              ) : (
                <>
                  <AlertCircle className="text-red-500 h-5 w-5" />
                  <span>Erro ao criar planos</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {result.success && result.plans ? (
              <div className="space-y-4">
                <p>Os seguintes planos foram criados na plataforma Pagar.me:</p>
                <div className="grid gap-3">
                  {result.plans.map((plan: Plan) => (
                    <div key={plan.id} className="bg-gray-50 p-3 rounded-md">
                      <div><strong>Nome:</strong> {plan.name}</div>
                      <div><strong>ID:</strong> {plan.id}</div>
                      <div><strong>Periodicidade:</strong> {plan.interval === 'month' ? 'Mensal' : plan.interval === 'year' ? 'Anual' : plan.interval}</div>
                      <div><strong>Status:</strong> {plan.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-red-600">
                <p className="font-semibold mb-2">Erro: {result.error}</p>
                {result.details && (
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60">
                    {typeof result.details === 'object' 
                      ? JSON.stringify(result.details, null, 2) 
                      : String(result.details)}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 