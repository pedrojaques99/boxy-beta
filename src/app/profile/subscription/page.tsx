'use client'

import { useUser } from '@supabase/auth-helpers-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, getPlanById, PlanId } from '@/lib/plans'
import { Subscription } from '@/types/subscription'
import { CheckoutWizard } from '@/components/checkout/CheckoutWizard'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTranslations } from '@/hooks/use-translations'
import { useRouter } from 'next/navigation'
import { Loader2, CreditCard, ReceiptText, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function SubscriptionPage() {
  const user = useUser()
  const { t } = useTranslations()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
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
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setSubscription(data || null)
    } catch (err) {
      console.error('Error loading subscription:', err)
      toast.error('Erro ao carregar assinatura')
    } finally {
      setLoading(false)
    }
  }

  const isSubscriptionActive = subscription?.status === 'active'

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

  const plan = subscription ? getPlanById(subscription.plan_id as PlanId) : null

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t?.profile?.subscription?.title || 'Assinatura'}</CardTitle>
          <CardDescription>
            {t?.profile?.subscription?.description || 'Gerencie seu plano de assinatura'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscription ? (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isSubscriptionActive ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    <h3 className="font-semibold text-lg">
                      {plan?.name || subscription.plan_id}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Status: <span className="capitalize font-medium">{subscription.status}</span>
                  </p>
                </div>
                <div className="md:text-right">
                  <div className="text-2xl font-bold">
                    {plan?.price || formatPrice(0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Próxima cobrança em {format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/profile/subscription/payment-method" passHref>
                  <Button className="w-full h-auto py-6" variant="outline">
                    <div className="flex flex-col items-center text-center">
                      <CreditCard className="h-6 w-6 mb-2" />
                      <span className="font-medium">Atualizar Método de Pagamento</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Cartão de crédito e outras formas
                      </span>
                    </div>
                  </Button>
                </Link>
                
                <Link href="/profile/subscription/history" passHref>
                  <Button className="w-full h-auto py-6" variant="outline">
                    <div className="flex flex-col items-center text-center">
                      <ReceiptText className="h-6 w-6 mb-2" />
                      <span className="font-medium">Histórico de Pagamentos</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Faturas e recibos
                      </span>
                    </div>
                  </Button>
                </Link>
                
                {isSubscriptionActive && (
                  <Link href="/profile/subscription/cancel" className="contents">
                    <Button 
                      variant="outline" 
                      className="w-full h-auto py-6 border-red-200 hover:border-red-300 hover:bg-red-50"
                    >
                      <div className="flex flex-col items-center text-center">
                        <AlertTriangle className="h-6 w-6 mb-2 text-red-500" />
                        <span className="font-medium text-red-500">Cancelar Assinatura</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          Acesso até o final do período
                        </span>
                      </div>
                    </Button>
                  </Link>
                )}

                {!isSubscriptionActive && (
                  <Button 
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full h-auto py-6"
                    variant="outline"
                  >
                    <div className="flex flex-col items-center text-center">
                      <CheckCircle className="h-6 w-6 mb-2" />
                      <span className="font-medium">Reativar Assinatura</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Recupere os benefícios premium
                      </span>
                    </div>
                  </Button>
                )}
              </div>

              {/* Informações detalhadas da assinatura */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-3">Detalhes da Assinatura</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-sm mb-2 text-muted-foreground">ID da Assinatura</h4>
                    <p className="font-mono text-sm">{subscription.pagarme_subscription_id || subscription.id}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Data de Início</h4>
                    <p>{format(new Date(subscription.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Última Atualização</h4>
                    <p>{format(new Date(subscription.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Período Atual</h4>
                    <p>Até {format(new Date(subscription.current_period_end), "dd/MM/yyyy", { locale: ptBR })}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-4 p-3 rounded-full bg-muted/50">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t?.profile?.subscription?.noSubscription || 'Você não possui uma assinatura ativa'}
              </h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Aproveite os recursos premium do BOXY assinando um de nossos planos. Cancele a qualquer momento.
              </p>
              <Button onClick={() => setIsCheckoutOpen(true)}>
                {t?.profile?.subscription?.subscribe || 'Assinar Agora'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogTitle className="sr-only">Checkout</DialogTitle>
          <CheckoutWizard 
            defaultPlanId={subscription?.plan_id as PlanId} 
            onSuccess={() => {
              setIsCheckoutOpen(false)
              loadSubscription()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
} 