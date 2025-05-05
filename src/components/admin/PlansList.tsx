"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useTranslations } from '@/hooks/use-translations'
import { RefreshCcw, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Plan {
  id: string
  name: string
  status: string
  interval: string
  interval_count: number
  billing_type: string
  minimum_price: number
  trial_period_days: number
  payment_methods: string[]
  created_at: string
}

interface PlanListResult {
  success: boolean
  plans?: Plan[]
  count?: number
  error?: string
  details?: any
}

export function PlansList() {
  const { t } = useTranslations()
  const [result, setResult] = useState<PlanListResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const fetchPlans = async () => {
    try {
      setIsLoading(true)
      console.log('Buscando planos existentes...')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
      
      const res = await fetch('/api/pagarme/list-plans', { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      const data = await res.json()
      console.log('Resposta da API:', data)

      if (!res.ok) {
        console.error('Erro na resposta:', data)
        throw new Error(data.error || 'Failed to fetch plans')
      }

      setResult(data)
      if (data.count === 0) {
        toast.info('Nenhum plano encontrado. Crie novos planos através do botão acima.')
      } else {
        toast.success(`${data.count} planos encontrados!`)
      }
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

  useEffect(() => {
    if (isClient) {
      fetchPlans()
    }
  }, [isClient])

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading && !result) {
    return <div className="flex items-center justify-center h-24 w-full bg-gray-50 rounded-md">
      <div className="animate-spin h-6 w-6 border-2 border-gray-500 border-t-transparent rounded-full"></div>
      <span className="ml-2">Carregando planos...</span>
    </div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Planos existentes</h3>
        <Button 
          onClick={fetchPlans} 
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <RefreshCcw className="h-4 w-4" />
          {isLoading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {result?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao buscar planos</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}
      
      {result?.success && result.plans && result.plans.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nenhum plano encontrado</AlertTitle>
          <AlertDescription>
            Não há planos cadastrados no Pagar.me. Utilize o botão "Criar planos" acima para criar novos planos.
          </AlertDescription>
        </Alert>
      )}

      {result?.success && result.plans && result.plans.length > 0 && (
        <div className="grid gap-3">
          {result.plans.map((plan: Plan) => (
            <Card key={plan.id} className="overflow-hidden">
              <div className={`h-2 ${plan.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <CardContent className="p-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-md">{plan.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {plan.status === 'active' ? 'Ativo' : plan.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>ID:</strong> <span className="text-xs">{plan.id}</span></div>
                    <div><strong>Criado em:</strong> {formatDate(plan.created_at)}</div>
                    <div><strong>Periodicidade:</strong> {plan.interval === 'month' ? 'Mensal' : plan.interval === 'year' ? 'Anual' : plan.interval} ({plan.interval_count}x)</div>
                    <div><strong>Cobrança:</strong> {plan.billing_type}</div>
                    <div><strong>Preço mínimo:</strong> {formatPrice(plan.minimum_price)}</div>
                    <div><strong>Dias de teste:</strong> {plan.trial_period_days}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 