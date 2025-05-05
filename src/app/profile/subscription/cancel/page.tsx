'use client'

import { useUser } from '@supabase/auth-helpers-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, getPlanById, PlanId } from '@/lib/plans'
import { Subscription } from '@/types/subscription'
import { AlertCircle, ArrowLeft, AlertTriangle, Check, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTranslations } from '@/hooks/use-translations'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function CancelSubscriptionPage() {
  const user = useUser()
  const { t } = useTranslations()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (!user) return
    loadSubscription()
  }, [user])

  const loadSubscription = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') throw error // Ignorar erro "não encontrado"
      setSubscription(data || null)
    } catch (err) {
      console.error('Error loading subscription:', err)
      toast.error('Erro ao carregar assinatura')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!subscription) return
    
    setCancelling(true)
    try {
      const res = await fetch(`/api/pagarme/subscription/${subscription.pagarme_subscription_id}/cancel`, {
        method: 'PUT'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao cancelar assinatura')
      }

      setCancelled(true)
      toast.success('Assinatura cancelada com sucesso')
      
      // Recarregar a assinatura
      await loadSubscription()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar assinatura')
    } finally {
      setCancelling(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <p className="text-center mb-4">Você precisa estar logado para acessar esta página.</p>
            <Button onClick={() => router.push('/auth/login')}>Fazer Login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="text-center">Carregando informações da assinatura...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Cancelar Assinatura</CardTitle>
            <CardDescription>Gerenciar seu plano de assinatura</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-center mb-4">Você não possui uma assinatura ativa para cancelar.</p>
            <Button variant="outline" onClick={() => router.push('/profile/subscription')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Assinaturas
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const plan = getPlanById(subscription.plan_id as PlanId)

  if (cancelled) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Assinatura Cancelada</CardTitle>
            <CardDescription>Seu plano de assinatura foi cancelado</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <Check className="h-10 w-10 text-green-500 mb-4" />
            <p className="text-center mb-6">Sua assinatura foi cancelada com sucesso.</p>
            <p className="text-center text-muted-foreground mb-4">
              Você ainda terá acesso ao plano {plan?.name || subscription.plan_id} até o final do período atual em{' '}
              <span className="font-medium">
                {format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button variant="outline" onClick={() => router.push('/profile/subscription')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Assinaturas
              </Button>
              <Button onClick={() => router.push('/profile')}>
                Ir para Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Cancelar Assinatura</CardTitle>
          <CardDescription>Confirme o cancelamento do seu plano de assinatura</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Ao cancelar sua assinatura, você perderá acesso a todos os recursos premium após o final do período atual.
            </AlertDescription>
          </Alert>

          <div className="p-4 border rounded-md bg-muted/30">
            <h3 className="font-semibold mb-2">Informações da Assinatura</h3>
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plano:</span>
                <span className="font-medium">{plan?.name || subscription.plan_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-medium">{plan?.price || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Acesso até:</span>
                <span className="font-medium">
                  {format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground">
            Você continuará tendo acesso ao plano até o final do período atual. Não haverá reembolso pelo período não utilizado.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto" 
            onClick={() => router.push('/profile/subscription')}
            disabled={cancelling}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button 
            variant="destructive" 
            className="w-full sm:w-auto" 
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar Cancelamento'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 